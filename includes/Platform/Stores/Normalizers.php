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

    /**
     * Registration forms: the new user status the frontend reads.
     *
     * Develop's builder always posted `wpuf_settings[wpuf_user_status]` (Pro's
     * hidden `approved` input, `pending` while "Require approval" is on), so
     * every saved registration form had it. The frontend needs it: without it
     * Pro's registration skips the auto login (`approved` only) and sends the
     * "pending" status mail. The React builder writes it only when the toggle
     * changes, so a missing value is filled from the toggle on save.
     *
     * @since WPUF_SINCE
     *
     * @param array $settings Registration form settings
     *
     * @return array
     */
    public static function registration_user_status( $settings ) {
        if ( ! is_array( $settings ) || isset( $settings['wpuf_user_status'] ) ) {
            return $settings;
        }

        $settings['wpuf_user_status'] = isset( $settings['user_status'] ) && wpuf_is_checkbox_or_toggle_on( $settings['user_status'] ) ? 'pending' : 'approved';

        return $settings;
    }

    /**
     * Multi-step progress bar type of a form with multi-step on.
     *
     * Develop's builder posted the type's native select, whose first option is
     * `progressive`, so a form saved with multi-step on always had it. The
     * frontend falls back to `step_by_step` without it, so a form set up in the
     * React builder (which writes an untouched select only after a pick)
     * showed the other bar. A missing value is filled with develop's
     * `progressive` while multi-step is on (owner decision 2026-10-05).
     *
     * @since WPUF_SINCE
     *
     * @param array $settings Form settings
     *
     * @return array
     */
    public static function multistep_progressbar_type( $settings ) {
        if (
            ! is_array( $settings )
            || isset( $settings['multistep_progressbar_type'] )
            || ! isset( $settings['enable_multistep'] )
            || ! wpuf_is_checkbox_or_toggle_on( $settings['enable_multistep'] )
        ) {
            return $settings;
        }

        $settings['multistep_progressbar_type'] = 'progressive';

        return $settings;
    }

    /**
     * Line breaks as a browser form post sends them: every line break in an
     * edited string as CRLF. Develop's builder and settings screens posted
     * their textareas as a form, so their stored text has `\r\n`; the React
     * screens send JSON with `\n`. A string whose text equals the stored one
     * keeps the stored bytes, so an untouched save changes nothing (G3).
     *
     * @since WPUF_SINCE
     *
     * @param mixed $value  Value from a React save (string or nested array)
     * @param mixed $stored The stored value at the same place, if any
     *
     * @return mixed
     */
    public static function form_post_newlines( $value, $stored = null ) {
        if ( is_array( $value ) ) {
            foreach ( $value as $key => $item ) {
                $value[ $key ] = self::form_post_newlines( $item, is_array( $stored ) && array_key_exists( $key, $stored ) ? $stored[ $key ] : null );
            }

            return $value;
        }

        if ( ! is_string( $value ) || false === strpbrk( $value, "\r\n" ) ) {
            return $value;
        }

        if ( is_string( $stored ) && str_replace( "\r\n", "\n", $stored ) === str_replace( "\r\n", "\n", $value ) ) {
            return $stored;
        }

        return preg_replace( '/\r\n|\r|\n/', "\r\n", $value );
    }
}
