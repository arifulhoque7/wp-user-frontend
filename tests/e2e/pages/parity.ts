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

    /** Read a fixture from parity/fixtures. */
    readFixture(fixture: string): FormDump {
        return JSON.parse(fs.readFileSync(path.join(parityDir, 'fixtures', fixture), 'utf-8')) as FormDump;
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

    /** Assert both builders showed the same option rows and accepted the same edits. */
    validateRowsEqual(develop: Record<string, string[]>, branch: Record<string, string[]>) {
        expect.soft(branch, 'branch builder must show the same option rows as develop').toStrictEqual(develop);
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
        page.setDefaultTimeout(15000);
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

    /**
     * Load an admin URL and collect page errors plus scripts/styles that came
     * back as something other than JS/CSS (a missing file 301s to an HTML 404).
     */
    async getLoadProblems(path: string): Promise<{ errors: string[]; badAssets: string[] }> {
        const errors: string[] = [];
        const badAssets: string[] = [];
        const onError = (error: Error) => errors.push(String(error).slice(0, 200));
        const onResponse = (response: import('@playwright/test').Response) => {
            const type = response.headers()['content-type'] || '';
            const kind = response.request().resourceType();
            if (['script', 'stylesheet'].includes(kind) && !/javascript|css/.test(type) && response.url().startsWith(this.site.url)) {
                badAssets.push(`${response.status()} ${response.url()}`);
            }
        };
        this.page.on('pageerror', onError);
        this.page.on('response', onResponse);
        await this.page.goto(path, { waitUntil: 'networkidle' });
        this.page.off('pageerror', onError);
        this.page.off('response', onResponse);
        return { errors, badAssets };
    }

    /**
     * On the React settings screen, type into the first text field, save, and
     * return the field id plus the body the screen posted.
     */
    async doEditFirstSettingsText(value: string): Promise<{ field: string; body: { settings: Record<string, Record<string, unknown>>; extra: Record<string, unknown> } }> {
        await this.page.goto('/wp-admin/admin.php?page=wpuf-settings');
        const input = this.page.locator(Selectors.parity.settingsTextInputs).first();
        await expect(input).toBeVisible();
        const field = (await input.getAttribute('id')) || '';
        await input.fill(value);
        const saved = this.page.waitForRequest((request) => request.url().includes('wpuf/v1/settings') && request.method() === 'POST');
        await this.page.locator(Selectors.parity.settingsSaveButton).first().click();
        const request = await saved;
        await request.response();
        return { field, body: request.postDataJSON() };
    }

    /** Raw HTML of an admin URL as served (for checks on what the server prints). */
    async getAdminHtml(path: string): Promise<string> {
        const response = await this.page.goto(path);
        return response ? response.text() : '';
    }

    /**
     * Post the builder save AJAX request directly from the open builder page,
     * with the serialized builder form changed by `edit` (query-string pairs).
     * Returns the JSON response.
     */
    async doRawBuilderSave(edit: Record<string, string | null>): Promise<{ success: boolean; data?: unknown }> {
        return this.page.evaluate(async (changes) => {
            const form = document.getElementById('wpuf-form-builder') as HTMLFormElement;
            const params = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
            for (const [key, value] of Object.entries(changes)) {
                if (value === null) {
                    params.delete(key);
                } else {
                    params.set(key, value);
                }
            }
            const body = new URLSearchParams({
                action: 'wpuf_form_builder_save_form',
                form_data: params.toString(),
                form_fields: '[]',
                notifications: '[]',
            });
            const response = await fetch((window as unknown as { ajaxurl: string }).ajaxurl, { method: 'POST', credentials: 'same-origin', body });
            return response.json();
        }, edit);
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

    /**
     * Open the settings panel of the stage field at a position (top level order) and
     * expand every section. Returns false when that stage item is not visible
     * (e.g. hidden fields), so nothing can be edited through the UI.
     */
    async doOpenFieldSettings(position: number): Promise<boolean> {
        await this.doDismissAlerts();
        const field = this.page.locator(Selectors.parity.stageFields).nth(position);
        if (!(await field.isVisible())) {
            return false;
        }
        await field.scrollIntoViewIfNeeded();
        await field.hover();
        await field.getByText(Selectors.parity.stageFieldEdit, { exact: true }).first().click();
        await expect(this.page.locator(Selectors.parity.fieldOptionsPanel)).toBeVisible();
        await expect(this.page.locator(Selectors.parity.fieldOptionRows).first()).toBeVisible();
        const heads = this.page.locator(Selectors.parity.fieldOptionsSectionHeads);
        for (let i = 0; i < await heads.count(); i++) {
            const body = heads.nth(i).locator('xpath=..').locator(Selectors.parity.fieldOptionsSectionBody);
            if ((await body.count()) === 0 || !(await body.first().isVisible())) {
                await heads.nth(i).click();
            }
        }
        return true;
    }

    /**
     * Apply the same deterministic edit to every option row of the open panel:
     * text-like inputs get a value derived from the row, radios pick their last
     * option, checkboxes toggle, selects pick their last option. Rows of the
     * given types are skipped. Returns one line per row (type, label, what was done)
     * so both sites can be compared row by row.
     */
    async doFillFieldOptions(tag: string, skipRowTypes: string[] = []): Promise<string[]> {
        const rows = this.page.locator(Selectors.parity.fieldOptionRows);
        const done: string[] = [];
        for (let i = 0; i < await rows.count(); i++) {
            const row = rows.nth(i);
            const rowType = ((await row.getAttribute('class')) || '').split(/\s+/).find((c) => c.startsWith('panel-field-opt-')) || 'unknown';
            const label = ((await row.locator('label').allTextContents())[0] || '').replace(/\s+/g, ' ').trim().slice(0, 40);
            if (skipRowTypes.includes(rowType)) {
                done.push(`${rowType} | ${label} | skipped`);
                continue;
            }
            const actions: string[] = [];
            const texts = row.locator('input[type="text"]:visible, input[type="number"]:visible, input[type="url"]:visible, input[type="email"]:visible, textarea:visible');
            for (let t = 0; t < await texts.count(); t++) {
                const input = texts.nth(t);
                if (!(await input.isEditable())) {
                    actions.push('readonly');
                    continue;
                }
                const isNumber = (await input.getAttribute('type')) === 'number';
                const value = isNumber ? String(7 + t) : /meta key/i.test(label) ? `p_${tag}_${t}` : `P ${tag} ${i}.${t}`;
                await input.fill(value);
                await input.blur();
                actions.push(`fill=${value}`);
            }
            const radios = row.locator('input[type="radio"]:visible');
            if (await radios.count()) {
                await radios.last().check({ force: true });
                actions.push(`radio=${await radios.last().getAttribute('value')}`);
            }
            const checks = row.locator('input[type="checkbox"]:visible');
            for (let c = 0; c < await checks.count(); c++) {
                await checks.nth(c).click({ force: true });
                actions.push(`toggle=${await checks.nth(c).getAttribute('value')}`);
            }
            const selects = row.locator('select:visible');
            for (let c = 0; c < await selects.count(); c++) {
                const values = await selects.nth(c).locator('option').evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));
                if (values.length) {
                    await selects.nth(c).selectOption(values[values.length - 1]);
                    actions.push(`select=${values[values.length - 1]}`);
                }
            }
            const customSelects = row.locator(Selectors.parity.customSelectButton);
            for (let c = 0; c < await customSelects.count(); c++) {
                await customSelects.nth(c).click();
                const options = row.locator(Selectors.parity.customSelectOption);
                const optionCount = await options.count();
                if (optionCount) {
                    const text = ((await options.nth(optionCount - 1).textContent()) || '').trim();
                    await options.nth(optionCount - 1).click();
                    actions.push(`select=${text}`);
                }
            }
            await this.doDismissAlerts();
            done.push(`${rowType} | ${label} | ${actions.join(', ') || 'no control'}`);
        }
        return done;
    }

    async doClose() {
        await this.context.close();
    }
}
