<?php
/**
 * The React settings REST controller forwards to the settings store and still
 * stores the same bytes, fires the same hook and answers the same way (task
 * 2.4c); compared with the pre-store copy in tests/php/src/LegacySettingsWriters.php.
 *
 * @package WP_User_Frontend
 */

use WeDevs\Wpuf\Api\Settings as Settings_Api;
use WeDevs\Wpuf\Platform\Stores\SettingsStore;
use WeDevs\Wpuf\Platform\Stores\Stores;

/**
 * Settings store tests.
 */
class SettingsStoreTest extends WP_UnitTestCase {

    /**
     * `wpuf_settings_saved` calls.
     *
     * @var array
     */
    private $fired = [];

    public function set_up() {
        parent::set_up();
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );
        add_action(
            'wpuf_settings_saved',
            function ( $saved, $incoming, $extra ) {
                $this->fired[] = [ $saved, $incoming, $extra ];
            },
            10,
            3
        );
    }

    private function section_ids() {
        return wp_list_pluck( Stores::settings()->sections(), 'id' );
    }

    private function options() {
        $options = [];

        foreach ( $this->section_ids() as $id ) {
            $options[ $id ] = get_option( $id, 'ABSENT' );
        }

        return $options;
    }

    private function reset_options( $options ) {
        foreach ( $options as $id => $value ) {
            if ( 'ABSENT' === $value ) {
                delete_option( $id );
            } else {
                update_option( $id, $value );
            }
        }
    }

    /**
     * A value of the field's type, including markup, slashes and odd numbers.
     */
    private function value_for( $field ) {
        $type    = isset( $field['type'] ) ? $field['type'] : 'text';
        $options = isset( $field['options'] ) && is_array( $field['options'] ) ? array_keys( $field['options'] ) : [ 'a', 'b' ];

        switch ( $type ) {
            case 'multicheck':
            case 'multiselect':
                return array_slice( $options, 0, 2 );
            case 'checkbox':
                return 'on';
            case 'number':
                return '1e3';
            case 'select':
            case 'radio':
                return isset( $options[0] ) ? $options[0] : 'x';
            case 'url':
                return 'javascript:alert(1)';
            case 'textarea':
            case 'wysiwyg':
                return "<p>Hi \\ \"x\"</p><script>bad()</script>";
            default:
                return "Text <b>bold</b> \\ 'q'";
        }
    }

    /**
     * Every registered field of every section with a typed value, plus an
     * unknown field and an unknown section.
     */
    private function full_payload() {
        $payload = [ 'not_a_section' => [ 'x' => 'y' ] ];

        foreach ( Stores::settings()->fields() as $section_id => $fields ) {
            foreach ( (array) $fields as $field ) {
                if ( ! empty( $field['name'] ) ) {
                    $payload[ $section_id ][ $field['name'] ] = $this->value_for( $field );
                }
            }

            $payload[ $section_id ]['not_a_field'] = 'z';
        }

        return $payload;
    }

    private function request( $settings, $extra = null ) {
        $request = new WP_REST_Request( 'POST', '/wpuf/v1/settings' );
        $request->set_param( 'settings', $settings );

        if ( null !== $extra ) {
            $request->set_param( 'extra', $extra );
        }

        return $request;
    }

    /**
     * Save through the legacy controller and the current one from the same
     * starting options; return both results.
     */
    private function both( $settings, $extra = null ) {
        $start = $this->options();

        $this->fired     = [];
        $legacy          = ( new WPUF_Legacy_Settings_Api() )->save_items( $this->request( $settings, $extra ) );
        $legacy_options  = $this->options();
        $legacy_fired    = $this->fired;
        $this->reset_options( $start );

        $this->fired     = [];
        $current         = ( new Settings_Api() )->save_items( $this->request( $settings, $extra ) );

        return [ $legacy, $current, $legacy_options, $this->options(), $legacy_fired, $this->fired ];
    }

    public function test_store_is_shared_from_the_container() {
        $this->assertInstanceOf( SettingsStore::class, Stores::settings() );
        $this->assertSame( Stores::settings(), wpuf()->platform()->get( SettingsStore::class ) );
    }

    public function test_full_save_stores_the_same_bytes_hook_and_response() {
        $payload = $this->full_payload();
        $this->assertGreaterThan( 5, count( $payload ), 'real sections in the schema' );
        $this->assertGreaterThan( 40, array_sum( array_map( 'count', $payload ) ), 'real fields in the schema' );

        list( $legacy, $current, $legacy_options, $current_options, $legacy_fired, $current_fired ) = $this->both( $payload, [ 'tax' => [ 'rate' => 5 ] ] );
        $this->assertNotEmpty( array_filter( $current_options, 'is_array' ), 'options were written' );

        $this->assertSame( $legacy->get_status(), $current->get_status() );
        $this->assertSame( $legacy->get_data(), $current->get_data() );
        $this->assertSame( $legacy_options, $current_options, 'every section option identical' );
        $this->assertSame( $legacy_fired, $current_fired, 'wpuf_settings_saved fired once with the same saved, incoming and extra' );
        $this->assertCount( 1, $current_fired );
    }

    public function test_first_save_of_one_field_stores_defaults_like_before() {
        foreach ( $this->section_ids() as $id ) {
            delete_option( $id );
        }

        $first = $this->section_ids()[0];
        list( , , $legacy_options, $current_options ) = $this->both( [ $first => [] ] );

        $this->assertSame( $legacy_options, $current_options );
    }

    /**
     * The legacy form posted strings, so a numeric field default (Pro's
     * `pre_sub_notification_date` => 7) was first stored as "7" (4.6b, SET0010).
     */
    public function test_numeric_default_is_stored_as_the_posted_string() {
        $store  = Stores::settings();
        $fields = [
            [ 'name' => 'edited', 'type' => 'text', 'default' => '' ],
            [ 'name' => 'days', 'type' => 'number', 'default' => 7 ],
            [ 'name' => 'ratio', 'type' => 'text', 'default' => 1.5 ],
        ];

        delete_option( 'wpuf_test_numeric_default' );
        $stored = $store->save_section( 'wpuf_test_numeric_default', [ 'edited' => 'x' ], $fields );
        delete_option( 'wpuf_test_numeric_default' );

        $this->assertSame( '7', $stored['days'] );
        $this->assertSame( '1.5', $stored['ratio'] );
        $this->assertSame( 'x', $stored['edited'] );
    }

    public function test_empty_lists_masked_secrets_and_bad_input_match() {
        $store   = Stores::settings();
        $payload = [];

        foreach ( $store->fields() as $section_id => $fields ) {
            foreach ( (array) $fields as $field ) {
                if ( empty( $field['name'] ) ) {
                    continue;
                }

                if ( $store->is_multiselect( $field ) || ( isset( $field['type'] ) && 'multicheck' === $field['type'] ) ) {
                    $payload[ $section_id ][ $field['name'] ] = [];
                } elseif ( $store->is_secret_field( $field ) ) {
                    $payload[ $section_id ][ $field['name'] ] = wpuf_settings_mask_secret( 'stored-secret-value' );
                    update_option( $section_id, array_merge( (array) get_option( $section_id, [] ), [ $field['name'] => 'stored-secret-value' ] ) );
                } elseif ( isset( $field['type'] ) && 'number' === $field['type'] ) {
                    $payload[ $section_id ][ $field['name'] ] = 'abc';
                }
            }
        }

        list( $legacy, $current, $legacy_options, $current_options ) = $this->both( $payload );

        $this->assertSame( $legacy->get_data(), $current->get_data() );
        $this->assertSame( $legacy_options, $current_options );

        list( $legacy, $current ) = $this->both( 'not an array' );
        $this->assertSame( $legacy->get_data(), $current->get_data() );
        $this->assertSame( 400, $current->get_status() );
    }

    public function test_get_items_returns_the_same_payload() {
        $this->both( $this->full_payload() );

        $legacy  = ( new WPUF_Legacy_Settings_Api() )->get_items( new WP_REST_Request( 'GET', '/wpuf/v1/settings' ) );
        $current = ( new Settings_Api() )->get_items( new WP_REST_Request( 'GET', '/wpuf/v1/settings' ) );

        $this->assertSame( $legacy->get_data(), $current->get_data() );
    }
}
