import { test } from '@playwright/test';
import { ParityPage, ParitySitePage, type FormDump } from '../pages/parity';
import { paritySite, paritySitesConfigured } from '../utils/paritySites';

/**
 * G2 for builder field options (task 0.4c-2), one test per field type: the same
 * deterministic edit on every option row of that field, made through each site's
 * own builder UI, must store the same values on the branch as on develop. The
 * option rows the panel shows are compared too (a missing row = missing UI on the
 * branch). Conditional logic rows are covered separately (task 4.4d).
 */
const FIXTURE = 'post-form-all-fields.json';
const SKIP_ROWS = ['panel-field-opt-conditional-logic'];

const templates = new ParityPage().readFixture(FIXTURE).fields
    .map((field) => (field.post_content as { template: string }).template);

test.describe('Parity field fill', () => {
    test.skip(!paritySitesConfigured(), 'PARITY_* sites not configured');

    for (const [index, template] of templates.entries()) {
        test(`PAR0004 : field ${String(index).padStart(2, '0')} ${template}: filling every option stores the same on branch as on develop`, { tag: ['@Parity', '@Test_PAR0004'] }, async ({ browser }) => {
            const parity = new ParityPage();
            const stored: Partial<Record<'develop' | 'branch', FormDump>> = {};
            const rows: Partial<Record<'develop' | 'branch', string[]>> = {};

            for (const name of ['develop', 'branch'] as const) {
                const site = paritySite(name);
                const formId = parity.doSeedForm(site, FIXTURE);
                const admin = await ParitySitePage.doOpen(browser, site);
                await admin.doOpenBuilder('wpuf_forms', formId);
                rows[name] = await admin.doOpenFieldSettings(index)
                    ? await admin.doFillFieldOptions(String(index), SKIP_ROWS)
                    : ['stage item not visible'];
                await admin.doSaveBuilder();
                await admin.doClose();
                stored[name] = parity.readForm(site, formId);
            }

            await test.info().attach('rows.json', { path: parity.doWriteJson(test.info().outputPath('rows.json'), rows) });
            await test.info().attach('stored.json', { path: parity.doWriteJson(test.info().outputPath('stored.json'), stored) });

            parity.validateRowsEqual({ [template]: rows.develop as string[] }, { [template]: rows.branch as string[] });
            parity.validateFormsEqual(
                parity.withoutAgreedDeviations(stored.develop as FormDump, stored.branch as FormDump, parity.readFixture(FIXTURE)),
                stored.branch as FormDump,
            );
        });
    }
});
