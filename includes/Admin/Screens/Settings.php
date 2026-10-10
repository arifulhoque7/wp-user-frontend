<?php
/**
 * Settings screen
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\Screens;

use WeDevs\Wpuf\Admin\BootPayload;

/**
 * User Frontend > Settings: the React settings app, or the legacy
 * WeDevs_Settings_API screen when wpuf_settings_use_legacy().
 *
 * @since WPUF_SINCE
 */
class Settings extends Screen {

    use PrintsNotices;

    /**
     * Menu slug
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function slug() {
        return 'wpuf-settings';
    }

    /**
     * The React app shows notices in its wrapper; the legacy screen keeps
     * WordPress's own placement.
     *
     * @since WPUF_SINCE
     *
     * @return bool
     */
    public function captures_notices() {
        return ! $this->is_legacy();
    }

    /**
     * The React settings screen scopes its Tailwind utilities to this class;
     * the classic screen does not load that stylesheet.
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function body_class() {
        return $this->is_legacy() ? '' : 'wpuf-admin-react';
    }

    /**
     * Load step: enqueue the React app (or the legacy screen's scripts).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function load() {
        // Legacy mode renders the WeDevs_Settings_API screen (which enqueues its
        // own assets via admin_init) — skip the React bundle entirely.
        if ( function_exists( 'wpuf_settings_use_legacy' ) && wpuf_settings_use_legacy() ) {
            wp_enqueue_script( 'wpuf-subscriptions' );
            wp_enqueue_script( 'wpuf-settings' );

            // Footer link back to the new screen (design.md D12).
            add_filter( 'admin_footer_text', [ $this, 'legacy_footer_text' ], 99 );

            return;
        }

        wp_enqueue_style( 'wpuf-admin' );
        wp_enqueue_style( 'wp-components' );

        // Rich-text (wysiwyg) settings fields need the WordPress TinyMCE editor.
        wp_enqueue_editor();
        wp_enqueue_media();

        // Hide the WordPress admin footer text/version on the React settings page.
        add_filter( 'admin_footer_text', '__return_empty_string', 99 );
        add_filter( 'update_footer', '__return_empty_string', 99 );

        // Registered in the shared Assets registry (task 2.5b).
        wp_enqueue_style( 'wpuf-settings-react' );

        $handle = 'wpuf-settings-react';

        wp_enqueue_script( $handle );
        wp_set_script_translations( $handle, 'wp-user-frontend', WPUF_ROOT . '/languages' );
        wpuf()->platform()->get( BootPayload::class )->attach( 'settings', $handle );

        /**
         * The React settings screen is loading: enqueue a bundle that adds field
         * types (`wpuf.settings.field.<type>` filter) or extends the screen.
         *
         * @since WPUF_SINCE
         *
         * @param string $handle The settings app's script handle (depend on it).
         */
        do_action( 'wpuf_settings_app_scripts', $handle );

        wp_localize_script(
            $handle,
            'wpuf_settings',
            [
                'rest_url'    => esc_url_raw( rest_url() ),
                'nonce'       => wp_create_nonce( 'wp_rest' ),
                'is_pro'      => class_exists( 'WP_User_Frontend_Pro' ),
                'asset_url'   => WPUF_ASSET_URI,
                // Quick links next to page / form selects (edit, add new).
                'admin_url'   => admin_url(),
                'version'     => WPUF_VERSION,
                'pro_version' => defined( 'WPUF_PRO_VERSION' ) ? WPUF_PRO_VERSION : '',
                'plan'        => function_exists( 'wpuf_pro_current_plan' ) ? wpuf_pro_current_plan() : '',
                'upgrade_url'   => 'https://wedevs.com/wp-user-frontend-pro/pricing/',
                'support_url'   => 'https://wedevs.com/docs/wp-user-frontend-pro/',
                // Nonce-protected link to fall back to the classic settings UI.
                'switch_ui_url' => function_exists( 'wpuf_settings_ui_switch_url' ) ? wpuf_settings_ui_switch_url() : '',
                // This request only, the user's mode stays (override-safety notice).
                'classic_url'   => admin_url( 'admin.php?page=wpuf-settings&wpuf_settings_ui=legacy' ),
                // Settings of other plugins only the Classic screen can show.
                'classic_only'  => function_exists( 'wpuf_settings_classic_only_items' ) ? wpuf_settings_classic_only_items() : [],
                // One-time "new settings screen" notice (sites that upgraded).
                'new_ui_notice' => function_exists( 'wpuf_settings_new_ui_notice' ) && wpuf_settings_new_ui_notice(),
            ]
        );
    }

    /**
     * Print the React mount or the legacy screen.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function render() {
        // Fallback to the legacy WeDevs_Settings_API screen when requested — both
        // screens use the same wpuf_* options, so the data stays in sync.
        if ( function_exists( 'wpuf_settings_use_legacy' ) && wpuf_settings_use_legacy() ) {
            ?>
        <div class="wrap">
            <h2 class="with-headway-icon">
                <span class="title-area">
                    <?php esc_html_e( 'Settings', 'wp-user-frontend' ); ?>
                    <?php if ( function_exists( 'wpuf_settings_ui_switch_url' ) ) : ?>
                        <a href="<?php echo esc_url( wpuf_settings_ui_switch_url() ); ?>" class="page-title-action">
                            <?php esc_html_e( 'Switch to new settings', 'wp-user-frontend' ); ?>
                        </a>
                    <?php endif; ?>
                </span>
                <span class="flex-end">
                    <span
                        id="wpuf-headway-icon"
                        class="border border-gray-100 mr-[16px] rounded-full p-1 shadow-xs hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    ></span>
                    <a class="feedback-link" target="_blank" href="<?php echo esc_url( 'https://feedback.wedevs.com/b/user-frontend' ); ?>">💡 
                    <?php
                    esc_html_e(
                        'Submit Ideas', 'wp-user-frontend'
                    );
                    ?>
                    </a>
                </span>
            </h2>
            <div class="wpuf-settings-wrap">
                <?php
                settings_errors();

                wpuf()->admin->settings->get_settings_api()->show_navigation();
                wpuf()->admin->settings->get_settings_api()->show_forms();
                ?>
            </div>
        </div>
            <?php
            return;
        }
        $this->print_notices();
        ?>
        <div id="wpuf-settings-root" class="px-[20px]">
            <noscript>
                <strong>
                    <?php esc_html_e( 'This page requires JavaScript. Please enable it to manage settings.', 'wp-user-frontend' ); ?>
                </strong>
            </noscript>
            <h2><?php esc_html_e( 'Loading', 'wp-user-frontend' ); ?>...</h2>
        </div>
        <?php
    }

    /**
     * Footer text of the classic screen: a link to the new settings screen.
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function legacy_footer_text() {
        if ( ! function_exists( 'wpuf_settings_ui_switch_url' ) ) {
            return '';
        }

        return sprintf(
            '<a href="%1$s">%2$s</a>',
            esc_url( wpuf_settings_ui_switch_url() ),
            esc_html__( 'Switch to the new settings screen', 'wp-user-frontend' )
        );
    }

    /**
     * Whether the legacy screen is shown.
     *
     * @return bool
     */
    private function is_legacy() {
        return function_exists( 'wpuf_settings_use_legacy' ) && wpuf_settings_use_legacy();
    }

    /**
     * Admin app route of the React settings screen (task 5d). The classic
     * screen stays a page.
     *
     * @since WPUF_SINCE
     *
     * @return array[]
     */
    public function app_routes() {
        return [
            [
                'id'             => 'settings',
                'path'           => '/settings',
                'title'          => __( 'Settings', 'wp-user-frontend' ),
                'app'            => 'settings',
                'boot'           => 'settings',
                'in_app'         => ! $this->is_legacy(),
                'menuLink'       => true,
                'container'      => 'wpuf-settings-root',
                'containerClass' => 'px-[20px]',
                'notices'        => true,
                'page'           => 'admin.php?page=wpuf-settings',
            ],
        ];
    }

    /**
     * The React settings load only enqueues the screen and builds its data
     * (the one-time "new screen" notice included): nothing for the redirect
     * hop to do; the app page loads it.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function load_before_redirect() {}

    /**
     * The per-request screen override (`?wpuf_settings_ui=react|legacy`)
     * decides how the app page loads settings, so it travels with the redirect.
     *
     * @since WPUF_SINCE
     *
     * @return array
     */
    public function app_redirect_args() {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only view override.
        $mode = isset( $_GET['wpuf_settings_ui'] ) ? sanitize_key( wp_unslash( $_GET['wpuf_settings_ui'] ) ) : '';

        return $mode ? [ 'wpuf_settings_ui' => $mode ] : [];
    }

    /**
     * App route of a settings page request: `/settings` with its tab and
     * sub-tab, or '' in classic mode (the classic screen renders as before).
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function app_route_for_request() {
        if ( $this->is_legacy() ) {
            return '';
        }

        // phpcs:disable WordPress.Security.NonceVerification.Recommended -- read-only view state.
        $query = array_filter(
            [
                'tab' => isset( $_GET['tab'] ) ? sanitize_key( wp_unslash( $_GET['tab'] ) ) : '',
                'sub' => isset( $_GET['sub'] ) ? sanitize_key( wp_unslash( $_GET['sub'] ) ) : '',
            ]
        );
        // phpcs:enable WordPress.Security.NonceVerification.Recommended

        return '/settings' . ( $query ? '?' . http_build_query( $query ) : '' );
    }
}
