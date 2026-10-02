import { test, expect } from '@playwright/test';
import { ParityPage, ParitySitePage, type FormDump } from '../pages/parity';
import * as path from 'path';
import { parityDir, paritySite, paritySitesConfigured, parityWp } from '../utils/paritySites';

/**
 * Builder edits store the same shapes as develop (task 1.5, B12 read_only) and
 * a save keeps what the builder does not edit (B13, 1.10). The B11 condition
 * shape is unit tested (conditionalUtils.test.js) until the conditional logic
 * UI is wired (task 4.4d, B14).
 */
test.describe('Parity builder shapes', () => {
    test.skip(!paritySitesConfigured(), 'PARITY_* sites not configured');

    test('PAR0005 : read only stores the develop shape; integrations kept', { tag: ['@Parity', '@Test_PAR0005'] }, async ({ browser }) => {
        const parity = new ParityPage();
        const fixture = 'post-form-conditions.json';
        const stored: Record<string, FormDump> = {};

        for (const name of ['develop', 'branch'] as const) {
            const site = paritySite(name);
            const formId = parity.doSeedForm(site, fixture);
            const admin = await ParitySitePage.doOpen(browser, site);
            await admin.doOpenBuilder('wpuf_forms', formId);
            expect(await admin.doOpenFieldSettings(3), `${name}: open Nickname settings`).toBe(true);
            await admin.doCheckFieldOption('Make this field read only');
            await admin.doSaveBuilder();
            await admin.doClose();
            stored[name] = parity.readForm(site, formId);
            await test.info().attach(`${name}-stored.json`, { path: parity.doWriteJson(test.info().outputPath(`${name}-stored.json`), stored[name]) });
        }

        const nickname = (form: FormDump) => form.fields[3].post_content as Record<string, unknown>;
        expect(nickname(stored.branch).read_only, 'read_only stored as a boolean').toBe(true);
        // Develop rewrites the untouched wpuf_cond when the panel opens (ground-truth
        // 1.18); the branch keeps it as stored (Q6). Everything else must match.
        const { wpuf_cond: branchCond, ...branchRest } = nickname(stored.branch);
        const { wpuf_cond: _developCond, ...developRest } = nickname(stored.develop);
        expect(branchRest, 'branch field equals develop field').toStrictEqual(developRest);
        expect(branchCond, 'untouched conditions kept').toStrictEqual((parity.readFixture(fixture).fields[3].post_content as Record<string, unknown>).wpuf_cond);
        expect(stored.branch.meta.integrations, 'integrations kept').toStrictEqual(parity.readFixture(fixture).meta.integrations);
    });

    test('PAR0006 : without Pro a builder save keeps hidden custom taxonomy fields (1.11)', { tag: ['@Parity', '@Test_PAR0006'] }, () => {
        const out = parityWp(paritySite('branch'), [
            'eval-file', path.join(parityDir, 'wp', 'check-hidden-taxonomy.php'), '--skip-plugins=wpuf-pro',
        ]);
        const result = JSON.parse(out.trim().split('\n').pop() || '{}');

        expect(result.pro_active, 'Pro skipped').toBe(false);
        expect(result.kept, 'title kept, hidden taxonomy kept, removed field deleted').toEqual([true, true, false]);
    });
});
