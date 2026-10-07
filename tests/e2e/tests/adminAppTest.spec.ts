import { Browser, BrowserContext, Page, test, expect, chromium } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { BasicLoginPage } from '../pages/basicLogin';
import { SettingsReactPage } from '../pages/settingsReact';
import { Users, Urls } from '../utils/testData';

let browser: Browser;
let context: BrowserContext;
let page: Page;
let settings: SettingsReactPage;

const APP = `${Urls.baseUrl}/wp-admin/admin.php?page=wp-user-frontend`;

/**
 * The single React admin app (task 5d): one admin page, hash routes. These
 * tests check what only the app does (menu links, redirects of old URLs,
 * route guards); the screens' own specs run inside the app too. Skipped when
 * the app is off (`wpuf_admin_app_enabled`).
 *
 * @TestScenario : [Admin app]
 * @Test_APP0001 : The Settings menu row opens the app's settings route
 * @Test_APP0002 : Old settings URLs (?tab=&sub=, #section) land on that tab inside the app
 * @Test_APP0003 : The classic settings screen (?wpuf_settings_ui=legacy) stays its own page
 * @Test_APP0004 : Unsaved settings ask before leaving the route; Continue stays, Discard leaves
 * @Test_APP0005 : Settings <-> Subscriptions through the menu without a page load; each route has only its own stylesheet on
 * @Test_APP0006 : Subscriptions list -> new form -> back / forward inside the route; a deep link reload opens the form
 */

test.beforeAll(async () => {
    browser = await chromium.launch();
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();
    await new BasicLoginPage(page).basicLogin(Users.adminUsername, Users.adminPassword);
    settings = new SettingsReactPage(page);
});

test.afterAll(async () => {
    await browser.close();
});

/** Whether the admin app is on (its page carries the app boot data). */
async function appOn(): Promise<boolean> {
    await page.goto(`${APP}#/settings`);
    await page.waitForLoadState('domcontentloaded');

    return page.evaluate(() => !!(window as unknown as { wpuf?: { app?: unknown } }).wpuf?.app);
}

test.describe('Admin app', () => {
    test('APP0001 : The Settings menu row opens the app settings route', { tag: ['@Lite', '@Test_APP0001'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');

        const href = await page.locator('#toplevel_page_wp-user-frontend a', { hasText: 'Settings' }).first().getAttribute('href');
        expect(href).toContain('page=wp-user-frontend#/settings');
        await expect(page).toHaveURL(/page=wp-user-frontend#\/settings/);
        await expect(page.locator('#wpuf-settings-root h2', { hasText: /WP User Frontend/ }).first()).toBeVisible({ timeout: 30000 });
    });

    test('APP0002 : Old settings URLs land on that tab inside the app', { tag: ['@Lite', '@Test_APP0002'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');

        await page.goto(`${Urls.baseUrl}/wp-admin/admin.php?page=wpuf-settings&tab=payments&sub=wpuf_payment`);
        await expect(page).toHaveURL(/page=wp-user-frontend#\/settings\?tab=payments&sub=wpuf_payment$/);

        await page.goto(`${Urls.baseUrl}/wp-admin/admin.php?page=wpuf-settings#wpuf_profile`);
        await expect(page).toHaveURL(/page=wp-user-frontend#\/settings\?tab=login_registration&sub=wpuf_profile$/);
    });

    test('APP0003 : The classic settings screen stays its own page', { tag: ['@Lite', '@Test_APP0003'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');

        await page.goto(`${Urls.baseUrl}/wp-admin/admin.php?page=wpuf-settings&wpuf_settings_ui=legacy`);
        await expect(page).toHaveURL(/page=wpuf-settings&wpuf_settings_ui=legacy/);
        await expect(page.locator('.wpuf-settings-wrap')).toBeVisible();
    });

    test('APP0004 : Unsaved settings ask before leaving the route', { tag: ['@Lite', '@Test_APP0004'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');

        await page.goto(`${APP}#/settings?tab=general`);
        await settings.root.waitFor({ state: 'visible' });
        await settings.openTab('General');
        await settings.fillByLabel('Custom CSS codes', `/* ${faker.string.uuid()} */`);
        await expect(page.getByText('Unsaved changes', { exact: false })).toBeVisible();

        // Leave to another route: the screen asks, Continue keeps the route.
        await page.evaluate(() => { window.location.hash = '#/nowhere'; });
        await settings.expectUnsavedModal();
        await settings.continueEditing();
        await expect(page).toHaveURL(/#\/settings/);
        await expect(page.getByText('Unsaved changes', { exact: false })).toBeVisible();

        // Discard leaves.
        await page.evaluate(() => { window.location.hash = '#/nowhere'; });
        await settings.expectUnsavedModal();
        await settings.discardChanges();
        await expect(page).toHaveURL(/#\/nowhere/);
        await expect(page.getByText('This page does not exist.')).toBeVisible();
    });

    test('APP0005 : Settings <-> Subscriptions through the menu without a page load', { tag: ['@Lite', '@Test_APP0005'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');

        const sheetOn = (id: string) => page.evaluate((sheet) => {
            const link = document.getElementById(sheet) as HTMLLinkElement | null;
            return !!link && !link.disabled;
        }, id);

        await page.goto(`${APP}#/settings`);
        await expect(page.locator('#wpuf-settings-root nav button').first()).toBeVisible({ timeout: 30000 });
        await page.evaluate(() => { (window as unknown as { wpufNoReload: boolean }).wpufNoReload = true; });
        expect(await sheetOn('wpuf-settings-react-css')).toBe(true);

        await page.locator('#toplevel_page_wp-user-frontend a', { hasText: 'Subscriptions' }).first().click();
        await expect(page).toHaveURL(/#\/subscriptions/);
        await expect(page.locator('#wpuf-subscription-page button', { hasText: 'Add Subscription' }).first()).toBeVisible({ timeout: 30000 });
        expect(await sheetOn('wpuf-subscriptions-react-css')).toBe(true);
        expect(await sheetOn('wpuf-settings-react-css')).toBe(false);
        await expect(page.locator('#toplevel_page_wp-user-frontend li.current a')).toHaveText('Subscriptions');

        await page.locator('#toplevel_page_wp-user-frontend a', { hasText: 'Settings' }).first().click();
        await expect(page.locator('#wpuf-settings-root nav button').first()).toBeVisible({ timeout: 30000 });
        expect(await sheetOn('wpuf-settings-react-css')).toBe(true);
        expect(await sheetOn('wpuf-subscriptions-react-css')).toBe(false);
        expect(await page.evaluate(() => (window as unknown as { wpufNoReload?: boolean }).wpufNoReload), 'no page load between routes').toBe(true);
    });

    test('APP0006 : Subscriptions list -> new form -> back / forward inside the route', { tag: ['@Lite', '@Test_APP0006'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');

        const details = page.locator('//button[normalize-space()="Subscription Details"]');

        await page.goto(`${APP}#/subscriptions`);
        await page.locator('#wpuf-subscription-page button', { hasText: 'Add Subscription' }).first().click();
        await expect(page).toHaveURL(/#\/subscriptions\?action=new/);
        await expect(details).toBeVisible({ timeout: 30000 });

        await page.goBack();
        await expect(page).toHaveURL(/#\/subscriptions$/);
        await expect(details).toHaveCount(0);

        await page.goForward();
        await expect(details).toBeVisible({ timeout: 30000 });

        await page.reload();
        await expect(page).toHaveURL(/#\/subscriptions\?action=new/);
        await expect(details).toBeVisible({ timeout: 30000 });
    });
});
