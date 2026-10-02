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
        const { [field]: _edited, ...othersAfter } = after[sections[0]];
        const { [field]: _old, ...othersBefore } = before[sections[0]] ?? {};
        expect(othersAfter, 'other fields untouched').toEqual(othersBefore);

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
});
