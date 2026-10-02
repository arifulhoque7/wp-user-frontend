import { test, expect } from '@playwright/test';
import { ParityPage, ParitySitePage } from '../pages/parity';
import { paritySite, paritySitesConfigured } from '../utils/paritySites';

/**
 * Admin screens on the branch load without JS errors and without assets served
 * as HTML (task 1.8, B23). Run with every Pro module active.
 */
test.describe('Branch admin health', () => {
    test.skip(!paritySitesConfigured(), 'PARITY_* sites not configured');

    test('HLT0001 : builders and form lists load with no page errors or missing assets', { tag: ['@Parity', '@Test_HLT0001'] }, async ({ browser }) => {
        const branch = paritySite('branch');
        const parity = new ParityPage();
        const postForm = parity.doSeedForm(branch, 'post-form-parity.json');
        const regForm = parity.doSeedForm(branch, 'registration-form.json');
        const admin = await ParitySitePage.doOpen(browser, branch);
        const problems: Record<string, { errors: string[]; badAssets: string[] }> = {};

        for (const path of [
            `/wp-admin/admin.php?page=wpuf-post-forms&action=edit&id=${postForm}`,
            `/wp-admin/admin.php?page=wpuf-profile-forms&action=edit&id=${regForm}`,
            '/wp-admin/admin.php?page=wpuf-post-forms',
            '/wp-admin/admin.php?page=wpuf-profile-forms',
            '/wp-admin/admin.php?page=wpuf_subscription',
            '/wp-admin/admin.php?page=wpuf-settings',
        ]) {
            problems[path] = await admin.getLoadProblems(path);
        }
        await admin.doClose();

        for (const [path, found] of Object.entries(problems)) {
            expect.soft(found, path).toEqual({ errors: [], badAssets: [] });
        }
    });

    test('HLT0002 : registration list shows the Pro shortcode pair and the AI entry', { tag: ['@Parity', '@Test_HLT0002'] }, async ({ browser }) => {
        const branch = paritySite('branch');
        const formId = new ParityPage().doSeedForm(branch, 'registration-form.json');
        const admin = await ParitySitePage.doOpen(browser, branch);
        await admin.page.goto('/wp-admin/admin.php?page=wpuf-profile-forms');
        const codes = admin.page.locator('td code');
        await expect(codes.first()).toBeVisible();
        const all = await codes.allTextContents();
        const ai = await admin.page.getByRole('button', { name: 'AI Form Builder' }).count();
        await admin.doClose();

        expect(all, 'registration shortcode').toContain(`[wpuf_profile type="registration" id="${formId}"]`);
        expect(all, 'edit profile shortcode').toContain(`[wpuf_profile type="profile" id="${formId}"]`);
        expect(ai, 'AI Form Builder button').toBe(1);
    });
});
