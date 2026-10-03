import { test, expect } from '@playwright/test';
import * as path from 'path';
import { ParitySitePage } from '../pages/parity';
import { parityDir, paritySite, paritySitesConfigured, parityWp } from '../utils/paritySites';

/**
 * React settings save stores what the legacy screen stored (task 1.4, B3 to B7).
 */
test.describe('Branch settings save', () => {
    test.skip(!paritySitesConfigured(), 'PARITY_* sites not configured');

    test('SET0001 : settings save keeps the legacy shapes and untouched data', { tag: ['@Parity', '@Test_SET0001'] }, () => {
        const result = JSON.parse(parityWp(paritySite('branch'), [
            'eval-file', path.join(parityDir, 'wp', 'check-settings-save.php'), '--exec=define("WP_ADMIN",true);',
        ]));

        expect(result.multicheck, 'multicheck stored as key => key').toEqual({ post_title: 'post_title' });
        expect(result.multicheck_empty, 'empty multicheck stored as the hidden input').toBe('');
        expect(result.multiselect_empty, 'empty multiselect left out').toBe('absent');
        expect(result.custom_css, 'custom CSS keeps selectors').toBe('ul > li { color: red; }');
        expect(result.untouched, 'untouched field keeps its backslash').toBe('keep\\me');
        expect(result.footer_text, 'email footer keeps HTML and backslashes').toBe('<p>Sent by <a href="https://example.com">C:\\Shop</a></p>');
        expect(result.tax_base, 'edited base saved').toEqual({ country: 'US', state: 'NY' });
        expect(result.tax_rates_kept, 'unchanged rates keep the stored form').toEqual({ 3: { country: 'US', state: 'CA', rate: '7.25' } });
        expect(result.tax_rates_new, 'new rates keep the typed text, clamped to 100').toEqual([
            { country: 'GB', state: '', rate: '20' },
            { country: 'DE', state: '', rate: '100' },
        ]);
    });

    test('SET0002 : settings screen posts only the edited field and writes nothing else', { tag: ['@Parity', '@Test_SET0002'] }, async ({ browser }) => {
        const branch = paritySite('branch');
        const dump = () => JSON.parse(parityWp(branch, [
            'eval', 'global $wpdb; $o = []; foreach ( $wpdb->get_col( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE \'wpuf%\' OR option_name = \'n8n\'" ) as $n ) { $o[ $n ] = get_option( $n ); } echo wp_json_encode( $o );',
        ]));
        const before = dump();
        const admin = await ParitySitePage.doOpen(browser, branch);
        const { field, body } = await admin.doEditFirstSettingsText('SET0002 value');
        await admin.doClose();
        const after = dump();

        const sections = Object.keys(body.settings);
        expect(sections.length, 'one section posted').toBe(1);
        expect(Object.keys(body.settings[sections[0]]), 'only the edited field posted').toEqual([field]);
        expect(body.extra, 'no own-option data posted').toEqual({});

        const changed = Object.keys(after).filter((name) => JSON.stringify(after[name]) !== JSON.stringify(before[name]));
        expect(changed, 'only the edited option changed').toEqual([sections[0]]);
        expect(after[sections[0]][field]).toBe('SET0002 value');
        // Existing fields keep their values; a field missing before may now hold
        // its default (legacy std on the section's first save, SET0004).
        const othersBefore = { ...(before[sections[0]] ?? {}) };
        delete othersBefore[field];
        const keptAfter = Object.fromEntries(Object.keys(othersBefore).map((key) => [key, after[sections[0]][key]]));
        expect(keptAfter, 'existing fields untouched').toEqual(othersBefore);

        if (before[sections[0]] === undefined) {
            parityWp(branch, ['option', 'delete', sections[0]]);
        } else {
            parityWp(branch, ['option', 'update', sections[0], JSON.stringify(before[sections[0]]), '--format=json']);
        }
    });

    test('SET0003 : login colors store nothing by default and preview the chosen layout (B22)', { tag: ['@Parity', '@Test_SET0003'] }, () => {
        const out = parityWp(paritySite('branch'), [
            'eval',
            'wp_set_current_user( 1 ); $d = rest_do_request( new WP_REST_Request( "GET", "/wpuf/v1/settings" ) )->get_data(); foreach ( $d["data"]["fields"]["wpuf_profile"] as $f ) { if ( isset( $f["name"] ) && "wpuf_login_label_text_color" === $f["name"] ) { echo wp_json_encode( [ $f["default"], $f["std"], $f["preview_by"], $f["preview"]["layout2"] ] ); } }',
            '--exec=define("WP_ADMIN",true);',
        ]);

        expect(JSON.parse(out.trim().split('\n').pop() || '[]'), 'empty std like develop, layout preview for React').toEqual(['', '', 'wpuf_login_form_layout', '#ffffff']);
    });

    test('SET0004 : first save stores missing defaults; desc HTML is filtered (1.15)', { tag: ['@Parity', '@Test_SET0004'] }, () => {
        const out = parityWp(paritySite('branch'), [
            'eval-file', path.join(parityDir, 'wp', 'check-settings-defaults.php'), '--exec=define("WP_ADMIN",true);',
        ]);

        expect(JSON.parse(out.trim().split('\n').pop() || '{}')).toEqual({
            default_stored: 'set4-std',
            edited: 'x',
            desc: 'See <a href="https://example.com">docs</a>alert(1)',
        });
    });

    test('SET0005 : React settings apply the legacy section hooks, tax and role filters (1.16)', { tag: ['@Parity', '@Test_SET0005'] }, () => {
        const out = parityWp(paritySite('branch'), [
            'eval-file', path.join(parityDir, 'wp', 'check-settings-legacy-hooks.php'), '--exec=define("WP_ADMIN",true);',
        ]);

        expect(JSON.parse(out.trim().split('\n').pop() || '{}')).toEqual({
            top: '<p class="set5">SET5 top</p>',
            bottom: '<p>SET5 bottom</p>',
            fired_other: true,
            tax_country: 'SET5',
            roles: { set5: 'SET5 role' },
        });
    });

    test('SET0006 : Pro settings and Feature_Lock reach WPUF REST routes without a request URL (1.22, B30)', { tag: ['@Parity', '@Test_SET0006'] }, () => {
        const run = (extra: string[]) => JSON.parse(parityWp(paritySite('branch'), ['eval-file', path.join(parityDir, 'wp', 'check-pro-rest-boot.php'), ...extra]).trim().split('\n').pop() || '{}');

        expect(run([]), 'valid license').toEqual({ pro_section: true, locked: false, sections: true });
        expect(run(['invalid']), 'inactive license: the lock hides Pro sections').toEqual({ pro_section: false, locked: true, sections: true });
    });
    test('SET0007 : legacy settings screen saves through the store like develop (2.4d, G2b)', { tag: ['@Parity', '@Test_SET0007'] }, async ({ browser }) => {
        const section = 'wpuf_general';
        const read = (name: 'develop' | 'branch') => parityWp(paritySite(name), ['option', 'get', section, '--format=json']).trim();
        const write = (name: 'develop' | 'branch', json: string) => parityWp(paritySite(name), ['option', 'update', section, json, '--format=json']);
        const original = { develop: read('develop'), branch: read('branch') };
        // Same starting data on both sites: develop's section.
        const seed = original.develop;
        const legacyUrl = { develop: '/wp-admin/admin.php?page=wpuf-settings', branch: '/wp-admin/admin.php?page=wpuf-settings&wpuf_settings_ui=legacy' };

        const saveOnBoth = async (edit: string | null) => {
            const stored: Record<string, unknown> = {};
            for (const name of ['develop', 'branch'] as const) {
                write(name, seed);
                const admin = await ParitySitePage.doOpen(browser, paritySite(name));
                await admin.page.goto(legacyUrl[name], { waitUntil: 'domcontentloaded' });
                const form = admin.page.locator(`form:has(input[name="option_page"][value="${section}"])`);
                await admin.page.locator(`a[href="#${section}"]`).first().click();
                await expect(form).toBeVisible();
                if (edit !== null) {
                    await form.locator(`input[type="text"][name^="${section}["]`).first().fill(edit);
                }
                await Promise.all([
                    admin.page.waitForURL(/settings-updated=true/, { waitUntil: 'domcontentloaded' }),
                    form.locator('input[type="submit"], button[type="submit"]').first().click(),
                ]);
                await admin.doClose();
                stored[name] = JSON.parse(read(name));
            }
            return stored;
        };

        try {
            const untouched = await saveOnBoth(null);
            expect(untouched.branch, 'untouched legacy save stores what develop stores').toEqual(untouched.develop);

            const edited = await saveOnBoth('SET0007 <b>edited</b> \\ value');
            expect(edited.branch, 'edited legacy save stores what develop stores').toEqual(edited.develop);
            expect(JSON.stringify(edited.branch), 'the edit was saved').toContain('SET0007');
        } finally {
            write('develop', original.develop);
            write('branch', original.branch);
        }
    });
});
