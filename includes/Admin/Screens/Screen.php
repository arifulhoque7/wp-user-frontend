<?php
/**
 * Admin screen base
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\Screens;

/**
 * One WPUF admin screen on its existing menu slug (Dokan `Pageable` shape):
 * the menu keeps registering the page, the screen owns what happens on its
 * `load-*` hook and what it renders.
 *
 * @since WPUF_SINCE
 */
abstract class Screen {

    /**
     * Menu slug (`page=` query value).
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    abstract public function slug();

    /**
     * Print the screen.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    abstract public function render();

    /**
     * Runs on the screen's `load-*` hook, before output.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function load() {}

    /**
     * Capability needed to open the screen.
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function capability() {
        return wpuf_admin_role();
    }

    /**
     * Whether admin notices are captured and printed inside the screen's
     * notice wrapper (React screens that show notices).
     *
     * @since WPUF_SINCE
     *
     * @return bool
     */
    public function captures_notices() {
        return false;
    }

    /**
     * Whether this is the screen being viewed (by `$plugin_page`, which does
     * not change with the admin language, unlike the hook suffix).
     *
     * @since WPUF_SINCE
     *
     * @return bool
     */
    public function is_current() {
        global $plugin_page;

        return $plugin_page === $this->slug();
    }
}
