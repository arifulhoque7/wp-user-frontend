<?php
/**
 * Subscriptions screen
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\Screens;

/**
 * User Frontend > Subscriptions (React). Notices stay removed there
 * (Admin_Subscription::remove_notices()).
 *
 * @since WPUF_SINCE
 */
class Subscriptions extends Screen {

    /**
     * Menu slug
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function slug() {
        return 'wpuf_subscription';
    }

    /**
     * Load step: the `wpuf_load_subscription_page` hook (assets, notices, footer).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function load() {
        /**
         * Backdoor for calling the menu hook.
         * This hook won't get translated even the site language is changed
         */
        do_action( 'wpuf_load_subscription_page' );
    }

    /**
     * Print the screen.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function render() {
        wpuf_require_once( WPUF_INCLUDES . '/Admin/views/subscriptions.php' );
    }
}
