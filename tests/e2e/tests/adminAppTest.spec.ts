import { Browser, BrowserContext, Page, test, expect, chromium } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { BasicLoginPage } from '../pages/basicLogin';
import { SettingsReactPage } from '../pages/settingsReact';
import { aiWp, AiFormBuilderPage } from '../pages/aiFormBuilder';
import { Users, Urls } from '../utils/testData';
import { builderFormId } from '../utils/builderUrl';

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
 * @Test_APP0007 : Post forms list <-> registration forms list (Pro) through the menu without a page load, each list with its own data
 * @Test_APP0008 : A list row action (trash) runs on the server and comes back to the list in the app with its notice
 * @Test_APP0009 : Post list -> builder -> list without a page load; the builder's stylesheet and body class only on its route
 * @Test_APP0010 : One builder after another: no stale form data, rootInit once per opened builder, old builder URL lands on the route
 * @Test_APP0011 : Unsaved builder changes ask before leaving the route; Continue stays, Discard leaves; save works in the app
 * @Test_APP0012 : The new form route creates a form and opens its builder; registration builder (Pro) opens in the app
 * @Test_APP0013 : Add New in the app: the template picker's Blank Form and a template each create a form and open its builder in the app
 * @Test_APP0014 : AI form builder in the app: list button -> AI route -> generate -> Edit with Builder -> builder route, no page load; old AI URLs (with nonce) land on the route
 * @Test_APP0015 : List row action buttons in the app: Edit (builder route, no page load), Duplicate, Trash, Restore, Delete Permanently, bulk Move to trash; registration Edit (Pro)
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

    test('APP0007 : Post forms list <-> registration forms list through the menu without a page load', { tag: ['@Pro', '@Test_APP0007'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');

        const listType = () => page.evaluate(() => ((window as unknown as { wpuf_forms_list?: { post_type?: string } }).wpuf_forms_list || {}).post_type || 'wpuf_forms');

        await page.goto(`${APP}#/post-forms`);
        await expect(page.locator('#wpuf-post-forms-list-table-view h3', { hasText: 'Post Forms' }).first()).toBeVisible({ timeout: 30000 });
        await expect(page.locator('button:has-text("AI Form Builder")').first()).toBeVisible();
        await page.evaluate(() => { (window as unknown as { wpufNoReload: boolean }).wpufNoReload = true; });
        expect(await listType()).toBe('wpuf_forms');

        const registration = page.locator('#toplevel_page_wp-user-frontend a', { hasText: 'Registration Forms' }).first();
        test.skip(!(await registration.getAttribute('href') || '').includes('#/registration-forms'), 'registration forms need Pro');

        await registration.click();
        await expect(page.locator('#wpuf-profile-forms-list-table-view').first()).toBeVisible({ timeout: 30000 });
        await expect(page.locator('#wpuf-profile-forms-list-table-view th', { hasText: /User Role/i }).first()).toBeVisible({ timeout: 30000 });
        expect(await listType()).toBe('wpuf_profile');

        await page.locator('#toplevel_page_wp-user-frontend a', { hasText: 'Post Forms' }).first().click();
        await expect(page.locator('#wpuf-post-forms-list-table-view th', { hasText: /Post Type/i }).first()).toBeVisible({ timeout: 30000 });
        expect(await listType()).toBe('wpuf_forms');
        expect(await page.evaluate(() => (window as unknown as { wpufNoReload?: boolean }).wpufNoReload), 'no page load between the lists').toBe(true);
    });

    test('APP0008 : A list row action comes back to the list in the app with its notice', { tag: ['@Lite', '@Test_APP0008'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');
        test.skip(!process.env.WPUF_E2E_WP_PATH, 'needs WP-CLI on the site');

        const id = aiWp(['eval', "echo wpuf_create_sample_form( 'APP0008 trash me', 'wpuf_forms' );"], true).trim().split('\n').pop();

        await page.goto(`${APP}#/post-forms`);
        await expect(page.locator('#wpuf-post-forms-list-table-view').first()).toBeVisible({ timeout: 30000 });
        const nonce = await page.evaluate(() => (window as unknown as { wpuf_forms_list: { bulk_nonce: string } }).wpuf_forms_list.bulk_nonce);

        // The list's row action: the server's nonce-checked list action, then back.
        await page.goto(`${Urls.baseUrl}/wp-admin/admin.php?page=wpuf-post-forms&id=${id}&action=trash&_wpnonce=${nonce}`);
        await expect(page).toHaveURL(/page=wp-user-frontend#\/post-forms/);
        await expect(page.locator('#wpuf-admin-app-notices')).toContainText('1 form moved to the trash.');
        expect(aiWp(['post', 'get', String(id), '--field=post_status']).trim()).toBe('trash');
        aiWp(['post', 'delete', String(id), '--force']);
    });

    /** Builder state from the page: form name, field count, store form id. */
    const builderState = () => page.evaluate(() => {
        const w = window as unknown as { wp: { data: { select: ( name: string ) => { getPost: () => { ID: number; post_title: string }; getFormFields: () => unknown[]; getIsDirty: () => boolean } } }; wpuf: { storeName: string } };
        const store = w.wp.data.select( w.wpuf.storeName );

        return { id: store.getPost().ID, title: store.getPost().post_title, fields: store.getFormFields().length, dirty: store.getIsDirty() };
    });
    const builderReady = async (title: string) => {
        await expect(page.locator('#wpuf-form-builder #wpuf-form-builder-app input[name="post_title"]').first()).toHaveValue(title, { timeout: 30000 });
    };
    /** Rename in the builder header (the save posts the header input) and mark the form changed. */
    const renameForm = async (title: string) => {
        const name = page.locator('#wpuf-form-builder input[name="post_title"]').first();
        await name.click();
        await name.fill(title);
        await name.press('Enter');
        await page.evaluate(() => {
            const w = window as unknown as { wp: { data: { dispatch: ( n: string ) => { markDirty: () => void } } }; wpuf: { storeName: string } };
            w.wp.data.dispatch( w.wpuf.storeName ).markDirty();
        });
    };
    const newForm = (title: string, type = 'wpuf_forms') => Number(aiWp(['eval', `echo wpuf_create_sample_form( '${title}', '${type}' );`], true).trim().split('\n').pop());

    test('APP0009 : Post list -> builder -> list without a page load', { tag: ['@Lite', '@Test_APP0009'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');
        test.skip(!process.env.WPUF_E2E_WP_PATH, 'needs WP-CLI on the site');

        const id = newForm('APP0009 builder');
        const sheetOn = (sheet: string) => page.evaluate((s) => {
            const link = document.getElementById(s) as HTMLLinkElement | null;
            return !!link && !link.disabled;
        }, sheet);

        await page.goto(`${APP}#/post-forms`);
        await expect(page.locator('#wpuf-post-forms-list-table-view').first()).toBeVisible({ timeout: 30000 });
        await page.evaluate(() => { (window as unknown as { wpufNoReload: boolean }).wpufNoReload = true; });

        await page.evaluate((formId) => { window.location.hash = `#/post-forms/${formId}/edit`; }, id);
        await builderReady('APP0009 builder');
        expect(await page.evaluate(() => document.body.classList.contains('wpuf-builder-screen'))).toBe(true);
        expect(await sheetOn('wpuf-admin-form-builder-css'), 'builder sheet on').toBe(true);
        expect(await sheetOn('wpuf-forms-list-css'), 'list sheet off').toBe(false);
        await expect(page.locator('#toplevel_page_wp-user-frontend li.current a')).toHaveText('Post Forms');
        await expect(page.locator('input[name="wpuf_form_id"]')).toHaveValue(String(id));
        await expect(page.locator('input[name="wpuf_form_builder_nonce"]')).toHaveCount(1);

        await page.locator('#toplevel_page_wp-user-frontend a', { hasText: 'Post Forms' }).first().click();
        await expect(page.locator('#wpuf-post-forms-list-table-view').first()).toBeVisible({ timeout: 30000 });
        expect(await page.evaluate(() => document.body.classList.contains('wpuf-builder-screen'))).toBe(false);
        expect(await sheetOn('wpuf-forms-list-css'), 'list sheet back on').toBe(true);
        expect(await sheetOn('wpuf-admin-form-builder-css'), 'builder sheet off').toBe(false);
        expect(await page.evaluate(() => (window as unknown as { wpufNoReload?: boolean }).wpufNoReload), 'no page load').toBe(true);
        aiWp(['post', 'delete', String(id), '--force']);
    });

    test('APP0010 : One builder after another without stale data', { tag: ['@Lite', '@Test_APP0010'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');
        test.skip(!process.env.WPUF_E2E_WP_PATH, 'needs WP-CLI on the site');

        const first = newForm('APP0010 first');
        const second = Number(aiWp(['eval', "echo wpuf_create_sample_form( 'APP0010 second', 'wpuf_forms', true );"], true).trim().split('\n').pop());

        // Old builder URL: the load step runs, then the app route.
        await page.goto(`${Urls.baseUrl}/wp-admin/admin.php?page=wpuf-post-forms&action=edit&id=${first}`);
        await expect(page).toHaveURL(new RegExp(`page=wp-user-frontend#/post-forms/${first}/edit`));
        await builderReady('APP0010 first');
        await page.evaluate(() => {
            const w = window as unknown as { wp: { hooks: { addAction: ( h: string, n: string, cb: () => void ) => void } }; rootInits: number };
            w.rootInits = 0;
            w.wp.hooks.addAction( 'wpuf.formBuilder.rootInit', 'e2e/count', () => { w.rootInits++; } );
        });
        const a = await builderState();
        expect(a.id).toBe(first);

        await page.evaluate((formId) => { window.location.hash = `#/post-forms/${formId}/edit`; }, second);
        await builderReady('APP0010 second');
        const b = await builderState();
        expect(b.id).toBe(second);
        expect(b.fields, 'blank form has its own (fewer) fields').toBeLessThan(a.fields);
        expect(b.dirty).toBe(false);
        expect(await page.evaluate(() => (window as unknown as { rootInits: number }).rootInits), 'rootInit once per opened builder').toBe(1);
        await expect(page.locator('input[name="wpuf_form_id"]')).toHaveValue(String(second));
        await expect(page.locator('#wpuf-form-builder')).toHaveCount(1);

        aiWp(['post', 'delete', String(first), String(second), '--force']);
    });

    test('APP0011 : Unsaved builder changes ask before leaving; save works in the app', { tag: ['@Lite', '@Test_APP0011'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');
        test.skip(!process.env.WPUF_E2E_WP_PATH, 'needs WP-CLI on the site');

        const id = newForm('APP0011 guard');

        await page.goto(`${APP}#/post-forms/${id}/edit`);
        await builderReady('APP0011 guard');
        await renameForm('APP0011 renamed');
        expect((await builderState()).dirty).toBe(true);

        await page.evaluate(() => { window.location.hash = '#/post-forms'; });
        await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();
        await page.getByRole('button', { name: 'Continue Editing' }).click();
        await expect(page).toHaveURL(new RegExp(`#/post-forms/${id}/edit`));
        await expect(page.locator('#wpuf-form-builder')).toHaveCount(1);

        // Save in the app: the REST save reads the route's hidden inputs.
        const saved = page.waitForResponse((r) => r.url().includes(`admin/forms/${id}`) && 'POST' === r.request().method());
        await page.locator('//button[normalize-space(text())="Save"]').first().click();
        expect((await saved).status()).toBe(200);
        await expect.poll(() => aiWp(['post', 'get', String(id), '--field=post_title']).trim()).toBe('APP0011 renamed');

        await renameForm('APP0011 unsaved');
        await page.evaluate(() => { window.location.hash = '#/post-forms'; });
        await page.getByRole('button', { name: 'Discard Changes' }).click();
        await expect(page.locator('#wpuf-post-forms-list-table-view').first()).toBeVisible({ timeout: 30000 });
        aiWp(['post', 'delete', String(id), '--force']);
    });

    test('APP0012 : New form route creates a form; registration builder opens in the app', { tag: ['@Lite', '@Test_APP0012'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');
        test.skip(!process.env.WPUF_E2E_WP_PATH, 'needs WP-CLI on the site');

        await page.goto(`${APP}#/post-forms/new`);
        await expect(page).toHaveURL(/#\/post-forms\/\d+\/edit$/, { timeout: 30000 });
        await builderReady('Sample Form');
        const created = (await builderState()).id;
        expect(aiWp(['post', 'get', String(created), '--field=post_type']).trim()).toBe('wpuf_forms');
        aiWp(['post', 'delete', String(created), '--force']);

        const registration = await page.evaluate(() => !!((window as unknown as { wpufAdmin: { app: { routes: { id: string; mode: string }[] } } }).wpufAdmin.app.routes.find((r) => 'registration-form-edit' === r.id && 'app' === r.mode)));
        test.skip(!registration, 'registration builder needs Pro');

        const reg = newForm('APP0012 registration', 'wpuf_profile');
        await page.evaluate((formId) => { window.location.hash = `#/registration-forms/${formId}/edit`; }, reg);
        await builderReady('APP0012 registration');
        expect((await builderState()).id).toBe(reg);
        await expect(page.locator('#toplevel_page_wp-user-frontend li.current a')).toHaveText('Registration Forms');
        await expect(page.locator('#wpuf-form-builder')).toHaveClass(/wpuf-form-builder-profile/);
        aiWp(['post', 'delete', String(reg), '--force']);
    });

    test('APP0013 : Add New: blank form and a template open their builder in the app', { tag: ['@Lite', '@Test_APP0013'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');

        const screens = [
            { list: '#/post-forms', template: 'post_form_template_post', postType: 'wpuf_forms', route: 'post-forms' },
            { list: '#/registration-forms', template: 'simple_user_signup_template', postType: 'wpuf_profile', route: 'registration-forms' },
        ];

        for (const screen of screens) {
            await page.goto(`${APP}${screen.list}`);
            const add = page.locator('.new-wpuf-form').first();

            if ('wpuf_profile' === screen.postType && !(await add.isVisible({ timeout: 15000 }).catch(() => false))) {
                continue; // registration forms need Pro
            }

            const picker = page.locator('.wpuf-template-picker');

            // Blank Form: the new form route, no page load.
            await add.click();
            await expect(picker).toBeVisible();
            await page.evaluate(() => { (window as unknown as { wpufNoReload: boolean }).wpufNoReload = true; });
            await picker.locator('[data-template="blank"] a').first().click({ force: true });
            await expect(page).toHaveURL(new RegExp(`#/${screen.route}/\\d+/edit$`), { timeout: 30000 });
            await expect(page.locator('#wpuf-form-builder input[name="post_title"]').first()).toBeVisible({ timeout: 30000 });
            expect(await page.evaluate(() => (window as unknown as { wpufNoReload?: boolean }).wpufNoReload), 'blank form without a page load').toBe(true);
            const blank = (await builderState()).id;

            // A template: created by the server's template action, then its builder in the app.
            await page.goto(`${APP}${screen.list}`);
            await add.click();
            await expect(picker).toBeVisible();
            await picker.locator(`[data-template="${screen.template}"] a`).first().click({ force: true });
            await expect(page).toHaveURL(new RegExp(`page=wp-user-frontend#/${screen.route}/\\d+/edit$`), { timeout: 30000 });
            await expect(page.locator('#wpuf-form-builder input[name="post_title"]').first()).toBeVisible({ timeout: 30000 });
            const state = await builderState();
            expect(state.id).not.toBe(blank);
            expect(state.fields, 'the template brought its fields').toBeGreaterThan(0);

            if (process.env.WPUF_E2E_WP_PATH) {
                expect(aiWp(['post', 'get', String(state.id), '--field=post_type']).trim()).toBe(screen.postType);
                aiWp(['post', 'delete', String(blank), String(state.id), '--force']);
            }
        }
    });

    test('APP0014 : AI form builder runs in the app', { tag: ['@Lite', '@Test_APP0014'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');
        test.skip(!process.env.WPUF_E2E_WP_PATH, 'needs WP-CLI on the site (AI mock key)');

        const ai = new AiFormBuilderPage(page);
        ai.configureMock();

        try {
            for (const list of ['post', 'profile'] as const) {
                const route = 'profile' === list ? 'registration-forms' : 'post-forms';

                await page.goto(`${APP}#/${route}`);
                const button = page.locator(ai.S.listButton).first();

                if ('profile' === list && !(await button.isVisible({ timeout: 15000 }).catch(() => false))) {
                    continue; // registration forms need Pro
                }

                await page.evaluate(() => { (window as unknown as { wpufNoReload: boolean }).wpufNoReload = true; });
                await button.click();
                await expect(page).toHaveURL(new RegExp(`page=wp-user-frontend#/${route}/ai`));
                await expect(page.locator(ai.S.inputHeading)).toBeVisible({ timeout: 30000 });
                expect(await page.evaluate(() => document.body.classList.contains('wpuf-ai-form-builder-page'))).toBe(true);
                expect(await page.evaluate(() => (window as unknown as { wpufAIFormBuilder: { formType: string } }).wpufAIFormBuilder.formType)).toBe(list);

                await ai.generate('profile' === list ? 'Create a sign up form' : 'Create a contact form');
                await page.locator(ai.S.editInBuilderButton).click();
                await expect(page).toHaveURL(new RegExp(`#/${route}/\\d+/edit$`), { timeout: 30000 });
                await expect(page.locator('#wpuf-form-builder input[name="post_title"]').first()).toBeVisible({ timeout: 30000 });
                expect(await page.evaluate(() => document.body.classList.contains('wpuf-ai-form-builder-page')), 'AI body class gone on the builder').toBe(false);
                expect(await page.evaluate(() => (window as unknown as { wpufNoReload?: boolean }).wpufNoReload), 'AI -> builder without a page load').toBe(true);
                const id = (await builderState()).id;
                expect(aiWp(['post', 'get', String(id), '--field=post_type']).trim()).toBe('profile' === list ? 'wpuf_profile' : 'wpuf_forms');
                aiWp(['post', 'delete', String(id), '--force']);
            }

            // Old AI URLs keep their nonce check, then land on the route with their stage.
            await page.goto(`${APP}#/post-forms`);
            await expect(page.locator('#wpuf-post-forms-list-table-view').first()).toBeVisible({ timeout: 30000 });
            const nonce = await page.evaluate(() => (window as unknown as { wpuf_forms_list: { template_nonce: string } }).wpuf_forms_list.template_nonce);
            await page.goto(`${Urls.baseUrl}/wp-admin/admin.php?action=post_form_template&template=ai_form&_wpnonce=${nonce}&description=Old%20link`);
            await expect(page).toHaveURL(/page=wp-user-frontend#\/post-forms\/ai\?description=Old(%20|\+)link$/);
            await expect(page.locator(ai.S.inputHeading)).toBeVisible({ timeout: 30000 });
            await page.goto(`${Urls.baseUrl}/wp-admin/admin.php?action=wpuf_ai_form_success&_wpnonce=bad`);
            await expect(page.locator('body')).toContainText('Security check failed');
        } finally {
            ai.restore();
        }
    });

    test('APP0015 : List row action buttons work in the app', { tag: ['@Lite', '@Test_APP0015'] }, async () => {
        test.skip(!(await appOn()), 'admin app is off');
        test.skip(!process.env.WPUF_E2E_WP_PATH, 'needs WP-CLI on the site');

        const title = `APP0015 ${Date.now()}`;
        const id = newForm(title);
        const list = page.locator('#wpuf-post-forms-list-table-view');
        const notices = page.locator('#wpuf-admin-app-notices');
        const rowAction = async (formTitle: string, item: string) => {
            await page.locator(`button[aria-label="Actions for ${formTitle}"]`).first().click();
            await page.getByRole('menuitem', { name: item, exact: true }).click();
        };
        const openList = async (hash = '#/post-forms') => {
            await page.goto(`${APP}${hash}`);
            await expect(list.locator('table').first()).toBeVisible({ timeout: 30000 });
        };

        // Edit: the builder route, no page load.
        await openList();
        await page.evaluate(() => { (window as unknown as { wpufNoReload: boolean }).wpufNoReload = true; });
        await rowAction(title, 'Edit');
        await expect(page).toHaveURL(new RegExp(`#/post-forms/${id}/edit$`));
        await expect(page.locator('#wpuf-form-builder input[name="post_title"]').first()).toHaveValue(title, { timeout: 30000 });
        expect(await page.evaluate(() => (window as unknown as { wpufNoReload?: boolean }).wpufNoReload), 'Edit without a page load').toBe(true);

        // Duplicate: the server action, back to the list with its notice.
        await openList();
        await rowAction(title, 'Duplicate');
        await expect(page).toHaveURL(/page=wp-user-frontend#\/post-forms/, { timeout: 30000 });
        await expect(notices).toContainText('Form duplicated successfully.');
        const copy = Number(builderFormId(new URL((await notices.locator('a', { hasText: 'View form' }).first().getAttribute('href')) || '', Urls.baseUrl).toString()));
        expect(copy, 'the copy exists').toBeGreaterThan(id);
        const copyTitle = aiWp(['post', 'get', String(copy), '--field=post_title']).trim();

        // The notice's "View form" link: the copy's builder route, no page load.
        await page.evaluate(() => { (window as unknown as { wpufNoReload: boolean }).wpufNoReload = true; });
        await notices.locator('a', { hasText: 'View form' }).first().click();
        await expect(page).toHaveURL(new RegExp(`#/post-forms/${copy}/edit$`));
        await expect(page.locator('#wpuf-form-builder input[name="post_title"]').first()).toHaveValue(copyTitle, { timeout: 30000 });
        expect(await page.evaluate(() => (window as unknown as { wpufNoReload?: boolean }).wpufNoReload), 'View form without a page load').toBe(true);

        // Trash the copy, restore it from the Trash tab, then delete it permanently.
        await openList();
        await rowAction(copyTitle, 'Trash');
        await expect(notices).toContainText(/form(s)? moved to the trash\./, { timeout: 30000 });
        const trashed = aiWp(['post', 'list', '--post_type=wpuf_forms', '--post_status=trash', `--title=${copyTitle}`, '--format=ids']).trim();
        expect(trashed, 'one copy in the trash').not.toBe('');

        await openList();
        await list.getByText(/^Trash/).first().click();
        await expect(page.locator(`button[aria-label="Actions for ${copyTitle}"]`).first()).toBeVisible({ timeout: 30000 });
        await rowAction(copyTitle, 'Restore');
        await expect(notices).toContainText('1 form restored from the trash.', { timeout: 30000 });

        await openList();
        await rowAction(copyTitle, 'Trash');
        await expect(notices).toContainText('1 form moved to the trash.', { timeout: 30000 });
        await openList();
        await list.getByText(/^Trash/).first().click();
        await expect(page.locator(`button[aria-label="Actions for ${copyTitle}"]`).first()).toBeVisible({ timeout: 30000 });
        await rowAction(copyTitle, 'Delete Permanently');
        await page.getByRole('alertdialog').getByRole('button', { name: 'Delete Permanently' }).click();
        await expect(notices).toContainText('1 form permanently deleted.', { timeout: 30000 });

        // Bulk: select the remaining form, Move to trash.
        await openList();
        await page.getByRole('checkbox', { name: `Select ${title}` }).first().check();
        await page.getByRole('button', { name: 'Move to trash' }).first().click();
        await expect(notices).toContainText('1 form moved to the trash.', { timeout: 30000 });
        expect(aiWp(['post', 'get', String(id), '--field=post_status']).trim()).toBe('trash');
        aiWp(['post', 'delete', String(id), '--force']); // the copy was deleted permanently above

        // Registration list (Pro): Edit opens its builder route.
        const reg = page.locator('#toplevel_page_wp-user-frontend a', { hasText: 'Registration Forms' }).first();
        if (((await reg.getAttribute('href')) || '').includes('#/registration-forms')) {
            const regTitle = `APP0015 reg ${Date.now()}`;
            const regId = newForm(regTitle, 'wpuf_profile');
            await page.goto(`${APP}#/registration-forms`);
            await expect(page.locator(`button[aria-label="Actions for ${regTitle}"]`).first()).toBeVisible({ timeout: 30000 });
            await rowAction(regTitle, 'Edit');
            await expect(page).toHaveURL(new RegExp(`#/registration-forms/${regId}/edit$`));
            await expect(page.locator('#wpuf-form-builder input[name="post_title"]').first()).toHaveValue(regTitle, { timeout: 30000 });
            aiWp(['post', 'delete', String(regId), '--force']);
        }
    });
});
