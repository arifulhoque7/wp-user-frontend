<?php
/**
 * Core platform services
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Providers;

use WeDevs\Wpuf\Admin\BootPayload;
use WeDevs\Wpuf\Admin\Screens\Registry;
use WeDevs\Wpuf\Builder\HookBridge;
use WeDevs\Wpuf\Builder\HookDeprecations;
use WeDevs\Wpuf\Platform\REST\Manager;
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
        // Registers the REST controllers once on rest_api_init (replaces API::init_api()).
        $this->share_tagged(
            Manager::class,
            function ( $container ) {
                return new Manager( $container );
            }
        );

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
