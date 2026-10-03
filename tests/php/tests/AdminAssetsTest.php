<?php
/**
 * Admin assets and boot payload (task 2.5b).
 *
 * @package WP_User_Frontend
 */

use WeDevs\Wpuf\Admin\BootPayload;

/**
 * Admin assets tests.
 */
class AdminAssetsTest extends WP_UnitTestCase {

    public function set_up() {
        parent::set_up();
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );
    }

    public function tear_down() {
        unset( $_GET['page'] );
        parent::tear_down();
    }

    public function test_react_apps_are_registered_in_the_shared_registry() {
        wpuf()->assets->register_all_scripts();

        foreach ( [ 'wpuf-forms-list-react', 'wpuf-settings-react', 'wpuf-admin-subscriptions-react', 'wpuf-form-builder-react' ] as $handle ) {
            $this->assertTrue( wp_script_is( $handle, 'registered' ), $handle );
        }

        foreach ( [ 'wpuf-settings-react', 'wpuf-subscriptions-react' ] as $handle ) {
            $this->assertTrue( wp_style_is( $handle, 'registered' ), $handle . ' style' );
        }

    }

    public function test_boot_payload_has_the_common_values_and_scoped_filters() {
        add_filter(
            'wpuf_admin_boot',
            function ( $data, $screen ) {
                $data['all'] = $screen;

                return $data;
            },
            10,
            2
        );
        add_filter(
            'wpuf_admin_boot_settings',
            function ( $data ) {
                $data['only_settings'] = true;

                return $data;
            }
        );

        $boot     = new BootPayload();
        $settings = $boot->data( 'settings' );
        $forms    = $boot->data( 'post_forms' );

        foreach ( [ 'screen', 'restUrl', 'restNonce', 'ajaxUrl', 'adminUrl', 'assetUrl', 'version', 'proVersion', 'isPro', 'canManage' ] as $key ) {
            $this->assertArrayHasKey( $key, $settings );
        }

        $this->assertSame( 'settings', $settings['all'] );
        $this->assertTrue( $settings['only_settings'] );
        $this->assertArrayNotHasKey( 'only_settings', $forms, 'scoped filter only for its screen' );
        $this->assertStringNotContainsStringIgnoringCase( 'secret', wp_json_encode( $settings ) );
    }

    public function test_boot_payload_is_printed_once_before_the_app() {
        wp_register_script( 'wpuf-test-app', 'https://example.test/app.js', [], '1', true );

        $boot = new BootPayload();
        $boot->attach( 'post_forms', 'wpuf-test-app' );
        $boot->attach( 'post_forms', 'wpuf-test-app' );

        $before = array_values( array_filter( (array) wp_scripts()->get_data( 'wpuf-test-app', 'before' ) ) );

        $this->assertCount( 1, $before );
        $this->assertStringStartsWith( 'window.wpufAdmin = {', $before[0] );
    }

    public function test_common_scripts_print_nothing_and_move_the_badge_to_the_footer() {
        set_current_screen( 'dashboard' );
        $_GET['page'] = 'wpuf-post-forms';

        $admin = ( new ReflectionClass( WeDevs\Wpuf\Admin::class ) )->newInstanceWithoutConstructor();

        ob_start();
        $admin->enqueue_common_scripts();
        $output = ob_get_clean();

        $this->assertSame( '', $output, 'nothing printed before the document' );
        $this->assertNotFalse( has_action( 'admin_footer' ) );
    }
}
