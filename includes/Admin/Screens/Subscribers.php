<?php
/**
 * Subscribers screen
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\Screens;

/**
 * Subscription > Subscribers (the subscribers of a pack). Load and render moved from Admin\Menu, whose callbacks forward here.
 *
 * @since WPUF_SINCE
 */
class Subscribers extends Screen {

    /**
     * Menu slug
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function slug() {
        return 'wpuf_subscribers';
    }

    /**
     * Render the screen (moved from Admin\Menu).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function render() {
        $page = WPUF_INCLUDES . '/Admin/views/subscribers.php';

        wpuf_require_once( $page );
    }
}
