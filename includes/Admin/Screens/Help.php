<?php
/**
 * Help screen
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\Screens;

/**
 * User Frontend > Help. Load and render moved from Admin\Menu, whose callbacks forward here.
 *
 * @since WPUF_SINCE
 */
class Help extends Screen {

    /**
     * Menu slug
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function slug() {
        return 'wpuf-support';
    }

    /**
     * Load the screen (moved from Admin\Menu).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function load() {
        wp_enqueue_script( 'wpuf-admin' );
        wp_enqueue_style( 'wpuf-admin' );
    }

    /**
     * Render the screen (moved from Admin\Menu).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function render() {
        require_once WPUF_INCLUDES . '/Admin/views/support.php';
    }
}
