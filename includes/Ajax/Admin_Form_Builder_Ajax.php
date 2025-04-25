<?php

namespace WeDevs\Wpuf\Ajax;

use WeDevs\Wpuf\Admin\Forms\Admin_Form_Builder;

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

        if ( ! wp_verify_nonce( $form_data['wpuf_form_builder_nonce'], 'wpuf_form_builder_save_form' ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( ! current_user_can( wpuf_admin_role() ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( ! current_user_can( wpuf_admin_role() ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( empty( $form_data['wpuf_form_id'] ) ) {
            wp_send_json_error( __( 'Invalid form id', 'wp-user-frontend' ) );
        }

        $form_fields   = isset( $post_data['form_fields'] ) ? $post_data['form_fields'] : '';
        $notifications = isset( $post_data['notifications'] ) ? $post_data['notifications'] : '';
        $settings      = [];
        $integrations  = [];

        if ( isset( $post_data['settings'] ) ) {
            $settings = (array) json_decode( $post_data['settings'] );
        } else {
            $settings = isset( $form_data['wpuf_settings'] ) ? $form_data['wpuf_settings'] : [];
        }

        if ( isset( $post_data['integrations'] ) ) {
            $integrations = (array) json_decode( $post_data['integrations'] );
        }

        $form_fields   = json_decode( $form_fields, true );
        $notifications = json_decode( $notifications, true );

        $data = [
            'form_id'           => absint( $form_data['wpuf_form_id'] ),
            'post_title'        => sanitize_text_field( $form_data['post_title'] ),
            'form_fields'       => $form_fields,
            'form_settings'     => $settings,
            'form_settings_key' => isset( $form_data['form_settings_key'] ) ? $form_data['form_settings_key'] : '',
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
        $post_type = $post_data['post_type'];
        $nonce     = $post_data['wpuf_form_builder_setting_nonce'];

        if ( isset( $nonce ) && ! wp_verify_nonce( $post_data['wpuf_form_builder_setting_nonce'], 'form-builder-setting-nonce' ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( ! current_user_can( wpuf_admin_role() ) ) {
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
        $post_type = $post_data['post_type'];
        $nonce     = $post_data['wpuf_form_builder_setting_nonce'];
        $form_id   = isset( $post_data['form_id'] ) ? absint( $post_data['form_id'] ) : 0;

        if ( isset( $nonce ) && ! wp_verify_nonce( $post_data['wpuf_form_builder_setting_nonce'], 'form-builder-setting-nonce' ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( ! current_user_can( wpuf_admin_role() ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( ! current_user_can( wpuf_admin_role() ) ) {
            wp_send_json_error( __( 'Unauthorized operation', 'wp-user-frontend' ) );
        }

        if ( isset( $post_type ) && empty( $post_data['post_type'] ) ) {
            wp_send_json_error( __( 'Invalid post type', 'wp-user-frontend' ) );
        }

        // Get saved form settings
        $form_settings = wpuf_get_form_settings( $form_id );

        $post_taxonomies = get_object_taxonomies( $post_type, 'objects' );
        $taxonomy_html = '';
        foreach ( $post_taxonomies as $tax ) {
            if ( $tax->hierarchical ) {
                $args = [
                    'hide_empty'   => false,
                    'hierarchical' => true,
                    'taxonomy'     => $tax->name,
                ];

                $categories = get_terms( $args );
                
                if ( empty( $categories ) || is_wp_error( $categories ) ) {
                    continue;
                }

                // Get saved selected categories for this taxonomy
                $default_selected = [];
                $tax_key = 'default_' . $tax->name;
                if ( !empty( $form_settings[$tax_key] ) ) {
                    $default_selected = is_array( $form_settings[$tax_key] ) ? $form_settings[$tax_key] : [$form_settings[$tax_key]];
                }

                $select_id = 'default_' . esc_attr( $tax->name ) . '_category';
                $container_class = 'wpuf-taxonomy-select-container-' . esc_attr( $tax->name );
                
                $taxonomy_html .= '<div class="wpuf-mt-6 wpuf-input-container ' . $container_class . '">';
                $taxonomy_html .= '<div class="wpuf-flex wpuf-items-center"><label for="' . $select_id . '" class="wpuf-text-sm wpuf-text-gray-700 wpuf-my-2">' . esc_html__( 'Default ', 'wp-user-frontend' ) . esc_html( $post_type ) . ' ' . esc_html( $tax->label ) . '</label></div>';

                $taxonomy_html .= '<select
                    multiple
                    id="' . $select_id . '"
                    class="wpuf-taxonomy-select" 
                    name="wpuf_settings[default_' . esc_attr( $tax->name ) . '][]"
                    :class="[\'tax-list-selector\', setting_class_names(\'dropdown\')]">';

                foreach ( $categories as $category ) {
                    $selected = in_array( $category->term_id, $default_selected ) ? 'selected="selected"' : '';
                    $taxonomy_html .= '<option value="' . esc_attr( $category->term_id ) . '" ' . $selected . '>' . esc_html( $category->name ) . '</option>';
                }

                $taxonomy_html .= '</select></div>';
            }
        }

        wp_send_json_success(
            [
                'success' => 'true',
                'data'    => $taxonomy_html,
            ]
        );
    }

    public function get_roles() {
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
}
