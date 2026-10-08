<?php
/**
 * Tools service
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Tools;

use WeDevs\Wpuf\Admin\Admin_Installer;
use WeDevs\Wpuf\Admin\Admin_Tools;
use WP_Error;
use WP_Query;

/**
 * What User Frontend > Tools does, for the admin app's `#/tools` route
 * (Platform\REST\Controllers\ToolsController). The same writes as the
 * classic page's handlers (Admin_Tools, Admin_Installer), which stay as
 * they are for the classic page and old links.
 *
 * @since WPUF_SINCE
 */
class ToolsService {

    /**
     * Post types the "Delete Forms" tools empty.
     */
    const DELETABLE = [ 'wpuf_forms', 'wpuf_profile', 'wpuf_subscription', 'wpuf_coupon' ];

    /**
     * Form post types that export and import.
     */
    const FORM_TYPES = [ 'wpuf_forms', 'wpuf_profile' ];

    /**
     * The largest import file read (bytes).
     */
    const MAX_IMPORT_BYTES = 10485760;

    /**
     * Install the plugin's pages (Tools > Page Installation).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function install_pages() {
        // init_pages() does not redirect inside a REST request.
        ( new Admin_Installer() )->init_pages();
    }

    /**
     * Delete the plugin settings (Tools > Reset Settings).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function reset_settings() {
        foreach ( [ 'wpuf_general', 'wpuf_dashboard', 'wpuf_profile', 'wpuf_payment', '_wpuf_page_created' ] as $option ) {
            delete_option( $option );
        }
    }

    /**
     * Force-delete every post of a type (Tools > Delete Forms).
     *
     * @since WPUF_SINCE
     *
     * @param string $post_type One of self::DELETABLE
     *
     * @return int|WP_Error Posts deleted
     */
    public function delete_post_type( $post_type ) {
        if ( ! in_array( $post_type, self::DELETABLE, true ) ) {
            return new WP_Error( 'wpuf_tools_invalid_type', __( 'This content cannot be deleted from Tools.', 'wp-user-frontend' ), [ 'status' => 400 ] );
        }

        $ids = get_posts(
            [
                'post_type'      => $post_type,
                'posts_per_page' => -1,
                'post_status'    => [ 'publish', 'draft', 'pending', 'trash' ],
                'fields'         => 'ids',
            ]
        );

        foreach ( $ids as $id ) {
            wp_delete_post( $id, true );
        }

        return count( $ids );
    }

    /**
     * Empty the transactions table (Tools > Transactions).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function clear_transactions() {
        global $wpdb;

        $wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}wpuf_transaction" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
    }

    /**
     * The site's navigation menus.
     *
     * @since WPUF_SINCE
     *
     * @return array[] id, name
     */
    public function menus() {
        $menus = [];

        foreach ( (array) wp_get_nav_menus() as $menu ) {
            $menus[] = [
                'id'   => (int) $menu->term_id,
                'name' => $menu->name,
            ];
        }

        return $menus;
    }

    /**
     * Add a logout link to a menu (Tools > Add Logout to Menu).
     *
     * @since WPUF_SINCE
     *
     * @param int    $menu_id Menu term id
     * @param string $label   Link label
     *
     * @return int|WP_Error Menu item id
     */
    public function add_logout_to_menu( $menu_id, $label ) {
        $menu_id = absint( $menu_id );

        if ( ! $menu_id || ! wp_get_nav_menu_object( $menu_id ) ) {
            return new WP_Error( 'wpuf_tools_no_menu', __( 'Please select a menu.', 'wp-user-frontend' ), [ 'status' => 400 ] );
        }

        $result = wpuf_add_logout_to_menu( $menu_id, $label ? $label : __( 'Logout', 'wp-user-frontend' ) );

        if ( is_wp_error( $result ) ) {
            return new WP_Error( 'wpuf_tools_logout_failed', $result->get_error_message(), [ 'status' => 400 ] );
        }

        return (int) $result;
    }

    /**
     * The Tools onboarding box: label, URL (decoded for navigation) and the
     * re-run warning, as Admin\Onboarding::get_entry_point() gives them now.
     *
     * @since WPUF_SINCE
     *
     * @return array url, label, warning
     */
    public function onboarding_entry() {
        $admin  = function_exists( 'wpuf' ) ? wpuf()->admin : null;
        $wizard = is_object( $admin ) && $admin->onboarding instanceof \WeDevs\Wpuf\Admin\Onboarding ? $admin->onboarding : new \WeDevs\Wpuf\Admin\Onboarding( false );
        $entry  = $wizard->get_entry_point();

        $entry['url'] = html_entity_decode( $entry['url'], ENT_QUOTES, 'UTF-8' );

        return $entry;
    }

    /**
     * Published forms of a type, for the export picker.
     *
     * @since WPUF_SINCE
     *
     * @param string $post_type wpuf_forms or wpuf_profile
     *
     * @return array[] id, title
     */
    public function forms( $post_type ) {
        $forms = [];

        foreach ( get_posts(
            [
				'post_type' => $post_type,
				'post_status' => 'publish',
				'posts_per_page' => -1,
				'orderby' => 'title',
				'order' => 'ASC',
			]
        ) as $form ) {
            $forms[] = [
                'id'    => (int) $form->ID,
                'title' => $form->post_title ? $form->post_title : __( '(no title)', 'wp-user-frontend' ),
            ];
        }

        return $forms;
    }

    /**
     * The export file of forms (Tools > Export): the same JSON shape the
     * classic page downloads, for every published form of the type (the
     * classic page stopped at WordPress's default 10) or the picked ones.
     *
     * @since WPUF_SINCE
     *
     * @param string $post_type wpuf_forms or wpuf_profile
     * @param int[]  $ids       Picked forms (empty: all)
     *
     * @return array|WP_Error filename, forms
     */
    public function export( $post_type, $ids = [] ) {
        if ( ! in_array( $post_type, self::FORM_TYPES, true ) ) {
            return new WP_Error( 'wpuf_tools_invalid_type', __( 'Unknown form type.', 'wp-user-frontend' ), [ 'status' => 400 ] );
        }

        $ids   = array_filter( array_map( 'absint', (array) $ids ) );
        $query = new WP_Query(
            [
                'post_status'    => 'publish',
                'post_type'      => $post_type,
                'post__in'       => $ids,
                'posts_per_page' => -1,
                'no_found_rows'  => true,
            ]
        );
        $forms = [];

        foreach ( $query->posts as $post ) {
            $data = get_object_vars( $post );
            unset( $data['ID'] );

            $forms[] = [
                'post_data' => $data,
                'meta_data' => [
                    'fields'        => wpuf_get_form_fields( $post->ID ),
                    'settings'      => wpuf_get_form_settings( $post->ID ),
                    'notifications' => wpuf_get_form_notifications( $post->ID ),
                ],
            ];
        }

        return [
            'filename' => strtolower( str_replace( ' ', '-', get_option( 'blogname' ) ) ) . '-wpuf-' . $post_type . '-' . gmdate( 'Y-m-d' ) . '.json',
            'forms'    => $forms,
        ];
    }

    /**
     * Import forms from an uploaded JSON file (Tools > Import), with the
     * checks the classic upload makes (Admin_Tools::check_filetype_and_ext).
     * The file is read in place and never added to the Media Library.
     *
     * @since WPUF_SINCE
     *
     * @param array $file An entry of $_FILES (name, tmp_name, size, error)
     *
     * @return true|WP_Error
     */
    public function import( $file ) {
        $invalid = new WP_Error( 'wpuf_tools_invalid_file', __( 'Please upload a valid JSON export file.', 'wp-user-frontend' ), [ 'status' => 415 ] );

        if ( empty( $file['tmp_name'] ) || ! empty( $file['error'] ) || ! is_uploaded_file( $file['tmp_name'] ) ) {
            return new WP_Error( 'wpuf_tools_no_file', __( 'Please choose a JSON file.', 'wp-user-frontend' ), [ 'status' => 400 ] );
        }

        $name = strtolower( (string) $file['name'] );

        if ( 'json' !== pathinfo( $name, PATHINFO_EXTENSION ) || preg_match( '/\.(php\d?|phtml|phar|exe|sh|bat|cmd)(\.|$)/', $name ) ) {
            return $invalid;
        }

        if ( (int) $file['size'] > self::MAX_IMPORT_BYTES ) {
            return new WP_Error( 'wpuf_tools_file_too_big', __( 'The file is too large.', 'wp-user-frontend' ), [ 'status' => 413 ] );
        }

        $content = file_get_contents( $file['tmp_name'] ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
        $forms   = false === $content ? null : json_decode( $content, true );

        if ( ! is_array( $forms ) || preg_match( '/<\?php|<\?=|<script[^>]*>.*?<\/script>/is', (string) $content ) ) {
            return $invalid;
        }

        foreach ( $forms as $form ) {
            if ( ! is_array( $form ) || ! isset( $form['post_data'], $form['meta_data']['fields'] ) || ! is_array( $form['meta_data']['fields'] ) ) {
                return $invalid;
            }
        }

        $result = Admin_Tools::import_json_file( $file['tmp_name'] );

        if ( is_wp_error( $result ) ) {
            return new WP_Error( 'wpuf_tools_import_failed', $result->get_error_message(), [ 'status' => 422 ] );
        }

        return true;
    }

    /**
     * The shortcode reference (Tools > Shortcodes), `wpuf_tools_shortcodes_list` applied.
     *
     * @since WPUF_SINCE
     *
     * @return array
     */
    public function shortcodes() {
        $admin = function_exists( 'wpuf' ) ? wpuf()->admin : null;

        // REST requests do not load Admin; skip the constructor so the classic
        // page's upload filters are not added here.
        $tools = is_object( $admin ) && $admin->tools instanceof Admin_Tools
            ? $admin->tools
            : ( new \ReflectionClass( Admin_Tools::class ) )->newInstanceWithoutConstructor();

        return array_values( $tools->get_all_shortcodes() );
    }
}
