<?php

namespace WeDevs\Wpuf\Admin;

use WP_Error;
use WP_Http;
use WP_Query;

/**
 * Manage Import Export
 *
 * @since 2.2
 */
class Admin_Tools {

    public function __construct() {
        add_action( 'wpuf_load_tools', [ $this, 'handle_tools_action' ] );
        add_action( 'wpuf_load_tools', [ $this, 'add_logout_to_menu' ] );
        add_filter( 'upload_mimes', [ $this, 'add_json_mime_type' ] );
        add_filter( 'wp_handle_upload_prefilter', [ $this, 'enable_json_upload' ] );
    }

    /**
     * Import json file into database
     *
     * @param array $file
     *
     * @return bool
     */
    public static function import_json_file( $file ) {
        $encode_data = file_get_contents( $file );
        $options     = json_decode( $encode_data, true );

        $errors = new WP_Error();

        $allowed_post_types    = [ 'wpuf_forms', 'wpuf_profile' ];
        $allowed_post_statuses = [ 'publish', 'draft', 'pending' ];

        foreach ( $options as $key => $value ) {
            // Allowlist post_type and post_status to prevent mass-assignment of an
            // arbitrary post type/status through an imported JSON file.
            $post_type   = $value['post_data']['post_type'] ?? '';
            $post_status = $value['post_data']['post_status'] ?? '';

            if ( ! in_array( $post_type, $allowed_post_types, true ) ) {
                $post_type = 'wpuf_forms';
            }

            if ( ! in_array( $post_status, $allowed_post_statuses, true ) ) {
                $post_status = 'publish';
            }

            $generate_post = [
                'post_title'     => $value['post_data']['post_title'] ?? '',
                'post_status'    => $post_status,
                'post_type'      => $post_type,
                'ping_status'    => $value['post_data']['ping_status'] ?? '',
                'comment_status' => $value['post_data']['comment_status'] ?? '',
            ];

            $post_id = wp_insert_post( $generate_post, true );

            if ( is_wp_error( $post_id ) ) {
                $errors->add( $post_id->get_error_code(), $post_id->get_error_message() );
            } else {
                foreach ( $value['meta_data']['fields'] as $order => $field ) {
                    wpuf_insert_form_field( $post_id, $field, false, $order );
                }

                update_post_meta( $post_id, 'wpuf_form_settings', $value['meta_data']['settings'] );
                update_post_meta( $post_id, 'notifications', $value['meta_data']['notifications'] );
            }
        }

        if ( $errors->has_errors() ) {
            return $errors;
        }

        return true;
    }

    /**
     * Get all available shortcodes organized by category
     *
     * @since 4.2.9
     *
     * @return array
     */
    public function get_all_shortcodes() {
        $shortcodes = [
            'account' => [
                'title'       => __( 'Account & Profile', 'wp-user-frontend' ),
                'description' => __( 'Shortcodes for user account management, login, and registration.', 'wp-user-frontend' ),
                'shortcodes'  => [
                    [
                        'code'        => '[wpuf_account]',
                        'description' => __( 'Displays the user account page with profile, posts, and subscription info.', 'wp-user-frontend' ),
                        'example'     => '',
                    ],
                    [
                        'code'        => '[wpuf_dashboard]',
                        'description' => __( 'Shows the frontend dashboard where users can view and manage their posts.', 'wp-user-frontend' ),
                        'example'     => '[wpuf_dashboard post_type="post"]',
                    ],
                    [
                        'code'        => '[wpuf_editprofile]',
                        'description' => __( 'Displays the profile edit form for logged-in users.', 'wp-user-frontend' ),
                        'example'     => '',
                    ],
                    [
                        'code'        => '[wpuf-login]',
                        'description' => __( 'Displays a login form for users.', 'wp-user-frontend' ),
                        'example'     => '[wpuf-login redirect="https://example.com"]',
                    ],
                    [
                        'code'        => '[wpuf-registration]',
                        'description' => __( 'Displays a registration form. Use id attribute to specify a form.', 'wp-user-frontend' ),
                        'example'     => '[wpuf-registration id="123"]',
                    ],
                    [
                        'code'        => '[wpuf_profile]',
                        'description' => __( 'Displays a profile form for users to update their profile. (Pro)', 'wp-user-frontend' ),
                        'example'     => '[wpuf_profile id="123"]',
                        'pro'         => true,
                    ],
                ],
            ],
            'forms' => [
                'title'       => __( 'Post Forms', 'wp-user-frontend' ),
                'description' => __( 'Shortcodes for displaying and editing post submission forms.', 'wp-user-frontend' ),
                'shortcodes'  => [
                    [
                        'code'        => '[wpuf_form]',
                        'description' => __( 'Displays a post submission form. Use id attribute to specify which form.', 'wp-user-frontend' ),
                        'example'     => '[wpuf_form id="123"]',
                    ],
                    [
                        'code'        => '[wpuf_edit]',
                        'description' => __( 'Allows users to edit their submitted posts.', 'wp-user-frontend' ),
                        'example'     => '',
                    ],
                ],
            ],
            'subscription' => [
                'title'       => __( 'Subscription & Payments', 'wp-user-frontend' ),
                'description' => __( 'Shortcodes for subscription packs and user subscription information.', 'wp-user-frontend' ),
                'shortcodes'  => [
                    [
                        'code'        => '[wpuf_sub_pack]',
                        'description' => __( 'Displays all available subscription packs/pricing plans.', 'wp-user-frontend' ),
                        'example'     => '[wpuf_sub_pack]',
                    ],
                    [
                        'code'        => '[wpuf_sub_info]',
                        'description' => __( 'Shows the current user\'s subscription information and status.', 'wp-user-frontend' ),
                        'example'     => '',
                    ],
                ],
            ],
            'user_directory' => [
                'title'       => __( 'User Directory', 'wp-user-frontend' ),
                'description' => __( 'Shortcodes for displaying and managing user directories.', 'wp-user-frontend' ),
                'shortcodes'  => [
                    [
                        'code'        => '[wpuf-edit-users]',
                        'description' => __( 'Displays a list of users that can be edited (admin only).', 'wp-user-frontend' ),
                        'example'     => '',
                    ],
                    [
                        'code'        => '[wpuf_user_listing]',
                        'description' => __( 'Displays a user directory listing with search and filters. (Pro)', 'wp-user-frontend' ),
                        'example'     => '[wpuf_user_listing id="123"]',
                        'pro'         => true,
                    ],
                    [
                        'code'        => '[wpuf_user_listing_id]',
                        'description' => __( 'Displays a single user profile from the directory. (Pro)', 'wp-user-frontend' ),
                        'example'     => '[wpuf_user_listing_id id="123"]',
                        'pro'         => true,
                    ],
                ],
            ],
            'content_restriction' => [
                'title'       => __( 'Content Restriction (Pro)', 'wp-user-frontend' ),
                'description' => __( 'Shortcodes for restricting content based on subscriptions or user roles.', 'wp-user-frontend' ),
                'shortcodes'  => [
                    [
                        'code'        => '[wpuf_restrict]',
                        'description' => __( 'Restricts content inside the shortcode to specific subscription packs.', 'wp-user-frontend' ),
                        'example'     => '[wpuf_restrict pack="1,2"]Content here[/wpuf_restrict]',
                        'pro'         => true,
                    ],
                    [
                        'code'        => '[wpuf_partial_restriction]',
                        'description' => __( 'Shows partial content with a message to subscribe for full access.', 'wp-user-frontend' ),
                        'example'     => '[wpuf_partial_restriction]',
                        'pro'         => true,
                    ],
                ],
            ],
            'utility' => [
                'title'       => __( 'Utility Shortcodes', 'wp-user-frontend' ),
                'description' => __( 'Helper shortcodes for displaying meta fields and other utilities.', 'wp-user-frontend' ),
                'shortcodes'  => [
                    [
                        'code'        => '[wpuf-meta]',
                        'description' => __( 'Displays a custom field/meta value. Use name attribute to specify the meta key.', 'wp-user-frontend' ),
                        'example'     => '[wpuf-meta name="my_custom_field"]',
                    ],
                    [
                        'code'        => '[wpuf_qr]',
                        'description' => __( 'Displays a QR code for a field value. (Pro)', 'wp-user-frontend' ),
                        'example'     => '[wpuf_qr]',
                        'pro'         => true,
                    ],
                ],
            ],
        ];

        /**
         * Filter the shortcodes list for the tools page
         *
         * @since 4.2.9
         *
         * @param array $shortcodes The shortcodes array organized by category
         */
        return apply_filters( 'wpuf_tools_shortcodes_list', $shortcodes );
    }

    /**
     * Handle tools page action
     *
     * @return void
     */
    public function handle_tools_action() {
        if ( ! isset( $_GET['wpuf_action'] ) ) {
            return;
        }
        check_admin_referer( 'wpuf-tools-action' );
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        global $wpdb;
        $action  = isset( $_GET['wpuf_action'] ) ? sanitize_text_field( wp_unslash( $_GET['wpuf_action'] ) ) : '';
        $message = 'del_forms';
        switch ( $action ) {
            case 'clear_settings':
                delete_option( 'wpuf_general' );
                delete_option( 'wpuf_dashboard' );
                delete_option( 'wpuf_profile' );
                delete_option( 'wpuf_payment' );
                delete_option( '_wpuf_page_created' );
                $message = 'settings_cleared';
                break;
            case 'del_post_forms':
                $this->delete_post_type( 'wpuf_forms' );
                break;
            case 'del_pro_forms':
                $this->delete_post_type( 'wpuf_profile' );
                break;
            case 'del_subs':
                $this->delete_post_type( 'wpuf_subscription' );
                break;
            case 'del_coupon':
                $this->delete_post_type( 'wpuf_coupon' );
                break;
            case 'clear_transaction':
                $wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}wpuf_transaction" );
                $message = 'del_trans';
                break;
            default:
                // code...
                break;
        }
        wp_safe_redirect( add_query_arg( [ 'msg' => $message ], admin_url( 'admin.php?page=wpuf_tools&action=tools' ) ) );
        exit;
    }

    /**
     * Enable json file upload via ajax in tools page
     *
     * @since 3.2.0
     *
     * @param array $file
     *
     * @return array
     */
    public function enable_json_upload( $file ) {
        if ( defined( 'DOING_AJAX' ) && DOING_AJAX && isset( $_POST['action'] ) && 'upload-attachment' === $_POST['action'] && isset( $_POST['type'] ) && 'wpuf-form-uploader' === $_POST['type'] ) {
            // @see wp_ajax_upload_attachment
            check_ajax_referer( 'media-form' );

            // Security: Only allow admins to upload JSON files
            if ( ! current_user_can( 'manage_options' ) ) {
                $file['error'] = __( 'You do not have permission to upload files here.', 'wp-user-frontend' );
                return $file;
            }

            add_filter( 'wp_check_filetype_and_ext', [ $this, 'check_filetype_and_ext' ], 10, 5 );
        }

        return $file;
    }

    /**
     * Ajax handler to import WPUF form
     *
     * @since 3.2.0
     *
     * @return void
     */
    public function import_forms() {
        check_ajax_referer( 'wpuf_admin_tools' );

        // Security: Check user has proper admin capabilities
        if ( ! current_user_can( wpuf_admin_role() ) ) {
            wp_send_json_error(
                new WP_Error(
                    'wpuf_ajax_import_forms_error',
                    __( 'Unauthorized operation', 'wp-user-frontend' )
                ),
                WP_Http::FORBIDDEN
            );
        }

        if ( ! isset( $_POST['file_id'] ) ) {
            wp_send_json_error(
                new WP_Error(
                    'wpuf_ajax_import_forms_error',
                    __( 'Missing file_id param', 'wp-user-frontend' )
                ),
                WP_Http::BAD_REQUEST
            );
        }
        $file_id = absint( wp_unslash( $_POST['file_id'] ) );
        $file    = get_attached_file( $file_id );
        if ( empty( $file ) ) {
            wp_send_json_error(
                new WP_Error(
                    'wpuf_ajax_import_forms_error',
                    __( 'JSON file not found', 'wp-user-frontend' )
                ),
                WP_Http::NOT_FOUND
            );
        }
        $filetype = wp_check_filetype( $file, [ 'json' => 'application/json' ] );
        if ( ! isset( $filetype['type'] ) || 'application/json' !== $filetype['type'] ) {
            wp_send_json_error(
                new WP_Error(
                    'wpuf_ajax_import_forms_error',
                    __( 'Provided file is not a JSON file.', 'wp-user-frontend' )
                ),
                WP_Http::UNSUPPORTED_MEDIA_TYPE
            );
        }

        $imported = self::import_json_file( $file );
        if ( is_wp_error( $imported ) ) {
            wp_send_json_error( $imported, WP_Http::UNPROCESSABLE_ENTITY );
        }
        wp_send_json_success(
            [
                'message' => __( 'Forms imported successfully.', 'wp-user-frontend' ),
            ]
        );
    }

    /**
     * Add json file mime type to upload in WP Media
     *
     * @since 3.2.0
     *
     * @param array $mime_types
     *
     * @return array
     */
    public function add_json_mime_type( $mime_types ) {
        $mime_types['json'] = 'application/json';

        return $mime_types;
    }

    /**
     * Allow json file to upload with async uploader
     *
     * @since 3.2.0
     * @since 4.2.9 Added security validation to prevent arbitrary file uploads
     *
     * @param array  $info            File data array with 'ext', 'type', and 'proper_filename' keys
     * @param string $file            Full path to the file
     * @param string $filename        The name of the file (may differ from $file due to $file being in a tmp directory)
     * @param array  $mimes           Array of mime types keyed by their file extension regex
     * @param string $real_mime       The actual mime type or false if the type cannot be determined
     *
     * @return array
     */
    public function check_filetype_and_ext( $info, $file, $filename, $mimes, $real_mime ) {
        // Security: Validate this is actually a JSON file

        // 1. Check the file extension is .json
        $filetype = wp_check_filetype( $filename, [ 'json' => 'application/json' ] );

        if ( 'json' !== $filetype['ext'] ) {
            // Not a .json file - reject it
            return $info;
        }

        // 2. Verify the file exists and is readable
        if ( ! file_exists( $file ) || ! is_readable( $file ) ) {
            return $info;
        }

        // 3. Check for dangerous file extensions that might be disguised
        $dangerous_extensions = [ 'php', 'php3', 'php4', 'php5', 'php7', 'phtml', 'phar', 'exe', 'sh', 'bat', 'cmd' ];
        $file_parts = pathinfo( $filename );

        // Check for double extensions (e.g., shell.php.json)
        $filename_lower = strtolower( $filename );
        foreach ( $dangerous_extensions as $ext ) {
            if ( strpos( $filename_lower, '.' . $ext ) !== false ) {
                // Dangerous extension found - reject
                return $info;
            }
        }

        // 4. Validate the file content is actually valid JSON
        $file_content = file_get_contents( $file );

        if ( false === $file_content ) {
            return $info;
        }

        // Try to decode the JSON
        json_decode( $file_content );

        if ( json_last_error() !== JSON_ERROR_NONE ) {
            // Not valid JSON - reject it
            return $info;
        }

        // 5. Additional security: Check file doesn't contain PHP tags
        if ( preg_match( '/<\?php|<\?=|<script[^>]*>.*?<\/script>/i', $file_content ) ) {
            // Contains PHP or script tags - reject it
            return $info;
        }

        // All validations passed - it's a legitimate JSON file
        $info['ext']  = 'json';
        $info['type'] = 'application/json';

        return $info;
    }

    /**
     * Delete all posts by a post type
     *
     * @param string $post_type
     *
     * @return void
     */
    public function delete_post_type( $post_type ) {
        $query = new WP_Query(
            [
                'post_type'      => $post_type,
                'posts_per_page' => -1,
                'post_status'    => [ 'publish', 'draft', 'pending', 'trash' ],
            ]
        );
        $posts = $query->get_posts();
        if ( $posts ) {
            foreach ( $posts as $item ) {
                wp_delete_post( $item->ID, true );
            }
        }
        wp_reset_postdata();
    }

    /**
     * Add logout link to navigation menu
     *
     * @since 4.2.10
     *
     * @return void
     */
    public function add_logout_to_menu() {
        if ( ! isset( $_POST['wpuf_add_logout_nonce'] ) ) {
            return;
        }

        check_admin_referer( 'wpuf-add-logout-to-menu', 'wpuf_add_logout_nonce' );

        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $menu_id    = isset( $_POST['wpuf_menu_id'] ) ? intval( $_POST['wpuf_menu_id'] ) : 0;
        $menu_label = isset( $_POST['wpuf_logout_label'] ) ? sanitize_text_field( wp_unslash( $_POST['wpuf_logout_label'] ) ) : __( 'Logout', 'wp-user-frontend' );

        if ( ! $menu_id ) {
            wp_safe_redirect( add_query_arg( [ 'msg' => 'no_menu_selected' ], admin_url( 'admin.php?page=wpuf_tools&tab=tools' ) ) );
            exit;
        }

        $result = wpuf_add_logout_to_menu( $menu_id, $menu_label );

        if ( is_wp_error( $result ) ) {
            wp_safe_redirect( add_query_arg( [ 'msg' => 'logout_menu_error' ], admin_url( 'admin.php?page=wpuf_tools&tab=tools' ) ) );
            exit;
        }

        wp_safe_redirect( add_query_arg( [ 'msg' => 'logout_menu_added' ], admin_url( 'admin.php?page=wpuf_tools&tab=tools' ) ) );
        exit;
    }

    /**
     * Check if current theme is a block theme (FSE)
     *
     * @since 4.2.10
     *
     * @return bool
     */
    public function is_block_theme() {
        return function_exists( 'wp_is_block_theme' ) && wp_is_block_theme();
    }
}
