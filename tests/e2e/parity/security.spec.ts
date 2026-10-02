import { test, expect } from '@playwright/test';
import { ParityPage, ParitySitePage } from '../pages/parity';
import * as path from 'path';
import { parityDir, paritySite, paritySitesConfigured, parityWp } from '../utils/paritySites';

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

    test('SEC0002 : builder save rejects a foreign settings meta key, a non-form post and a missing nonce', { tag: ['@Security', '@Test_SEC0002'] }, async ({ browser }) => {
        const branch = paritySite('branch');
        const formId = new ParityPage().doSeedForm(branch, 'post-form-parity.json');
        const otherPost = Number(parityWp(branch, ['post', 'create', '--post_type=post', '--post_status=draft', '--post_title=SEC0002', '--porcelain']).trim());
        const admin = await ParitySitePage.doOpen(browser, branch);
        await admin.doOpenBuilder('wpuf_forms', formId);

        const foreignKey = await admin.doRawBuilderSave({ form_settings_key: '_wp_page_template' });
        const foreignPost = await admin.doRawBuilderSave({ wpuf_form_id: String(otherPost) });
        const noNonce = await admin.doRawBuilderSave({ wpuf_form_builder_nonce: null });
        await admin.doClose();

        expect(foreignKey.success, 'foreign meta key accepted').toBe(false);
        expect(foreignPost.success, 'non-form post accepted').toBe(false);
        expect(noNonce.success, 'missing nonce accepted').toBe(false);
        expect(parityWp(branch, ['post', 'meta', 'list', String(otherPost), '--keys=_wp_page_template', '--format=count']).trim(), 'meta written on a non-form post').toBe('0');
    });

    test('SEC0003 : settings REST never returns secrets; masked values keep the stored secret', { tag: ['@Security', '@Test_SEC0003'] }, () => {
        const result = JSON.parse(parityWp(paritySite('branch'), ['eval-file', path.join(parityDir, 'wp', 'check-settings-secrets.php')]));

        expect(result.payload_has_secret, 'secret in GET payload').toBe(false);
        expect(result.masked, 'masked values').toEqual(['SE**************99', 'sk-S**************3456']);
        expect(result.kept, 'stored secrets kept when the mask comes back').toEqual(['SEC3-N8N-SECRET-99', 'sk-SEC3-REALKEY-123456']);
        expect(result.test_used_stored, 'AI test used the stored key').toBe(true);
        expect(result.new, 'new values saved').toEqual(['SEC3-NEW', 'sk-SEC3-NEW']);
    });
});
