<?php
/**
 * Store normalizers
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Stores;

/**
 * Shape rules the stores apply before writing, kept in one place (they were
 * copied between Admin_Form_Builder::save_form() and Form_Settings_Cleanup).
 *
 * @since WPUF_SINCE
 */
class Normalizers {

    /**
     * Pro-only notification settings: stored only while Pro is active.
     */
    const PRO_NOTIFICATION_KEYS = [ 'notification_edit', 'notification_edit_to', 'notification_edit_subject', 'notification_edit_body' ];

    /**
     * Pro-only keys inside `notification`.
     */
    const PRO_NOTIFICATION_SUB_KEYS = [ 'edit', 'edit_to', 'edit_subject', 'edit_body' ];

    /**
     * Form settings as they may be stored: without Pro, the Pro-only
     * notification settings are dropped (top level and inside `notification`).
     *
     * @since WPUF_SINCE
     *
     * @param mixed     $settings   Form settings
     * @param bool|null $pro_active Pro state (null: detect)
     *
     * @return mixed Settings (non-arrays unchanged)
     */
    public static function form_settings( $settings, $pro_active = null ) {
        if ( ! is_array( $settings ) ) {
            return $settings;
        }

        if ( null === $pro_active ) {
            $pro_active = wpuf_is_pro_active();
        }

        if ( $pro_active ) {
            return $settings;
        }

        foreach ( self::PRO_NOTIFICATION_KEYS as $key ) {
            unset( $settings[ $key ] );
        }

        if ( isset( $settings['notification'] ) && is_array( $settings['notification'] ) ) {
            foreach ( self::PRO_NOTIFICATION_SUB_KEYS as $key ) {
                unset( $settings['notification'][ $key ] );
            }
        }

        return $settings;
    }

    /**
     * Whether a list meta write (notifications, integrations) would only turn a
     * stored empty value ('' or no meta) into `[]`, which develop never wrote.
     *
     * @since WPUF_SINCE
     *
     * @param mixed $value  Value to store
     * @param mixed $stored Stored value
     *
     * @return bool
     */
    public static function is_empty_list_noop( $value, $stored ) {
        return empty( $value ) && empty( $stored );
    }
}
