<?php
/**
 * Free/Pro version guard
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform;

use WeDevs\Wpuf\Platform\Contracts\Hookable;

/**
 * Free updates from wordpress.org before Pro (D10). When an older Pro without
 * the React admin is active, its Vue form builder scripts cannot run on the
 * React builder: they are not loaded there, and one notice asks to update Pro.
 *
 * @since WPUF_SINCE
 */
class VersionGuard implements Hookable {

    /**
     * Pro platform version this free version needs.
     */
    const REQUIRED_PRO_PLATFORM = '1.0';

    /**
     * Scripts an older Pro enqueues for the Vue form builder.
     */
    const LEGACY_PRO_BUILDER_SCRIPTS = [
        'wpuf-form-builder-components-pro',
        'wpuf-form-builder-field-option-data-pro',
        'wpuf-form-builder-mixins-pro',
        'wpuf-form-builder-wpuf-forms-pro',
        'wpuf-form-builder-wpuf-profile',
        'wpuf-vue',
        'wpuf-vuex',
    ];

    /**
     * Hook the guard.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function register_hooks() {
        add_action( 'admin_enqueue_scripts', [ $this, 'skip_legacy_pro_builder' ], 999 );
        add_action( 'admin_notices', [ $this, 'pro_update_notice' ] );
    }

    /**
     * Whether an active Pro is older than the React admin needs.
     *
     * @since WPUF_SINCE
     *
     * @return bool
     */
    public static function pro_needs_update() {
        return self::is_outdated_pro(
            defined( 'WPUF_PRO_VERSION' ) ? WPUF_PRO_VERSION : null,
            defined( 'WPUF_PRO_PLATFORM_VERSION' ) ? WPUF_PRO_PLATFORM_VERSION : null
        );
    }

    /**
     * Whether a Pro with these versions is too old for the React admin.
     *
     * @since WPUF_SINCE
     *
     * @param string|null $pro_version          Pro version, null when Pro is not active.
     * @param string|null $pro_platform_version Pro platform version, null when Pro does not declare one.
     *
     * @return bool
     */
    public static function is_outdated_pro( $pro_version, $pro_platform_version ) {
        if ( null === $pro_version ) {
            return false;
        }

        return null === $pro_platform_version
            || version_compare( $pro_platform_version, self::REQUIRED_PRO_PLATFORM, '<' );
    }

    /**
     * Whether the current admin page is a WPUF form builder or forms list.
     *
     * @return bool
     */
    private function is_builder_screen() {
        $page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- screen detection only.

        return in_array( $page, [ 'wpuf-post-forms', 'wpuf-profile-forms' ], true );
    }

    /**
     * Do not load an older Pro's Vue builder scripts on the React builder.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function skip_legacy_pro_builder() {
        if ( ! self::pro_needs_update() || ! $this->is_builder_screen() ) {
            return;
        }

        foreach ( self::LEGACY_PRO_BUILDER_SCRIPTS as $handle ) {
            wp_dequeue_script( $handle );
        }
    }

    /**
     * One notice on WPUF admin pages while Pro needs an update.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function pro_update_notice() {
        if ( ! self::pro_needs_update() || ! current_user_can( wpuf_admin_role() ) ) {
            return;
        }

        $page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- screen detection only.

        if ( 0 !== strpos( $page, 'wpuf' ) ) {
            return;
        }

        printf(
            '<div class="notice notice-warning"><p>%s</p></div>',
            esc_html(
                sprintf(
                    /* translators: 1: WP User Frontend version, 2: WP User Frontend Pro version */
                    __( 'WP User Frontend %1$s needs a newer WP User Frontend Pro than %2$s for the form builder. Pro form builder features are off until you update WP User Frontend Pro.', 'wp-user-frontend' ),
                    WPUF_VERSION,
                    WPUF_PRO_VERSION
                )
            )
        );
    }
}
