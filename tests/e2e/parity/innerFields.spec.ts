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
        await admin.doSaveBuilder();
        await admin.doClose();

        const fields = new ParityPage().readForm(site, formId).fields.map((field) => field.post_content as Record<string, unknown>);
        const repeat = fields.find((field) => 'repeat_field' === field.template) as Record<string, unknown>;
        const column = fields.find((field) => 'column_field' === field.template) as Record<string, unknown>;
        const repeatInner = repeat.inner_fields as Record<string, unknown>[];
        const columnInner = (column.inner_fields as Record<string, Record<string, unknown>[]>)['column-1'];

        expect(repeatInner.map((field) => field.template), 'two text fields in the repeat').toEqual(['text_field', 'text_field']);
        for (const field of [...repeatInner, ...columnInner]) {
            expect(String(field.name), 'inner meta name = slug + random id').toMatch(/^text_\d+$/);
        }
        expect(repeatInner[0].name, 'inner names unique').not.toBe(repeatInner[1].name);
        expect(columnInner.map((field) => field.template), 'text field in column 1').toEqual(['text_field']);
    });
});
