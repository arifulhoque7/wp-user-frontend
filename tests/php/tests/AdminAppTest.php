<?php
/**
 * Single React admin app (task 5d): app page, routes, redirects, menu links,
 * notice isolation.
 *
 * @package WP_User_Frontend
 */

use WeDevs\Wpuf\Admin\App\AppPage;
use WeDevs\Wpuf\Admin\Screens\Registry;
use WeDevs\Wpuf\Admin\Screens\Screen;

/**
 * Admin app tests.
 */
class AdminAppTest extends WP_UnitTestCase {

    public function set_up() {
        parent::set_up();
        wp_set_current_user( self::factory()->user->create( [ 'role' => 'administrator' ] ) );
    }

    public function tear_down() {
        remove_all_filters( 'wpuf_admin_app_enabled' );
        remove_all_filters( 'wpuf_admin_app_routes' );
        parent::tear_down();
    }

    private function app() {
        return wpuf()->platform()->get( AppPage::class );
    }

    public function test_flag_is_off_by_default_and_filterable() {
        $this->assertFalse( wpuf_admin_app_enabled() );

        add_filter( 'wpuf_admin_app_enabled', '__return_true' );
        $this->assertTrue( wpuf_admin_app_enabled() );
    }

    public function test_app_url_points_at_the_top_level_page_with_a_hash_route() {
        $this->assertSame( admin_url( 'admin.php?page=wp-user-frontend' ) . '#/post-forms/12/edit', wpuf_admin_app_url( 'post-forms/12/edit' ) );
        $this->assertSame( admin_url( 'admin.php?page=wp-user-frontend' ) . '#/settings?tab=general', wpuf_admin_app_url( '/settings', [ 'tab' => 'general' ] ) );
    }

    public function test_redirect_url_carries_the_route_in_the_query() {
        $url = Registry::app_redirect_url( '/settings?tab=payments' );

        $this->assertStringStartsWith( admin_url( 'admin.php?page=wp-user-frontend' ), $url );
        $this->assertStringContainsString( 'wpuf_route=' . rawurlencode( '/settings?tab=payments' ), $url );
        $this->assertStringNotContainsString( '#', $url );
    }

    public function test_routes_list_every_react_screen_in_page_mode_until_moved() {
        $routes = wp_list_pluck( $this->app()->routes(), 'mode', 'id' );

        foreach ( [ 'post-forms', 'post-form-new', 'post-form-edit', 'post-forms-ai', 'subscriptions', 'settings' ] as $id ) {
            $this->assertArrayHasKey( $id, $routes, $id );
        }

        foreach ( $this->app()->routes() as $route ) {
            $this->assertSame( ! empty( $route['in_app'] ) ? 'app' : 'page', $route['mode'] );
            $this->assertStringStartsWith( admin_url(), $route['page'] );
            $this->assertNotEmpty( $route['app'] );
        }
    }

    public function test_old_page_requests_stay_pages_while_their_route_is_not_in_the_app() {
        $settings = wpuf()->platform()->get( Registry::class )->get( 'wpuf-settings' );

        $this->assertInstanceOf( Screen::class, $settings );
        $this->assertSame( '', $settings->app_route_for_request() );
    }

    public function test_menu_rows_point_at_app_routes_only_when_in_app() {
        global $submenu;

        $submenu['wp-user-frontend'] = [ [ 'Settings', 'manage_options', 'wpuf-settings' ], [ 'Tools', 'manage_options', 'wpuf_tools' ] ]; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

        $this->app()->point_menu_rows_at_app();
        $this->assertSame( 'wpuf-settings', $submenu['wp-user-frontend'][0][2], 'page mode keeps the row' );

        add_filter(
            'wpuf_admin_app_routes',
            function ( $routes ) {
                foreach ( $routes as $i => $route ) {
                    if ( 'settings' === $route['id'] ) {
                        $routes[ $i ]['mode'] = 'app';
                    }
                }

                return $routes;
            }
        );

        $this->app()->point_menu_rows_at_app();
        $this->assertSame( 'admin.php?page=wp-user-frontend#/settings', $submenu['wp-user-frontend'][0][2] );
        $this->assertSame( 'wpuf_tools', $submenu['wp-user-frontend'][1][2] );
    }

    public function test_a_screen_load_cannot_remove_notices_for_the_other_routes() {
        $notice = function () {};
        add_action( 'admin_notices', $notice );

        $screen = new class() extends Screen {
            public function slug() {
                return 'test-app-screen';
            }

            public function render() {}

            public function load() {
                wpuf_remove_admin_notices();
                add_action( 'in_admin_header', 'wpuf_remove_admin_notices' );
            }

            public function app_routes() {
                return [ [ 'id' => 'test', 'path' => '/test', 'app' => 'test', 'in_app' => true ] ];
            }
        };
        wpuf()->platform()->get( Registry::class )->add( $screen );

        $this->app()->load();

        $this->assertNotFalse( has_action( 'admin_notices', $notice ), 'removed notice callback is back' );
        $this->assertFalse( has_action( 'in_admin_header', 'wpuf_remove_admin_notices' ), 'page-only header callback dropped' );
        $this->assertTrue( wp_script_is( AppPage::HANDLE, 'enqueued' ) );
        $this->assertStringContainsString( 'wpuf-admin-app', $this->app()->body_class( '' ) );
    }
}
