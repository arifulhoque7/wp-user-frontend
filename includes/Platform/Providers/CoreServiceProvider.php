<?php
/**
 * Core platform services
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Providers;

use WeDevs\Wpuf\Builder\HookBridge;
use WeDevs\Wpuf\Platform\ServiceProvider;

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
        // One bridge per builder page: get( HookBridge::class, $form_type, $form_settings ).
        $this->bind_tagged(
            HookBridge::class,
            function ( $container, $form_type = 'post', $form_settings = [] ) {
                return new HookBridge( $form_type, $form_settings );
            }
        );
    }
}
