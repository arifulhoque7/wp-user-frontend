<?php
/**
 * Core platform services
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Providers;

use WeDevs\Wpuf\Admin\Assets;
use WeDevs\Wpuf\Admin\BootPayload;
use WeDevs\Wpuf\Admin\Screens\Registry;
use WeDevs\Wpuf\Builder\HookBridge;
use WeDevs\Wpuf\Builder\HookDeprecations;
use WeDevs\Wpuf\Platform\ServiceProvider;
use WeDevs\Wpuf\Platform\VersionGuard;

/**
 * Registers the free plugin's core platform services.
 *
 * @since WPUF_SINCE
 */
class CoreServiceProvider extends ServiceProvider {

    /**
     * Register services
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function register() {
        // Older Pro without the React admin: its Vue builder scripts are skipped, one notice.
        $this->share_tagged(
            VersionGuard::class,
            function () {
                return new VersionGuard();
            }
        );

        // Admin screens on their menu slugs, notice capture for React screens.
        $this->share_tagged(
            Registry::class,
            function () {
                return new Registry();
            }
        );

        // React admin bundles (handles, deps from *.asset.php), stylesheet switch, body classes.
        $this->share_tagged(
            Assets::class,
            function () {
                return new Assets();
            }
        );

        // window.wpufAdmin for the React admin screens.
        $this->share_tagged(
            BootPayload::class,
            function () {
                return new BootPayload();
            }
        );

        // Retired Vue builder hooks: deprecation shims + admin notice (4.4g).
        $this->share_tagged(
            HookDeprecations::class,
            function () {
                return new HookDeprecations();
            }
        );

        // One bridge per builder page: get( HookBridge::class, $form_type, $form_settings ).
        $this->bind_tagged(
            HookBridge::class,
            function ( $container, $form_type = 'post', $form_settings = [] ) {
                return new HookBridge( $form_type, $form_settings );
            }
        );
    }
}
