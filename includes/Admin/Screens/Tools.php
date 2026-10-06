<?php
/**
 * Tools screen
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\Screens;

use WeDevs\Wpuf\Admin\Admin_Tools;

/**
 * User Frontend > Tools (form import / export; stays on Vue, owner decision 23). Load and render moved from Admin\Menu, whose callbacks forward here.
 *
 * @since WPUF_SINCE
 */
class Tools extends Screen {

    /**
     * Menu slug
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function slug() {
        return 'wpuf_tools';
    }

    /**
     * Load the screen (moved from Admin\Menu).
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
        do_action( 'wpuf_load_tools' );

        wp_enqueue_media(); // for uploading JSON

        wp_enqueue_script( 'wpuf-vue' );
        wp_enqueue_script( 'wpuf-admin-tools' );

        wp_localize_script(
            'wpuf-admin-tools',
            'wpuf_admin_tools',
            [
                'url'   => [
                    'ajax' => admin_url( 'admin-ajax.php' ),
                ],
                'nonce' => wp_create_nonce( 'wpuf_admin_tools' ),
                'i18n'  => [
                    'wpuf_import_forms'      => __( 'WPUF Import Forms', 'wp-user-frontend' ),
                    'add_json_file'          => __( 'Add JSON file', 'wp-user-frontend' ),
                    'could_not_import_forms' => __( 'Could not import forms.', 'wp-user-frontend' ),
                ],
            ]
        );
    }

    /**
     * Render the screen (moved from Admin\Menu).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function render() {
        wpuf()->admin->tools = new Admin_Tools();

        $tools_page = WPUF_INCLUDES . '/Admin/views/tools.php';

        wpuf_include_once( $tools_page );
    }
}
