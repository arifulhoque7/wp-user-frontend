<?php

namespace WeDevs\Wpuf\Ajax;

use WeDevs\Wpuf\Admin\Forms\Admin_Form_Builder;
use WeDevs\Wpuf\Builder\HookBridge;
use WeDevs\Wpuf\Platform\Stores\Normalizers;

/**
 * Ajax handlers
 */
class Admin_Form_Builder_Ajax {
    /**
     * Save form data
     *
     * @since 2.5
     *
     * @return void
     */
    public function save_form() {
        $post_data = wp_unslash( $_POST );
        if ( isset( $post_data['form_data'] ) ) {
            parse_str( $post_data['form_data'], $form_data );
        } else {
            wp_send_json_error( __( 'form data is missing', 'wp-user-frontend' ) );
        }

        if ( empty( $form_data['wpuf_form_builder_nonce'] ) || ! wp_verify_nonce( $form_data['wpuf_form_builder_nonce'], 'wpuf_form_builder_save_form' ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( ! current_user_can( wpuf_admin_role() ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( empty( $form_data['wpuf_form_id'] ) ) {
            wp_send_json_error( __( 'Invalid form id', 'wp-user-frontend' ) );
        }

        /**
         * Post types the form builder may save into.
         *
         * @since WPUF_SINCE
         *
         * @param string[] $post_types Builder form post types.
         */
        $allowed_post_types = (array) apply_filters( 'wpuf_form_builder_save_post_types', [ 'wpuf_forms', 'wpuf_profile' ] );

        if ( ! in_array( get_post_type( absint( $form_data['wpuf_form_id'] ) ), $allowed_post_types, true ) ) {
            wp_send_json_error( __( 'Invalid form id', 'wp-user-frontend' ) );
        }

        /**
         * Meta keys the form builder may store form settings under.
         *
         * @since WPUF_SINCE
         *
         * @param string[] $keys Settings meta keys.
         */
        $allowed_settings_keys = (array) apply_filters( 'wpuf_form_builder_settings_meta_keys', [ 'wpuf_form_settings' ] );
        $form_settings_key     = isset( $form_data['form_settings_key'] ) ? sanitize_key( $form_data['form_settings_key'] ) : '';

        if ( ! in_array( $form_settings_key, $allowed_settings_keys, true ) ) {
            wp_send_json_error( __( 'Invalid form settings', 'wp-user-frontend' ) );
        }

        $form_fields   = isset( $post_data['form_fields'] ) ? $post_data['form_fields'] : '';
        $notifications = isset( $post_data['notifications'] ) ? $post_data['notifications'] : '';
        $settings      = [];
        // Null = not sent: the builder has no integrations editor, so the stored ones stay.
        $integrations = null;

        if ( isset( $post_data['settings'] ) ) {
            // Develop posted these as a form: keep its CRLF line breaks.
            $settings = Normalizers::form_post_newlines( json_decode( $post_data['settings'], true ), get_post_meta( absint( $form_data['wpuf_form_id'] ), $form_settings_key, true ) );
        } else {
            $settings = isset( $form_data['wpuf_settings'] ) ? $form_data['wpuf_settings'] : [];
        }

        // Settings other plugins printed on the builder hooks (legacy slots): the
        // posted value wins for the keys those slots own, as develop's form post.
        if ( isset( $post_data['legacy_settings_keys'] ) ) {
            $legacy_data = [];

            if ( isset( $post_data['legacy_settings'] ) && is_string( $post_data['legacy_settings'] ) ) {
                parse_str( $post_data['legacy_settings'], $legacy_data );
            }

            $settings = HookBridge::merge_posted_settings(
                $settings,
                $legacy_data,
                json_decode( (string) $post_data['legacy_settings_keys'], true )
            );
        }

        if ( isset( $post_data['integrations'] ) ) {
            $integrations = Normalizers::form_post_newlines( json_decode( $post_data['integrations'], true ), get_post_meta( absint( $form_data['wpuf_form_id'] ), 'integrations', true ) );
        }

        $form_fields   = json_decode( $form_fields, true );
        $notifications = json_decode( $notifications, true );

        // Values develop's form post always stored (Pro): the registration new
        // user status, and the multi-step bar type (its select's first option).
        if ( class_exists( 'WP_User_Frontend_Pro' ) ) {
            if ( 'wpuf_profile' === get_post_type( absint( $form_data['wpuf_form_id'] ) ) ) {
                $settings = Normalizers::registration_user_status( $settings );
            }

            $settings = Normalizers::multistep_progressbar_type( $settings );
        }

        // Server-side validation for fallback PPP cost
        if ( $this->validate_fallback_ppp_cost_required( $settings ) ) {
            wp_send_json_error( __( 'Cost for each additional post after pack limit is reached is required when Pay-per-post billing when limit exceeds is enabled.', 'wp-user-frontend' ) );
        }

        $data = [
            'form_id'           => absint( $form_data['wpuf_form_id'] ),
            'post_title'        => sanitize_text_field( $form_data['post_title'] ),
            'form_fields'       => $form_fields,
            'form_settings'     => $settings,
            'form_settings_key' => $form_settings_key,
            'notifications'     => $notifications,
            'integrations'      => $integrations,
        ];

        $form_fields = Admin_Form_Builder::save_form( $data );

        wp_send_json_success(
            [
                'form_fields'   => $form_fields,
                'form_settings' => $settings,
			]
        );
    }

    public function wpuf_get_post_taxonomies_old() {
        $post_data = wp_unslash( $_POST );
        $post_type = isset( $post_data['post_type'] ) ? sanitize_key( $post_data['post_type'] ) : '';
        $nonce     = isset( $post_data['wpuf_form_builder_setting_nonce'] ) ? sanitize_text_field( $post_data['wpuf_form_builder_setting_nonce'] ) : '';

        if ( ! wp_verify_nonce( $nonce, 'form-builder-setting-nonce' ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( ! current_user_can( wpuf_admin_role() ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( isset( $post_type ) && empty( $post_data['post_type'] ) ) {
            wp_send_json_error( __( 'Invalid post type', 'wp-user-frontend' ) );
        }

        $post_taxonomies = get_object_taxonomies( $post_type, 'objects' );
        $cat = '';
        foreach ( $post_taxonomies as $tax ) {
            if ( $tax->hierarchical ) {
                $args = [
                    'hide_empty'   => false,
                    'hierarchical' => true,
                    'taxonomy'     => $tax->name,
                ];

                $cat .= '<tr class="wpuf_settings_taxonomy"> <th>' . __( 'Default ', 'wp-user-frontend' ) . $post_type . ' ' . $tax->name . '</th> <td>
                <select multiple name="wpuf_settings[default_' . $tax->name . '][]">';
                $categories = get_terms( $args );

                foreach ( $categories as $category ) {
                    $cat .= '<option value="' . $category->term_id . '">' . $category->name . '</option>';
                }

                $cat .= '</select></td>';
            }
        }

        wp_send_json_success(
            [
                'success' => 'true',
                'data'    => $cat,
			]
        );
    }

    public function get_post_taxonomies() {
        $post_data = wp_unslash( $_POST );
        $post_type = isset( $post_data['post_type'] ) ? sanitize_key( $post_data['post_type'] ) : '';
        $nonce     = isset( $post_data['wpuf_form_builder_setting_nonce'] ) ? sanitize_text_field( $post_data['wpuf_form_builder_setting_nonce'] ) : '';

        if ( ! wp_verify_nonce( $nonce, 'form-builder-setting-nonce' ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( ! current_user_can( wpuf_admin_role() ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( isset( $post_type ) && empty( $post_data['post_type'] ) ) {
            wp_send_json_error( __( 'Invalid post type', 'wp-user-frontend' ) );
        }

        $post_taxonomies = get_object_taxonomies( $post_type, 'objects' );
        $cat = '';

        // Get current form settings to preserve existing values
        $form_id = isset( $post_data['form_id'] ) ? absint( $post_data['form_id'] ) : 0;
        $current_settings = [];

        if ( $form_id ) {
            $current_settings = get_post_meta( $form_id, 'wpuf_form_settings', true );
            if ( ! is_array( $current_settings ) ) {
                $current_settings = [];
            }
        }

        foreach ( $post_taxonomies as $tax ) {
            if ( $tax->hierarchical ) {
                $args = [
                    'hide_empty'   => false,
                    'hierarchical' => true,
                    'taxonomy'     => $tax->name,
                ];

                $field_name = 'default_' . $tax->name;
                $select_id = 'default_' . $tax->name . '_select';

                // Get current value for this taxonomy
                $current_value = isset( $current_settings[ $field_name ] ) ? $current_settings[ $field_name ] : [];
                $data_value = is_array( $current_value ) ? implode( ',', $current_value ) : $current_value;

                $cat .= '<div class="wpuf-mt-6 wpuf-input-container taxonomy-container" data-taxonomy="' . esc_attr( $tax->name ) . '">';
                $cat .= '<div class="wpuf-flex wpuf-items-center">';
                $cat .= '<label for="' . esc_attr( $select_id ) . '" class="wpuf-text-sm wpuf-text-gray-700 wpuf-my-2">';
                /* translators: %s: taxonomy label */
                $cat .= sprintf( __( 'Default %s', 'wp-user-frontend' ), $tax->label );
                $cat .= '</label></div>';

                $cat .= '<select
                    multiple
                    id="' . esc_attr( $select_id ) . '"
                    name="wpuf_settings[' . esc_attr( $field_name ) . '][]"
                    data-value="' . esc_attr( $data_value ) . '"
                    data-taxonomy="' . esc_attr( $tax->name ) . '"
                    class="tax-list-selector wpuf-w-full wpuf-mt-2 wpuf-border-primary">';

                $categories = get_terms( $args );

                if ( ! is_wp_error( $categories ) && ! empty( $categories ) ) {
                    foreach ( $categories as $category ) {
                        $selected = in_array( (int) $category->term_id, array_map( 'intval', (array) $current_value ), true ) ? 'selected="selected"' : '';
                        $cat .= '<option value="' . esc_attr( $category->term_id ) . '" ' . $selected . '>' . esc_html( $category->name ) . '</option>';
                    }
                }

                $cat .= '</select></div>';
            }
        }

        wp_send_json_success(
            [
                'success' => 'true',
                'data'    => $cat,
			]
        );
    }

    public function get_roles() {
        // Security: Check nonce and user capabilities
        check_ajax_referer( 'wpuf-form-builder' );

        if ( ! current_user_can( wpuf_admin_role() ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        $roles = wpuf_get_user_roles();

        $html = '<div class="wpuf-mt-6 wpuf-input-container"><div class="wpuf-flex wpuf-items-center"><label for="default_category" class="wpuf-text-sm wpuf-text-gray-700 wpuf-my-2">' . __( 'Choose who can submit post ', 'wp-user-frontend' ) . '</label></div>';
        $html .= '<select
                    multiple
                    id="roles"
                    data-roles="roles"
                    name="wpuf_settings[roles][]"
                    :class="setting_class_names(\'dropdown\')">';

        foreach ( $roles as $key => $role ) {
            $html .= '<option value="' . $key . '">' . $role . '</option>';
        }

        $html .= '</select>';

        wp_send_json_success(
            [
                'success' => 'true',
                'data'    => $html,
            ]
        );
    }

    /**
     * Validate if fallback PPP cost is required and empty
     *
     * @param array $settings Form settings
     * @return bool True if validation fails (cost is required but empty), false if validation passes
     */
    private function validate_fallback_ppp_cost_required( $settings ) {
        // Check if payment options are enabled
        if ( empty( $settings['payment_options'] ) || ! wpuf_is_checkbox_or_toggle_on( $settings['payment_options'] ) ) {
            return false;
        }

        // Check if force pack purchase is selected
        if ( empty( $settings['choose_payment_option'] ) || 'force_pack_purchase' !== $settings['choose_payment_option'] ) {
            return false;
        }

        // Check if fallback PPP is enabled
        if ( empty( $settings['fallback_ppp_enable'] ) || ! wpuf_is_checkbox_or_toggle_on( $settings['fallback_ppp_enable'] ) ) {
            return false;
        }

        // Check if fallback cost is provided
        if ( empty( $settings['fallback_ppp_cost'] ) || floatval( $settings['fallback_ppp_cost'] ) <= 0 ) {
            return true;
        }

        return false;
    }
}
