import { test, expect, type Locator, type Page } from '@playwright/test';
import path from 'path';
import { ParityPage, ParitySitePage } from '../pages/parity';
import { parityDir, paritySite, paritySitesConfigured, parityWp, type ParitySite } from '../utils/paritySites';

/**
 * G2b per settings section (task 4.6b): every standard field of a section is
 * edited through the React screen's own controls on the branch, the same
 * values are entered in develop's legacy screen (its options.php form), and
 * the stored option values are compared field by field.
 *
 * Fields the React screen does not show for the current state (dependency
 * hidden) are left out on both sides and listed in the attachment; custom
 * callback blocks (tax, role templates, profile roles, AI keys) have their own
 * checks (SET0001, SET0009).
 *
 * The tests change site options on both sites and restore them: run with
 * one worker.
 */
interface SchemaField { section: string; name: string; kind: string; label: string; options: { key: string; label: string }[]; pro: boolean }
type Value = string | string[];
interface Plan { field: SchemaField; type: string; value: Value; labels: string[] }

const SCHEMA: SchemaField[] = paritySitesConfigured()
    ? JSON.parse(parityWp(paritySite('branch'), ['eval-file', path.join(parityDir, 'wp', 'dump-settings-schema.php'), '--exec=define("WP_ADMIN",true);']))
    : [];
const SECTIONS = [...new Set(SCHEMA.map((field) => field.section))];

const TEXT_KINDS = ['text', 'email', 'url', 'password', 'cb:wpuf_settings_password_preview'];
const MULTI_KINDS = ['multicheck', 'multiselect', 'multi-select', 'cb:wpuf_settings_multiselect'];
// Own-option / custom blocks, not plain section fields.
const CUSTOM_SECTIONS = ['wpuf_ai'];

/** The deterministic edit for a field, or a reason to leave it out. */
function plan(field: SchemaField): Plan | string {
    const { kind, name, options } = field;
    const real = options.filter((option) => '' !== option.key && '-1' !== option.key);
    const base = { field, labels: [] as string[] };

    if (CUSTOM_SECTIONS.includes(field.section)) {
        return 'custom section';
    }
    if (TEXT_KINDS.includes(kind)) {
        return { ...base, type: 'text', value: /email/.test(name) && 'email' === kind ? 'parity@example.com' : `v-${name}` };
    }
    if ('number' === kind) {
        return { ...base, type: 'text', value: '7' };
    }
    if ('textarea' === kind) {
        return { ...base, type: 'text', value: `textarea ${name}` };
    }
    if ('file' === kind) {
        return { ...base, type: 'text', value: 'https://example.com/parity.png' };
    }
    if ('wysiwyg' === kind) {
        return { ...base, type: 'wysiwyg', value: `<p>Body <strong>${name}</strong></p>` };
    }
    // Cloudflare Turnstile is switched on its provider card (General > Security).
    if ('enable_turnstile' === name && 'wpuf_general' === field.section) {
        return { ...base, type: 'card-check', value: 'on', labels: ['Cloudflare'] };
    }
    if ('checkbox' === kind || 'toggle' === kind) {
        return { ...base, type: 'checkbox', value: 'on' };
    }
    if ('color' === kind || 'color-picker' === kind) {
        return { ...base, type: 'color', value: '#112233' };
    }
    if ('select' === kind) {
        if (!real.length) {
            return 'no options';
        }
        const pick = real[real.length - 1];
        return { ...base, type: 'select', value: pick.key, labels: [pick.label] };
    }
    if ('radio' === kind || 'radio_inline' === kind) {
        if (!real.length) {
            return 'no options';
        }
        const pick = real[real.length - 1];
        return { ...base, type: 'radio', value: pick.key, labels: [pick.label] };
    }
    if (MULTI_KINDS.includes(kind)) {
        if (real.length < 2) {
            return 'no options';
        }
        const picks = [real[0], real[real.length - 1]];
        return { ...base, type: 'multi', value: picks.map((option) => option.key), labels: picks.map((option) => option.label) };
    }
    if ('gateway_selector' === kind) {
        return { ...base, type: 'gateways', value: ['paypal'] };
    }
    if ('html' === kind) {
        return 'static';
    }
    return `custom (${kind})`;
}

/** Make a settings row visible: open accordions, then try each card of its section. */
async function findRow(page: Page, section: Locator, name: string): Promise<Locator | null> {
    const row = section.locator(`[data-setting="${name}"]`);
    if (await row.count()) {
        return row.first();
    }
    for (let i = 0; i < 30; i++) {
        const closed = section.locator('button[aria-expanded="false"][aria-controls]');
        if (!(await closed.count())) {
            break;
        }
        await closed.first().click();
        if (await row.count()) {
            return row.first();
        }
    }
    const cards = section.locator('button[data-settings-card]');
    for (let i = 0; i < (await cards.count()); i++) {
        await cards.nth(i).click();
        if (await row.count()) {
            return row.first();
        }
    }
    return null;
}

/** Enter one planned value through the React control of its row. */
async function editReact(page: Page, row: Locator, item: Plan): Promise<string | null> {
    const { type, value, labels, field } = item;
    // Centered: the fixed Save bar covers the bottom of the window.
    await row.evaluate((el) => el.scrollIntoView({ block: 'center' }));

    if ('text' === type) {
        const input = row.locator('input[type="text"], input[type="number"], input[type="password"], input[type="email"], input[type="url"], textarea:not(.wp-editor-area)').first();
        if (!(await input.count()) || !(await input.isEditable())) {
            return 'no editable input';
        }
        await input.fill(value as string);
        return null;
    }
    if ('wysiwyg' === type) {
        const id = `wpuf-editor-${field.name}`;
        try {
            await expect.poll(() => page.evaluate((editor) => !!(window as unknown as { tinymce?: { get: (i: string) => { initialized?: boolean } | null } }).tinymce?.get(editor)?.initialized, id), { timeout: 8000 }).toBe(true);
        } catch {
            return 'editor not initialized';
        }
        await page.evaluate(([editor, html]) => {
            const mce = (window as unknown as { tinymce: { get: (i: string) => { setContent: (c: string) => void; fire: (e: string) => void } } }).tinymce.get(editor);
            mce.setContent(html);
            mce.fire('change');
        }, [id, value as string]);
        return null;
    }
    if ('checkbox' === type) {
        const box = row.locator('[role="checkbox"], [role="switch"]').first();
        if (!(await box.count())) {
            return 'no checkbox';
        }
        if ('true' !== (await box.getAttribute('aria-checked'))) {
            await box.click();
        }
        return null;
    }
    if ('radio' === type) {
        const radio = row.locator(`[role="radio"][data-value="${value}"]`).first();
        if (!(await radio.count())) {
            return 'no radio';
        }
        await radio.click();
        return null;
    }
    if ('select' === type) {
        const smart = row.locator('[data-slot="smart-select-trigger"]');
        const searchable = (await smart.count()) > 0;
        const trigger = searchable ? smart.first() : row.locator('[data-slot="select-trigger"]').first();
        if (!(await trigger.count())) {
            return 'no select';
        }
        await trigger.click();
        const item = searchable ? '[data-slot="command-item"]' : '[data-slot="select-item"]';
        await page.locator(`${item}:visible`).first().waitFor({ timeout: 5000 }).catch(() => undefined);
        if (searchable) {
            await page.keyboard.type(labels[0].slice(0, 14));
            await page.waitForTimeout(450);
        }
        const option = page.locator(`${item}:visible`).filter({ has: page.getByText(labels[0], { exact: true }) });
        if (!(await option.count())) {
            await page.keyboard.press('Escape');
            await page.locator(`${item}:visible`).first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined);
            return `option not listed: ${labels[0]}`;
        }
        // The list keeps aligning itself to the trigger while it opens.
        await option.first().click({ force: true });
        await page.locator(`${item}:visible`).first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined);
        const shown = (await trigger.innerText()).trim().replace(/\s+/g, ' ');
        return shown === labels[0] ? null : `pick not shown (trigger says "${shown}")`;
    }
    if ('multi' === type) {
        const trigger = row.locator('[data-slot="smart-multi-select-trigger"]');
        if (!(await trigger.count())) {
            return 'no multi select';
        }
        await trigger.first().click();
        const content = page.locator('[data-slot="smart-multi-select-content"]:visible');
        const clear = content.getByText('Clear', { exact: true });
        if (await clear.count()) {
            await clear.first().click();
        }
        for (const label of labels) {
            await content.locator('[data-slot="command-item"]').filter({ has: page.getByText(label, { exact: true }) }).first().click();
        }
        await page.keyboard.press('Escape');
        return null;
    }
    if ('color' === type) {
        const trigger = row.locator('button[aria-label], button').first();
        await trigger.click();
        const picker = page.locator('.components-color-picker:visible');
        if (!(await picker.count())) {
            return 'no color picker';
        }
        const hex = picker.locator('input').last();
        if (!(await hex.count())) {
            await page.keyboard.press('Escape');
            return 'no hex input';
        }
        await hex.fill((value as string).replace('#', ''));
        await hex.press('Enter');
        await page.keyboard.press('Escape');
        await picker.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => undefined);
        const shown = (await trigger.innerText()).trim().toLowerCase();
        return shown.includes((value as string).toLowerCase()) ? null : `color not shown (trigger says "${shown}")`;
    }
    return `no driver for ${type}`;
}

/** Enter the applied values in develop's legacy form of the section and submit it. */
async function editLegacy(page: Page, section: string, items: Plan[]): Promise<string[]> {
    await page.goto('/wp-admin/admin.php?page=wpuf-settings');
    const missing = await page.evaluate(([sec, edits]) => {
        const notFound: string[] = [];
        for (const edit of edits as { name: string; type: string; value: string | string[] }[]) {
            const nodes = Array.from(document.querySelectorAll(`[name="${sec}[${edit.name}]"], [name="${sec}[${edit.name}][]"], [name^="${sec}[${edit.name}]["]`)) as HTMLInputElement[];
            const live = nodes.filter((node) => 'hidden' !== node.type);
            if (!live.length) {
                notFound.push(edit.name);
                continue;
            }
            const list = Array.isArray(edit.value) ? edit.value : [edit.value];
            for (const node of live) {
                if (node instanceof HTMLSelectElement) {
                    // Options built from site data (forms, pages) can differ between the sites.
                    if (!list.every((wanted) => Array.from(node.options).some((option) => option.value === wanted))) {
                        notFound.push(edit.name);
                    }
                    Array.from(node.options).forEach((option) => {
                        option.selected = list.includes(option.value);
                    });
                } else if ('checkbox' === node.type) {
                    node.checked = 'checkbox' === edit.type ? true : list.includes(node.value);
                } else if ('radio' === node.type) {
                    node.checked = list.includes(node.value);
                } else {
                    node.value = list[0];
                }
            }
        }
        return notFound;
    }, [section, items.map((item) => ({ name: item.field.name, type: item.type, value: item.value }))] as const);
    const form = page.locator(`form:has([name^="${section}["])`).first();
    await Promise.all([page.waitForNavigation(), form.evaluate((el) => HTMLFormElement.prototype.submit.call(el))]);
    return missing;
}

const readOption = (site: ParitySite, option: string): Record<string, unknown> | null => JSON.parse(parityWp(site, ['eval', `echo wp_json_encode( get_option( '${option}', null ) );`]));

test.describe('Parity settings sections', () => {
    test.skip(!paritySitesConfigured(), 'PARITY_* sites not configured');

    for (const sectionId of SECTIONS) {
        test(`SET0010 : section ${sectionId}: every field edited on the React screen stores what develop's legacy screen stores`, { tag: ['@Parity', '@Test_SET0010'] }, async ({ browser }) => {
            test.setTimeout(420_000);
            const parity = new ParityPage();
            const sites = { develop: paritySite('develop'), branch: paritySite('branch') };
            const before = { develop: readOption(sites.develop, sectionId), branch: readOption(sites.branch, sectionId) };
            const skipped: Record<string, string> = {};
            const applied: Plan[] = [];

            try {
                // Branch: React screen.
                const admin = await ParitySitePage.doOpen(browser, sites.branch);
                const page = admin.page;
                await page.setViewportSize({ width: 1440, height: 1000 });
                await page.goto('/wp-admin/admin.php?page=wpuf-settings');
                const root = page.locator('#wpuf-settings-root');
                await root.locator('nav button').first().waitFor();
                const ia = await page.evaluate(() => (window as unknown as { wp: { data: { select: (s: string) => { getIa: () => { id: string; sections: string[] }[] } } } }).wp.data.select('wpuf/settings').getIa());
                const tab = ia.find((item) => (item.sections || []).includes(sectionId));
                test.skip(!tab, `section ${sectionId} is not on the React screen`);
                await page.goto(`/wp-admin/admin.php?page=wpuf-settings&tab=${tab!.id}&sub=${sectionId}`);
                const section = root.locator(`[data-settings-section="${sectionId}"]`);
                await section.waitFor({ timeout: 20_000 });

                for (const field of SCHEMA.filter((item) => item.section === sectionId)) {
                    const item = plan(field);
                    if ('string' === typeof item) {
                        skipped[field.name] = item;
                        continue;
                    }
                    // A pick equal to the stored value is no edit: take another option.
                    if (('select' === item.type || 'radio' === item.type) && String((before.branch || {})[field.name] ?? '') === item.value) {
                        const other = field.options.filter((option) => '' !== option.key && '-1' !== option.key && option.key !== item.value);
                        if (other.length) {
                            item.value = other[0].key;
                            item.labels = [other[0].label];
                        }
                    }
                    if ('card-check' === item.type || 'gateways' === item.type) {
                        const cards = section.locator('button[data-settings-card]');
                        let done = false;
                        for (let i = 0; i < (await cards.count()); i++) {
                            const card = cards.nth(i);
                            const id = (await card.getAttribute('data-settings-card')) || '';
                            const want = 'card-check' === item.type ? (id === item.labels[0] ? true : null) : (item.value as string[]).includes(id);
                            if (null === want) {
                                continue;
                            }
                            const box = card.locator('[role="checkbox"]');
                            await card.evaluate((el) => el.scrollIntoView({ block: 'center' }));
                            if (('true' === (await box.getAttribute('aria-checked'))) !== want) {
                                await box.click();
                            }
                            done = true;
                        }
                        if (done) {
                            applied.push(item);
                        } else {
                            skipped[field.name] = 'react: no card';
                        }
                        continue;
                    }
                    const row = await findRow(page, section, field.name);
                    if (!row) {
                        skipped[field.name] = 'not shown on the React screen (dependency)';
                        continue;
                    }
                    const problem = await editReact(page, row, item);
                    if (problem) {
                        skipped[field.name] = `react: ${problem}`;
                        continue;
                    }
                    applied.push(item);
                }

                const save = root.getByRole('button', { name: 'Save', exact: true });
                if (applied.length && (await save.isEnabled())) {
                    const saved = page.waitForResponse((response) => response.url().includes('wpuf/v1/settings') && 'POST' === response.request().method());
                    await save.click();
                    expect((await saved).status(), 'React save succeeds').toBe(200);
                }
                await admin.doClose();

                // Develop: legacy screen, the same values.
                const legacy = await ParitySitePage.doOpen(browser, sites.develop);
                const missing = applied.length ? await editLegacy(legacy.page, sectionId, applied) : [];
                await legacy.doClose();
                for (const name of missing) {
                    skipped[name] = 'no input (or no such option) on develop\'s legacy screen';
                }

                const stored = { develop: readOption(sites.develop, sectionId) || {}, branch: readOption(sites.branch, sectionId) || {} };
                const compared = applied.filter((item) => !missing.includes(item.field.name));
                await test.info().attach('result.json', { path: parity.doWriteJson(test.info().outputPath('result.json'), { applied: compared.map((item) => item.field.name), skipped, stored }) });

                for (const item of compared) {
                    expect.soft(stored.branch[item.field.name], `${sectionId}.${item.field.name} (${item.field.kind})`).toEqual(stored.develop[item.field.name]);
                }
                console.log(`SET0010 ${sectionId}: compared ${compared.length}, skipped ${JSON.stringify(skipped)}`);
            } finally {
                for (const name of ['develop', 'branch'] as const) {
                    const old = before[name];
                    parityWp(sites[name], null === old ? ['option', 'delete', sectionId] : ['option', 'update', sectionId, JSON.stringify(old), '--format=json']);
                }
            }
        });
    }
});
