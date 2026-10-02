import { test, expect } from '@playwright/test';
import { ParityPage, ParitySitePage } from '../pages/parity';
import { paritySite, paritySitesConfigured, parityWp } from '../utils/paritySites';

/**
 * Security regressions on the branch site (task 1.19). These check what the
 * server prints or returns, so they run against the branch only.
 */
test.describe('Branch security', () => {
    test.skip(!paritySitesConfigured(), 'PARITY_* sites not configured');

    test('SEC0001 : builder page never prints the reCAPTCHA / Turnstile secret keys', { tag: ['@Security', '@Test_SEC0001'] }, async ({ browser }) => {
        const branch = paritySite('branch');
        for (const [key, value] of [['recaptcha_private', 'SEC0001-RC-SECRET'], ['turnstile_secret_key', 'SEC0001-TS-SECRET']]) {
            parityWp(branch, ['option', 'patch', 'update', 'wpuf_general', key, value]);
        }
        const formId = new ParityPage().doSeedForm(branch, 'post-form-parity.json');
        const admin = await ParitySitePage.doOpen(browser, branch);
        const html = await admin.getAdminHtml(`/wp-admin/admin.php?page=wpuf-post-forms&action=edit&id=${formId}`);
        await admin.doClose();

        expect(html, 'reCAPTCHA secret printed').not.toContain('SEC0001-RC-SECRET');
        expect(html, 'Turnstile secret printed').not.toContain('SEC0001-TS-SECRET');
    });
});
