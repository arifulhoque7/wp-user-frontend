<?php

namespace WeDevs\Wpuf\Ajax;

use WeDevs\Wpuf\Builder\FormSave;

/**
 * Ajax handlers
 */
class Admin_Form_Builder_Ajax {
    /**
     * Save form data
     *
     * AJAX shim of `wpuf/v1/admin/forms/{id}`: same nonce, capability, payload
     * and response as before; the save itself is `Builder\FormSave`.
     *
     * @since 2.5
     * @since WPUF_SINCE Forwards to Builder\FormSave (the React builder saves over REST).
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

        $result = wpuf()->platform()->get( FormSave::class )->save( $post_data, $form_data );

        if ( is_wp_error( $result ) ) {
            wp_send_json_error( $result->get_error_message() );
        }

        wp_send_json_success( $result );
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
}
