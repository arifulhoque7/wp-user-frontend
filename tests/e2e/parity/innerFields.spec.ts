import { test, expect } from '@playwright/test';
import { ParityPage, ParitySitePage } from '../pages/parity';
import { paritySite, paritySitesConfigured } from '../utils/paritySites';

/**
 * Fields dropped into a repeat or column field store what the Vue builder stored
 * (develop forms 7323/7344 checked by hand, task 1.9): meta inner fields are named
 * slug(label) + '_' + a random id, unsupported repeat types are refused.
 */
test.describe('Parity inner fields', () => {
    test.skip(!paritySitesConfigured(), 'PARITY_* sites not configured');

    test('PAR0015 : repeat and column drops store the develop inner field shape', { tag: ['@Parity', '@Test_PAR0015'] }, async ({ browser }) => {
        const site = paritySite('branch');
        const admin = await ParitySitePage.doOpen(browser, site);
        const formId = await admin.doOpenNewBuilder('wpuf_forms');

        expect(await admin.doAddFieldFromPalette('post_title'), 'post title added (save needs one)').toBe(true);
        expect(await admin.doAddFieldFromPalette('repeat_field'), 'repeat field added').toBe(true);
        expect(await admin.doAddFieldFromPalette('column_field'), 'column field added').toBe(true);

        const repeatList = '.wpuf-repeat-fields-sortable-list';
        await expect(admin.page.locator(repeatList).first(), 'repeat field renders its drop zone').toBeVisible();
        await expect(admin.page.getByText('No fields added yet').first(), 'repeat empty state').toBeVisible();

        await admin.doDropTemplate(repeatList, 'image_upload');
        await expect(admin.page.getByText('This field type is not supported in repeat field'), 'unsupported type refused').toBeVisible();
        await admin.doDismissAlerts();

        await admin.doDropTemplate(repeatList, 'text_field');
        await admin.doDropTemplate(repeatList, 'text_field');
        await admin.doDropTemplate('[data-column="column-1"]', 'text_field');
        // A palette drop on the stage itself inserts at the drop position (top here).
        await admin.doDropTemplate('#form-preview-stage', 'textarea_field');
        await admin.doSaveBuilder();
        await admin.doClose();

        const fields = new ParityPage().readForm(site, formId).fields.map((field) => field.post_content as Record<string, unknown>);
        const repeat = fields.find((field) => 'repeat_field' === field.template) as Record<string, unknown>;
        const column = fields.find((field) => 'column_field' === field.template) as Record<string, unknown>;
        const repeatInner = repeat.inner_fields as Record<string, unknown>[];
        const columnInner = (column.inner_fields as Record<string, Record<string, unknown>[]>)['column-1'];

        expect(fields.map((field) => field.template), 'stage drop lands first; inner drops add nothing to the top level').toEqual(['textarea_field', 'post_title', 'repeat_field', 'column_field']);
        expect(repeatInner.map((field) => field.template), 'two text fields in the repeat').toEqual(['text_field', 'text_field']);
        for (const field of [...repeatInner, ...columnInner]) {
            expect(String(field.name), 'inner meta name = slug + random id').toMatch(/^text_\d+$/);
        }
        expect(repeatInner[0].name, 'inner names unique').not.toBe(repeatInner[1].name);
        expect(columnInner.map((field) => field.template), 'text field in column 1').toEqual(['text_field']);
    });

    test('PAR0018 : field options start fresh per field, rows reorder, label renames a new meta key', { tag: ['@Parity', '@Test_PAR0018'] }, async ({ browser }) => {
        const site = paritySite('branch');
        const admin = await ParitySitePage.doOpen(browser, site);
        const formId = await admin.doOpenNewBuilder('wpuf_forms');
        const page = admin.page;
        const rowLabels = () => page.locator('.option-field-option td:nth-child(2) input').evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

        expect(await admin.doAddFieldFromPalette('post_title')).toBe(true);
        expect(await admin.doAddFieldFromPalette('dropdown_field')).toBe(true);
        expect(await admin.doAddFieldFromPalette('dropdown_field')).toBe(true);

        // First dropdown: two rows, then rename the label.
        expect(await admin.doOpenFieldSettings(1)).toBe(true);
        await page.locator('.option-field-option .plus-buttons').last().click();
        await page.locator('.option-field-option td:nth-child(2) input').nth(0).fill('Alpha');
        await page.locator('.option-field-option td:nth-child(2) input').nth(1).fill('Beta');
        await page.locator('#label').fill('Fruit Kind');
        await expect(page.locator('#name'), 'meta key follows the label').toHaveValue('fruit_kind');

        // Drag Beta above Alpha by its handle.
        const handles = page.locator('.option-field-option .sort-handler');
        const from = await handles.nth(1).boundingBox();
        const to = await handles.nth(0).boundingBox();
        await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
        await page.mouse.down();
        await page.mouse.move(from!.x + from!.width / 2, from!.y - 5, { steps: 5 });
        await page.mouse.move(to!.x + to!.width / 2, to!.y + 2, { steps: 5 });
        await page.mouse.up();
        await expect.poll(rowLabels, { message: 'rows reordered' }).toEqual(['Beta', 'Alpha']);

        // Second dropdown shows its own single row, not the first one's.
        expect(await admin.doOpenFieldSettings(2)).toBe(true);
        expect(await rowLabels(), 'second dropdown keeps its own options').toEqual(['Option']);

        await admin.doSaveBuilder();
        await admin.doClose();

        const fields = new ParityPage().readForm(site, formId).fields.map((field) => field.post_content as Record<string, unknown>);
        const [first, second] = fields.filter((field) => 'dropdown_field' === field.template);
        expect(first.name, 'renamed meta key stored').toBe('fruit_kind');
        expect(Object.values(first.options as Record<string, string>), 'reordered options stored').toEqual(['Beta', 'Alpha']);
        expect(Object.values(second.options as Record<string, string>), 'second dropdown untouched').toEqual(['Option']);
    });

    test('PAR0019 : column and repeat inner rows lay out like develop', { tag: ['@Parity', '@Test_PAR0019'] }, async ({ browser }) => {
        const rows: Record<string, string[]> = {};

        for (const name of ['develop', 'branch'] as const) {
            const site = paritySite(name);
            const formId = new ParityPage().doSeedForm(site, 'post-form-nested.json');
            const admin = await ParitySitePage.doOpen(browser, site);
            await admin.doOpenBuilder('wpuf_forms', formId);
            await expect(admin.page.locator('.wpuf-repeat-fields-sortable-list > li').first()).toBeVisible();
            rows[name] = await admin.page.locator('.wpuf-column-fields-sortable-list > li, .wpuf-repeat-fields-sortable-list > li').evaluateAll((items) => items.map((li) => {
                const box = (el: Element | null) => (el ? Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height) : '-');
                const label = li.querySelector('label');
                const bar = li.lastElementChild as HTMLElement;
                return [
                    li.parentElement!.className.split(' ')[0],
                    String(li.className).match(/form-field-\S+/)?.[0],
                    'row=' + box(li),
                    'label=' + box(label) + (label ? ' ' + getComputedStyle(label).fontSize + '/' + getComputedStyle(label).fontWeight : ''),
                    'input=' + box(li.querySelector('input, select, textarea')),
                    'bar=' + box(bar) + ' opacity=' + getComputedStyle(bar).opacity + ' text=' + (bar.textContent || '').replace(/\s+/g, ''),
                ].join(' ');
            }));
            await admin.doClose();
        }

        expect(rows.develop.length, 'fixture has inner fields').toBeGreaterThan(0);
        expect(rows.branch, 'inner rows: size, label, input and action bar').toStrictEqual(rows.develop);
    });
});
