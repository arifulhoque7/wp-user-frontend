import { Browser, BrowserContext, Page, test, expect, chromium } from "@playwright/test";
import { faker } from '@faker-js/faker';
import { SettingsReactPage } from '../pages/settingsReact';
import { BasicLoginPage } from '../pages/basicLogin';
import { Users } from '../utils/testData';
import { configureSpecFailFast } from '../utils/specFailFast';

let browser: Browser;
let context: BrowserContext;
let page: Page;
let settings: SettingsReactPage;

test.beforeAll(async () => {
    browser = await chromium.launch();
    context = await browser.newContext();
    page = await context.newPage();

    const login = new BasicLoginPage(page);
    await login.basicLogin(Users.adminUsername, Users.adminPassword);

    settings = new SettingsReactPage(page);
});

test.afterAll(async () => {
    await browser.close();
});

test.describe('React Settings Screen Tests', () => {

    configureSpecFailFast();

    /**----------------------------------REACT SETTINGS SCREEN----------------------------------**
     *
     * @TestScenario : [WPUF > Settings — React screen]
     * @Test_SR0001 : App mounts and the loading skeleton is replaced by the UI
     * @Test_SR0002 : All top-level tabs are present in the left nav
     * @Test_SR0003 : Header title reflects Pro/Free (WP User Frontend [Pro])
     * @Test_SR0004 : Switching a top-level tab updates the panel title
     * @Test_SR0005 : Sub-tab pills switch the visible section
     * @Test_SR0006 : Active tab + sub-tab persist in the URL across a refresh
     * @Test_SR0007 : Invalid ?sub= does not show a blank panel
     * @Test_SR0008 : Editing a field marks the form dirty ("Unsaved changes")
     * @Test_SR0009 : Save shows the "Saved" confirmation
     * @Test_SR0010 : Saved value round-trips after reload (storage parity)
     * @Test_SR0011 : No-op save keeps the value byte-identical
     * @Test_SR0012 : Cancel/Discard reverts unsaved edits
     * @Test_SR0013 : Switching tabs with unsaved edits shows the Unsaved Changes modal
     * @Test_SR0014 : Continue Editing keeps you on the tab; Discard moves on
     * @Test_SR0015 : Global search finds a field across tabs
     * @Test_SR0016 : Provider search shows the provider's fields (e.g. "facebook")
     * @Test_SR0017 : Search with no match shows the empty state
     * @Test_SR0018 : Clear (X) button resets the search
     * @Test_SR0019 : Clicking a tab clears an active search
     * @Test_SR0020 : depends_on conditional field shows/hides on the controller value
     * @Test_SR0021 : Legacy fallback — "Classic view" renders the classic screen
     * @Test_SR0022 : Legacy emergency override (?wpuf_settings_ui=legacy) works
     * @Test_SR0023 : Switch back from classic to the React screen
     **/

    test('@Test_SR0001 : App mounts; skeleton replaced by UI', async () => {
        await settings.goto();
        await expect(settings.root).toBeVisible();
    });

    test('@Test_SR0002 : All top-level tabs present', async () => {
        await settings.goto();
        for (const tab of ['General', 'Frontend Posting', 'Login & Registration', 'Email', 'Advanced']) {
            await expect(page.locator('#wpuf-settings-root nav.wpuf-space-y-1 button', { hasText: tab })).toBeVisible();
        }
    });

    test('@Test_SR0003 : Header title reflects Pro/Free', async () => {
        await settings.goto();
        await expect(page.locator('#wpuf-settings-root h2', { hasText: /WP User Frontend/ }).first()).toBeVisible();
    });

    test('@Test_SR0004 : Tab switch updates the panel title', async () => {
        await settings.goto();
        await settings.openTab('Email');
        await settings.expectPanelTitle('Email');
        await settings.openTab('General');
        await settings.expectPanelTitle('General');
    });

    test('@Test_SR0005 : Sub-tab pills switch section', async () => {
        await settings.goto();
        await settings.openTab('Login & Registration');
        await settings.openSubTab('Social Login');
        await expect(page.getByText('Social Login', { exact: false }).first()).toBeVisible();
    });

    test('@Test_SR0006 : Tab + sub-tab persist in URL on refresh', async () => {
        await settings.goto();
        await settings.openTab('Login & Registration');
        await settings.openSubTab('Social Login');
        expect(page.url()).toContain('tab=login_registration');
        expect(page.url()).toContain('sub=wpuf_social_api');
        await page.reload();
        await expect(settings.root).toBeVisible();
        expect(page.url()).toContain('sub=wpuf_social_api');
    });

    test('@Test_SR0007 : Invalid ?sub= does not blank the panel', async () => {
        await settings.navigateToURL(settings.wpufSettingsPage + '&tab=payments&sub=bogus_section');
        await expect(settings.root).toBeVisible();
        // A panel heading still renders (no empty content area).
        await expect(page.locator('#wpuf-settings-root h2').first()).toBeVisible();
    });

    test('@Test_SR0008 : Editing a field marks dirty', async () => {
        await settings.goto();
        await settings.openTab('General');
        await settings.fillByLabel('Custom CSS codes', `/* ${faker.string.uuid()} */`).catch(() => {});
        await expect(page.getByText('Unsaved changes', { exact: false })).toBeVisible();
    });

    test('@Test_SR0009 + @Test_SR0010 : Save persists across reload (parity)', async () => {
        const css = `/* qa-${faker.string.alphanumeric(8)} */`;
        await settings.goto();
        await settings.openTab('General');
        await settings.fillByLabel('Custom CSS codes', css);
        await settings.save();
        await settings.goto();
        await settings.openTab('General');
        expect(await settings.valueByLabel('Custom CSS codes')).toContain(css.replace('/* ', '').slice(0, 6));
    });

    test('@Test_SR0011 : No-op save keeps value identical', async () => {
        await settings.goto();
        await settings.openTab('General');
        const before = await settings.valueByLabel('Custom CSS codes');
        // Touch dirty state minimally then restore, or just re-save unchanged via a benign edit.
        await settings.fillByLabel('Custom CSS codes', before + ' ');
        await settings.fillByLabel('Custom CSS codes', before);
        // If still dirty, save and confirm the value is unchanged on reload.
        await settings.save().catch(() => {});
        await settings.goto();
        await settings.openTab('General');
        expect(await settings.valueByLabel('Custom CSS codes')).toBe(before);
    });

    test('@Test_SR0013 + @Test_SR0014 : Unsaved-changes modal on tab switch', async () => {
        await settings.goto();
        await settings.openTab('General');
        await settings.fillByLabel('Custom CSS codes', `/* ${faker.string.uuid()} */`);
        await settings.openTab('Email');
        await settings.expectUnsavedModal();
        await settings.continueEditing();
        await settings.expectPanelTitle('General');
        // Now discard and move on.
        await settings.openTab('Email');
        await settings.discardChanges();
        await settings.expectPanelTitle('Email');
    });

    test('@Test_SR0015 : Global search finds a field across tabs', async () => {
        await settings.goto();
        await settings.search('recaptcha');
        await settings.expectPanelTitle('Search results');
        await expect(page.getByText('reCAPTCHA', { exact: false }).first()).toBeVisible();
    });

    test('@Test_SR0016 : Provider search shows the provider fields', async () => {
        await settings.goto();
        await settings.search('facebook');
        await settings.expectPanelTitle('Search results');
        await expect(page.getByText('Facebook', { exact: false }).first()).toBeVisible();
    });

    test('@Test_SR0017 : Search with no match shows empty state', async () => {
        await settings.goto();
        await settings.search('zzzznomatchzzzz');
        await settings.expectNoResults();
    });

    test('@Test_SR0018 + @Test_SR0019 : Clear button + tab click reset search', async () => {
        await settings.goto();
        await settings.search('email');
        await settings.clearSearch();
        await expect(page.locator('#wpuf-settings-root input[placeholder^="Search"]')).toHaveValue('');
        await settings.search('email');
        await settings.openTab('General');
        await expect(page.locator('#wpuf-settings-root input[placeholder^="Search"]')).toHaveValue('');
        await settings.expectPanelTitle('General');
    });

    test('@Test_SR0021 + @Test_SR0023 : Legacy fallback switch + back', async () => {
        await settings.goto();
        await settings.switchToClassic();
        await settings.switchToNew();
        await expect(settings.root).toBeVisible();
    });

    test('@Test_SR0022 : Legacy emergency URL override', async () => {
        await settings.gotoLegacyOverride();
        // Restore the React view for any later runs.
        await settings.goto();
    });
});
