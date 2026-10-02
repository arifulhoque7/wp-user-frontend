import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { Selectors } from './selectors';
import { Users } from '../utils/testData';
import { parityDir, parityWp, type ParitySite } from '../utils/paritySites';

/**
 * Stored form as dumped by parity/wp/dump-form.php: every value with its PHP type,
 * IDs replaced by positions.
 */
export interface FormDump {
    post_type: string;
    post_status: string;
    post_title: string;
    meta: Record<string, unknown>;
    fields: Array<{
        menu_order: number;
        post_status: string;
        post_content: unknown;
        meta: Record<string, unknown>;
    }>;
}

/**
 * Data-layer page object for the parity suite (develop vs branch). Seeds identical
 * data on both sites and compares what each site stored.
 */
export class ParityPage {

    /** Create a form on a site from a fixture in parity/fixtures and return its id. */
    doSeedForm(site: ParitySite, fixture: string): number {
        const out = parityWp(site, ['eval-file', path.join(parityDir, 'wp', 'seed-form.php'), path.join(parityDir, 'fixtures', fixture)]);
        const id = Number(out.trim().split(/\s+/).pop());
        if (!id) {
            throw new Error(`Seeding ${fixture} on ${site.name} returned no id: ${out}`);
        }
        return id;
    }

    /** Read a stored form from a site. */
    readForm(site: ParitySite, formId: number): FormDump {
        return JSON.parse(parityWp(site, ['eval-file', path.join(parityDir, 'wp', 'dump-form.php'), String(formId)])) as FormDump;
    }

    /** Write a value as pretty JSON (evidence files next to the test output) and return the path. */
    doWriteJson(file: string, value: unknown): string {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify(value, null, 2));
        return file;
    }

    /** Assert two stored forms are identical (values and PHP types). */
    validateFormsEqual(develop: FormDump, branch: FormDump) {
        expect(branch, 'branch storage must equal develop storage').toStrictEqual(develop);
    }
}

/** Builder screen slug per stored post type. */
const builderPage: Record<string, string> = {
    wpuf_forms: 'wpuf-post-forms',
    wpuf_profile: 'wpuf-profile-forms',
};

/**
 * Browser-side page object for one parity site. Each site gets its own isolated
 * context so the two logins never share cookies.
 */
export class ParitySitePage {
    private constructor(readonly site: ParitySite, readonly context: BrowserContext, readonly page: Page) {}

    /** Open an isolated, logged-in admin session on a site. */
    static async doOpen(browser: Browser, site: ParitySite): Promise<ParitySitePage> {
        const context = await browser.newContext({ baseURL: site.url });
        const page = await context.newPage();
        await page.goto('/wp-login.php');
        await page.locator(Selectors.login.basicLogin.loginEmailField).fill(Users.adminUsername);
        await page.locator(Selectors.login.basicLogin.loginPasswordField).fill(Users.adminPassword);
        await Promise.all([
            page.waitForURL(/wp-admin/),
            page.locator(Selectors.login.basicLogin.loginButton).click(),
        ]);
        return new ParitySitePage(site, context, page);
    }

    /** Open the builder of a form and wait until its Save button is usable. */
    async doOpenBuilder(postType: string, formId: number) {
        await this.page.goto(`/wp-admin/admin.php?page=${builderPage[postType]}&action=edit&id=${formId}`);
        await expect(this.page.locator(Selectors.parity.builderSaveButton).first()).toBeEnabled();
    }

    /** Click Save without touching anything and wait for the save request to succeed. */
    async doSaveBuilder() {
        const saved = this.page.waitForResponse((response) =>
            response.url().includes('admin-ajax.php')
            && (response.request().postData() || '').includes('wpuf_form_builder_save_form'));
        await this.page.locator(Selectors.parity.builderSaveButton).first().click();
        const response = await saved;
        expect(response.ok(), 'builder save request must succeed').toBeTruthy();
        expect(await response.json(), 'builder save must report success').toMatchObject({ success: true });
    }

    /** Open the "add new" builder; returns the id of the created draft form. */
    async doOpenNewBuilder(postType: string): Promise<number> {
        await this.page.goto(`/wp-admin/admin.php?page=${builderPage[postType]}&action=add-new`);
        await this.page.waitForURL(/action=edit&id=\d+/);
        await expect(this.page.locator(Selectors.parity.builderSaveButton).first()).toBeEnabled();
        return Number(new URL(this.page.url()).searchParams.get('id'));
    }

    /** Field types offered by the palette that add a field on click. */
    async getPaletteFieldTypes(): Promise<string[]> {
        return this.page.locator(Selectors.parity.paletteFieldButtons).evaluateAll(
            (buttons) => buttons.map((button) => button.getAttribute('data-form-field') || '').filter(Boolean));
    }

    /**
     * Click a palette button. Returns true when the stage gained a field, false when
     * the builder refused it with an alert (dismissed here).
     */
    async doAddFieldFromPalette(type: string): Promise<boolean> {
        const stage = this.page.locator(Selectors.parity.stageFields);
        const alert = this.page.locator(Selectors.parity.alertPopup);
        await this.doDismissAlerts();
        const before = await stage.count();
        await this.page.locator(Selectors.parity.paletteFieldButton(type)).first().click();
        await expect.poll(async () => (await stage.count()) > before || (await alert.count()) > 0, { message: `add ${type}`, timeout: 10000 })
            .toBeTruthy();
        const added = (await stage.count()) > before;
        await this.doDismissAlerts();
        return added;
    }

    /** Confirm any open SweetAlert (info or refusal) so the builder accepts clicks again. */
    async doDismissAlerts() {
        const alert = this.page.locator(Selectors.parity.alertPopup);
        while ((await alert.count()) > 0) {
            await this.page.locator(Selectors.parity.alertConfirm).first().click();
            await expect(alert).toHaveCount(0);
        }
    }

    async doClose() {
        await this.context.close();
    }
}
