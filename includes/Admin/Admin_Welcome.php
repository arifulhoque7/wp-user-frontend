<?php

namespace WeDevs\Wpuf\Admin;

/**
 * The welcome class after install
 *
 * @since 2.6.0
 */
class Admin_Welcome {

    public function __construct() {
        add_action( 'admin_menu', [ $this, 'register_menu' ] );
        add_action( 'admin_head', [ $this, 'hide_menu' ] );
        // add_action( 'admin_init', array( $this, 'redirect_to_page' ), 9999 );
    }

    /**
     * Register the admin menu to setup the welcome message
     *
     * @return void
     */
    public function register_menu() {
        $hook = add_dashboard_page(
            __( 'Welcome to WP User Frontend', 'wp-user-frontend' ),
            __( 'Welcome to WP User Frontend', 'wp-user-frontend' ), 'manage_options', 'wpuf-welcome',
            [ $this, 'welcome_page' ]
        );

        // The page opens the admin app route #/welcome (Admin\Screens\Welcome).
        if ( $hook ) {
            add_action(
                'load-' . $hook,
                function () {
                    wpuf()->platform()->get( Screens\Registry::class )->load( Screens\Welcome::SLUG );
                }
            );
        }
    }

    /**
     * Hide the menu as we don't want to show the welcome page in admin menu
     *
     * @return void
     */
    public function hide_menu() {
        remove_submenu_page( 'index.php', 'wpuf-welcome' );
    }

    /**
     * Redirect to the welcome page once the plugin is installed
     *
     * @return void
     */
    public function redirect_to_page() {
        if ( ! get_transient( 'wpuf_activation_redirect' ) ) {
            return;
        }
        delete_transient( 'wpuf_activation_redirect' );
        // Only do this for single site installs.
        if ( is_network_admin() || isset( $_GET['activate-multi'] ) ) {
            return;
        }
        wp_safe_redirect( admin_url( 'index.php?page=wpuf-welcome' ) );
        exit;
    }

    /**
     * Render the welcome page: the admin app route #/welcome opens instead
     * (Admin\Screens\Welcome).
     *
     * @since WPUF_SINCE Renders nothing; was views/welcome-page.php
     *
     * @return void
     */
    public function welcome_page() {
        // Only reached with the admin app off (it opens #/welcome otherwise):
        // the welcome screen is an app route, so point to the forms list.
        if ( ! wpuf_admin_app_enabled() ) {
            printf(
                '<div class="wrap"><h1>%1$s</h1><p><a class="button button-primary" href="%2$s">%3$s</a></p></div>',
                esc_html__( 'Welcome to WP User Frontend', 'wp-user-frontend' ),
                esc_url( admin_url( 'admin.php?page=wpuf-post-forms' ) ),
                esc_html__( 'Create Your First Form', 'wp-user-frontend' )
            );
        }
    }
}
