import { Browser, BrowserContext, Page, test, expect, chromium } from '@playwright/test';
import { BasicLoginPage } from '../pages/basicLogin';
import { AiFormBuilderPage } from '../pages/aiFormBuilder';
import { Users, Urls } from '../utils/testData';

let browser: Browser;
let context: BrowserContext;
let page: Page;

/**
 * Release smoke: every React admin screen mounts from the built bundles with no
 * JavaScript error and no failed plugin asset. Run it against a site that has the
 * RELEASE packages installed (free from deploy-org.yml's rsync, Pro from a plan zip)
 * to prove the release build carries every React part.
 *
 * @TestScenario : [Release build]
 * @Test_RS0001 : Post forms list mounts (React) with no JS error or missing plugin asset
 * @Test_RS0002 : New post form opens the React builder
 * @Test_RS0003 : Subscriptions screen mounts
 * @Test_RS0004 : Settings screen mounts
 * @Test_RS0005 : Registration forms list and a new registration form open in React (Pro)
 */

const problems: string[] = [];

test.beforeAll(async () => {
    browser = await chromium.launch();
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();

    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
        if ('error' === message.type()) {
            problems.push(`console: ${message.text()}`);
        }
    });
    page.on('response', (response) => {
        const url = response.url();
        if (response.status() >= 400 && /\/wp-content\/plugins\/(wp-user-frontend|wpuf-pro|wp-user-frontend-pro)\//.test(url)) {
            problems.push(`${response.status()}: ${url}`);
        }
    });

    await new BasicLoginPage(page).basicLogin(Users.adminUsername, Users.adminPassword);
});

test.afterAll(async () => {
    await browser.close();
});

/** Open an admin page, wait for it to settle and fail on any collected problem. */
async function visit(path: string) {
    problems.length = 0;
    await page.goto(`${Urls.baseUrl}/wp-admin/${path}`);
    await page.waitForLoadState('networkidle');
}

function expectClean(label: string) {
    expect(problems, `${label}: JS errors / failed plugin assets`).toEqual([]);
}

test.describe('Release smoke: React admin screens', () => {
    test('RS0001 : Post forms list mounts with no JS error or missing plugin asset', { tag: ['@Lite', '@Test_RS0001'] }, async () => {
        await visit('admin.php?page=wpuf-post-forms');
        await expect(page.locator('button:has-text("AI Form Builder")').first()).toBeVisible({ timeout: 30000 });
        expectClean('post forms list');
    });

    test('RS0002 : New post form opens the React builder', { tag: ['@Lite', '@Test_RS0002'] }, async () => {
        await visit('admin.php?page=wpuf-post-forms&action=add-new');
        await expect(page).toHaveURL(/action=edit&id=\d+/);
        await expect(page.locator('body.wpuf-admin-react')).toHaveCount(1);
        await expect(page.getByRole('tab', { name: 'Form Editor' }).first()).toBeVisible({ timeout: 30000 });
        expectClean('post form builder');
    });

    test('RS0003 : Subscriptions screen mounts', { tag: ['@Lite', '@Test_RS0003'] }, async () => {
        await visit('admin.php?page=wpuf_subscription');
        await expect(page.locator('body.wpuf-admin-react')).toHaveCount(1);
        await expect(page.getByText('Subscriptions', { exact: false }).first()).toBeVisible({ timeout: 30000 });
        expectClean('subscriptions');
    });

    test('RS0004 : Settings screen mounts', { tag: ['@Lite', '@Test_RS0004'] }, async () => {
        await visit('admin.php?page=wpuf-settings');
        await expect(page.locator('#wpuf-settings-root h2', { hasText: /WP User Frontend/ }).first()).toBeVisible({ timeout: 30000 });
        expectClean('settings');
    });

    test('RS0005 : Registration forms list and a new registration form open in React (Pro)', { tag: ['@Pro', '@Test_RS0005'] }, async () => {
        test.skip(!new AiFormBuilderPage(page).proActive(), 'registration forms need Pro');
        await visit('admin.php?page=wpuf-profile-forms');
        await expect(page.locator('button:has-text("AI Form Builder")').first()).toBeVisible({ timeout: 30000 });
        expectClean('registration forms list');

        await visit('admin.php?page=wpuf-profile-forms&action=add-new');
        await expect(page).toHaveURL(/action=edit&id=\d+/);
        await expect(page.getByRole('tab', { name: 'Form Editor' }).first()).toBeVisible({ timeout: 30000 });
        expectClean('registration form builder');
    });
});
