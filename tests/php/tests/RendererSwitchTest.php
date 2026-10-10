<?php
/**
 * The React or classic decision of the frontend shortcodes.
 *
 * @package WP_User_Frontend
 */

use WeDevs\Wpuf\Frontend\Renderer_Switch;

class RendererSwitchTest extends WP_UnitTestCase {

    private $built = [];

    public function set_up() {
        parent::set_up();
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'subscriber' ] ) );

        // Each test starts with empty asset queues (they persist across tests otherwise).
        $GLOBALS['wp_scripts'] = new WP_Scripts();
        $GLOBALS['wp_styles']  = new WP_Styles();
        wpuf()->assets->register_all_scripts();
    }

    public function tear_down() {
        foreach ( $this->built as $file ) {
            if ( file_exists( $file ) ) {
                unlink( $file );
            }
        }

        $this->built = [];
        delete_option( 'wpuf_general' );

        parent::tear_down();
    }

    private function renderer() {
        return wpuf()->platform()->get( Renderer_Switch::class );
    }

    /** Pretend the bundles are built (the PHP part ships before the apps). */
    private function build( ...$apps ) {
        $dir = WPUF_ROOT . '/assets/js/frontend';

        if ( ! is_dir( $dir ) ) {
            wp_mkdir_p( $dir );
        }

        foreach ( array_merge( [ 'runtime' ], $apps ) as $app ) {
            $file = $dir . '/' . Renderer_Switch::bundle( $app ) . '.js';

            if ( ! file_exists( $file ) ) {
                file_put_contents( $file, '/* test stub */' );
                $this->built[] = $file;
            }
        }
    }

    private function enable() {
        update_option( 'wpuf_general', [ 'frontend_react' => 'on' ] );
    }

    public function test_classic_by_default_even_with_the_apps_built() {
        $this->build( 'forms', 'account' );

        $this->assertFalse( $this->renderer()->enabled() );
        $this->assertFalse( $this->renderer()->is_react( 'account' ) );
        $this->assertFalse( $this->renderer()->is_react( 'post_form', 1 ) );
    }

    public function test_setting_on_but_an_app_not_built_stays_classic() {
        $this->enable();

        $this->assertTrue( $this->renderer()->enabled() );
        $this->assertFalse( $this->renderer()->app_built( 'nope' ) );
        $this->assertSame( 'account-react', Renderer_Switch::bundle( 'account' ) );
        $this->assertSame( 'forms', Renderer_Switch::bundle( 'forms' ) );
        $this->assertFalse( $this->renderer()->is_react( 'nope' ) );
    }

    public function test_react_when_on_and_built_except_from_block_elementor_filter_or_override() {
        $this->enable();
        $this->build( 'forms', 'account' );
        $renderer = $this->renderer();

        $this->assertTrue( $renderer->is_react( 'account' ) );
        $this->assertTrue( $renderer->is_react( 'post_form', 1 ) );
        $this->assertTrue( $renderer->is_react( 'edit_form', 1 ) );
        $this->assertFalse( $renderer->is_react( 'unknown_part' ) );

        $this->assertFalse(
            Renderer_Switch::with_source(
                'block',
                function () use ( $renderer ) {
                    return $renderer->is_react( 'post_form', 1 );
                }
            )
        );
        $this->assertFalse(
            Renderer_Switch::with_source(
                'elementor',
                function () use ( $renderer ) {
                    return $renderer->is_react( 'account' );
                }
            )
        );
        $this->assertSame( 'shortcode', Renderer_Switch::source(), 'the source is restored' );

        add_filter( 'wpuf_frontend_react_render', '__return_false' );
        $this->assertFalse( $renderer->is_react( 'account' ) );
        remove_filter( 'wpuf_frontend_react_render', '__return_false' );

        $override = get_stylesheet_directory() . '/wpuf/account.php';

        if ( ! is_dir( dirname( $override ) ) ) {
            mkdir( dirname( $override ), 0777, true );
        }

        file_put_contents( $override, '<?php // theme override' );
        $this->built[] = $override;

        $this->assertTrue( $renderer->has_template_override( 'account' ) );
        $this->assertFalse( $renderer->is_react( 'account' ), 'a theme override keeps the classic render' );
        $this->assertTrue( $renderer->is_react( 'post_form', 1 ), 'forms have no overridable templates' );
    }

    public function test_account_shortcode_mounts_the_app_and_editprofile_stays_classic() {
        $this->enable();
        $this->build( 'forms', 'account' );

        $account = do_shortcode( '[wpuf_account]' );

        $this->assertStringContainsString( 'data-wpuf-react="account"', $account );
        $this->assertStringContainsString( 'class="wpuf-boot"', $account );
        $this->assertStringContainsString( 'wpuf-account-container wpuf-account-boot', $account, 'the classic container class stays for CSS written against it' );
        $this->assertStringContainsString( '"slug":"dashboard"', $account );
        $this->assertTrue( wp_script_is( 'wpuf-frontend-account', 'enqueued' ) );
        $this->assertTrue( wp_style_is( 'wpuf-frontend-react-runtime', 'enqueued' ) );
        $this->assertTrue( wp_style_is( 'wpuf-frontend-react-account', 'enqueued' ) );
        $this->assertTrue( $this->renderer()->rendered( 'account' ) );

        $classic = do_shortcode( '[wpuf_editprofile]' );

        $this->assertStringNotContainsString( 'data-wpuf-react', $classic );
        $this->assertStringContainsString( 'wpuf-account-sidebar', $classic );
    }

    public function test_post_form_shortcode_mounts_the_app_with_the_schema() {
        $this->enable();
        $this->build( 'forms', 'account' );
        $form_id = wpuf_create_sample_form( 'Switch Form', 'wpuf_forms' );

        $html = do_shortcode( '[wpuf_form id="' . $form_id . '"]' );

        $this->assertStringContainsString( 'data-wpuf-react="forms"', $html );
        $this->assertStringContainsString( 'wpuf-form-add wpuf-form-layout1 wpuf-form-boot', $html );
        $this->assertStringContainsString( '"name":"post_title"', $html );
        $this->assertTrue( wp_script_is( 'wpuf-frontend-forms', 'enqueued' ) );
        $this->assertFalse( wp_script_is( 'wpuf-frontend-form', 'enqueued' ), 'the classic form bundle stays off' );

        add_filter( 'wpuf_frontend_react_render', '__return_false' );
        $classic = do_shortcode( '[wpuf_form id="' . $form_id . '"]' );
        remove_filter( 'wpuf_frontend_react_render', '__return_false' );

        $this->assertStringNotContainsString( 'data-wpuf-react', $classic );
        $this->assertStringContainsString( 'name="form_id" value="' . $form_id . '"', $classic );
        $this->assertTrue( wp_script_is( 'wpuf-frontend-form', 'enqueued' ), 'a form sent back to classic gets the classic bundle' );
    }

    public function test_block_render_keeps_the_classic_form() {
        $this->enable();
        $this->build( 'forms', 'account' );
        $form_id = wpuf_create_sample_form( 'Block Form', 'wpuf_forms' );

        $html = Renderer_Switch::with_source(
            'block',
            function () use ( $form_id ) {
                return do_shortcode( '[wpuf_form id="' . $form_id . '"]' );
            }
        );

        $this->assertStringNotContainsString( 'data-wpuf-react', $html );
        $this->assertStringContainsString( 'name="form_id" value="' . $form_id . '"', $html );
    }
}
