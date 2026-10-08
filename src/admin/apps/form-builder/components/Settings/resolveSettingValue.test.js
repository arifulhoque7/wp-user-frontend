import { resolveSettingValue } from './SettingsSection';

// The section's UI parts pull in @wpuf/components (not resolvable under jest).
jest.mock( './SettingsField', () => () => null );
jest.mock( './ProPreviewWrapper', () => () => null );

/**
 * The value a settings row shows (develop's wpuf_render_settings_field), and the
 * post expiration selects shown while nothing is stored (QA story 10).
 */
describe( 'resolveSettingValue', () => {
    const typeDef = {
        name: 'wpuf_settings[expiration_settings][expiration_time_type]',
        type: 'select',
        options: { day: 'Day(s)', week: 'Week(s)', month: 'Month(s)' },
    };
    const statusDef = {
        name: 'wpuf_settings[expiration_settings][expired_post_status]',
        type: 'select',
        options: { draft: 'Draft', pending: 'Pending Review' },
    };

    test( 'expiration selects show Day(s) / Draft while nothing is stored', () => {
        expect( resolveSettingValue( {}, 'expiration_time_type', typeDef ) ).toBe( 'day' );
        expect( resolveSettingValue( {}, 'expired_post_status', statusDef ) ).toBe( 'draft' );
        expect( resolveSettingValue( { expiration_settings: { expiration_time_value: '3' } }, 'expired_post_status', statusDef ) ).toBe( 'draft' );
    } );

    test( 'a stored expiration value wins', () => {
        const settings = { expiration_settings: { expiration_time_type: 'week', expired_post_status: 'pending' } };

        expect( resolveSettingValue( settings, 'expiration_time_type', typeDef ) ).toBe( 'week' );
        expect( resolveSettingValue( settings, 'expired_post_status', statusDef ) ).toBe( 'pending' );
    } );

    test( 'other selects keep showing nothing until a pick', () => {
        expect( resolveSettingValue( {}, 'post_permission', { name: 'wpuf_settings[post_permission]', type: 'select', options: { everyone: '-' } } ) ).toBe( '' );
    } );

    test( 'value, then default, apply to a missing key', () => {
        expect( resolveSettingValue( {}, 'enable_post_expiration', { name: 'wpuf_settings[expiration_settings][enable_post_expiration]', type: 'toggle', value: 'on' } ) ).toBe( 'on' );
        expect( resolveSettingValue( {}, 'submit_text', { type: 'text', default: 'Submit' } ) ).toBe( 'Submit' );
    } );
} );
