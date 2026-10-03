<?php
/**
 * Settings screen
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\Screens;

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

        wp_enqueue_style(
            'wpuf-settings-react',
            WPUF_ASSET_URI . '/css/settings-react.css',
            [],
            WPUF_VERSION
        );

        $handle     = 'wpuf-settings-react';
        $asset_file = WPUF_ROOT . '/assets/js/settings-react.min.asset.php';
        $asset      = file_exists( $asset_file )
            ? require $asset_file
            : [
                'dependencies' => [ 'wp-element', 'wp-data', 'wp-api-fetch', 'wp-i18n', 'wp-hooks', 'wp-components' ],
                'version' => WPUF_VERSION,
            ];

        wp_register_script(
            $handle,
            WPUF_ASSET_URI . '/js/settings-react.min.js',
            $asset['dependencies'],
            $asset['version'],
            true
        );

        wp_enqueue_script( $handle );
        wp_set_script_translations( $handle, 'wp-user-frontend' );

        wp_localize_script(
            $handle,
            'wpuf_settings',
            [
                'rest_url'    => esc_url_raw( rest_url() ),
                'nonce'       => wp_create_nonce( 'wp_rest' ),
                'is_pro'      => class_exists( 'WP_User_Frontend_Pro' ),
                'asset_url'   => WPUF_ASSET_URI,
                'version'     => WPUF_VERSION,
                'pro_version' => defined( 'WPUF_PRO_VERSION' ) ? WPUF_PRO_VERSION : '',
                'plan'        => function_exists( 'wpuf_pro_current_plan' ) ? wpuf_pro_current_plan() : '',
                'upgrade_url'   => 'https://wedevs.com/wp-user-frontend-pro/pricing/',
                'support_url'   => 'https://wedevs.com/docs/wp-user-frontend-pro/',
                // Nonce-protected link to fall back to the classic settings UI.
                'switch_ui_url' => function_exists( 'wpuf_settings_ui_switch_url' ) ? wpuf_settings_ui_switch_url() : '',
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
                        class="wpuf-border wpuf-border-gray-100 wpuf-mr-[16px] wpuf-rounded-full wpuf-p-1 wpuf-shadow-sm hover:wpuf-bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
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
        <div id="wpuf-settings-root" class="!wpuf-ml-[-20px] wpuf-min-h-screen wpuf-w-[calc(100%+20px)]">
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
     * Whether the legacy screen is shown.
     *
     * @return bool
     */
    private function is_legacy() {
        return function_exists( 'wpuf_settings_use_legacy' ) && wpuf_settings_use_legacy();
    }
}
