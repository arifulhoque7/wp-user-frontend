<?php
/**
 * Form builder save
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Builder;

use WeDevs\Wpuf\Admin\Forms\Admin_Form_Builder;
use WeDevs\Wpuf\Platform\Stores\Normalizers;
use WP_Error;

/**
 * Saves a form from the builder payload: the one implementation behind the
 * REST route `wpuf/v1/admin/forms/{id}` and the AJAX action
 * `wpuf_form_builder_save_form` (kept as a shim). Callers check the request
 * (nonce, capability) first; this class validates the payload, normalizes it
 * like develop's form post and writes through the form store.
 *
 * @since WPUF_SINCE
 */
class FormSave {

    /**
     * Save a form.
     *
     * @since WPUF_SINCE
     *
     * @param array $post_data Unslashed request body (`form_fields`, `notifications`,
     *                         `settings`, `integrations`, `legacy_settings`,
     *                         `legacy_settings_keys`, all JSON / query strings)
     * @param array $form_data The builder's form fields (`wpuf_form_id`,
     *                         `form_settings_key`, `post_title`, `wpuf_settings`)
     *
     * @return array|WP_Error `form_fields` and `form_settings` as saved, or an error
     */
    public function save( array $post_data, array $form_data ) {
        if ( empty( $form_data['wpuf_form_id'] ) ) {
            return new WP_Error( 'wpuf_form_invalid_id', __( 'Invalid form id', 'wp-user-frontend' ) );
        }

        $form_id = absint( $form_data['wpuf_form_id'] );

        /**
         * Post types the form builder may save into.
         *
         * @since WPUF_SINCE
         *
         * @param string[] $post_types Builder form post types.
         */
        $allowed_post_types = (array) apply_filters( 'wpuf_form_builder_save_post_types', [ 'wpuf_forms', 'wpuf_profile' ] );

        if ( ! in_array( get_post_type( $form_id ), $allowed_post_types, true ) ) {
            return new WP_Error( 'wpuf_form_invalid_id', __( 'Invalid form id', 'wp-user-frontend' ) );
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
            return new WP_Error( 'wpuf_form_invalid_settings', __( 'Invalid form settings', 'wp-user-frontend' ) );
        }

        $form_fields   = isset( $post_data['form_fields'] ) ? $post_data['form_fields'] : '';
        $notifications = isset( $post_data['notifications'] ) ? $post_data['notifications'] : '';
        $settings      = [];
        // Null = not sent: the builder has no integrations editor, so the stored ones stay.
        $integrations = null;

        if ( isset( $post_data['settings'] ) ) {
            // Develop posted these as a form: keep its CRLF line breaks.
            $settings = Normalizers::form_post_newlines( json_decode( $post_data['settings'], true ), get_post_meta( $form_id, $form_settings_key, true ) );
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
            $integrations = Normalizers::form_post_newlines( json_decode( $post_data['integrations'], true ), get_post_meta( $form_id, 'integrations', true ) );
        }

        $form_fields   = json_decode( $form_fields, true );
        $notifications = json_decode( $notifications, true );

        // Values develop's form post always stored (Pro): the registration new
        // user status, and the multi-step bar type (its select's first option).
        if ( class_exists( 'WP_User_Frontend_Pro' ) ) {
            if ( 'wpuf_profile' === get_post_type( $form_id ) ) {
                $settings = Normalizers::registration_user_status( $settings );
            }

            $settings = Normalizers::multistep_progressbar_type( $settings );
        }

        // Server-side validation for fallback PPP cost
        if ( $this->fallback_ppp_cost_missing( $settings ) ) {
            return new WP_Error( 'wpuf_form_ppp_cost_required', __( 'Cost for each additional post after pack limit is reached is required when Pay-per-post billing when limit exceeds is enabled.', 'wp-user-frontend' ) );
        }

        $data = [
            'form_id'           => $form_id,
            'post_title'        => sanitize_text_field( isset( $form_data['post_title'] ) ? $form_data['post_title'] : '' ),
            'form_fields'       => $form_fields,
            'form_settings'     => $settings,
            'form_settings_key' => $form_settings_key,
            'notifications'     => $notifications,
            'integrations'      => $integrations,
        ];

        return [
            'form_fields'   => Admin_Form_Builder::save_form( $data ),
            'form_settings' => $settings,
        ];
    }

    /**
     * Whether the fallback pay-per-post cost is required but empty
     *
     * @param array $settings Form settings
     *
     * @return bool True if the cost is required but empty
     */
    private function fallback_ppp_cost_missing( $settings ) {
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
