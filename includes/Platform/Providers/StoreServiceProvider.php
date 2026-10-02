<?php
/**
 * Form and field stores
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Providers;

use WeDevs\Wpuf\Platform\ServiceProvider;
use WeDevs\Wpuf\Platform\Stores\FieldStore;
use WeDevs\Wpuf\Platform\Stores\FormStore;

/**
 * Registers the form and field stores every form writer goes through.
 *
 * @since WPUF_SINCE
 */
class StoreServiceProvider extends ServiceProvider {

    /**
     * Register services (once: Stores may register them before the boot).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function register() {
        if ( $this->container->has( FormStore::class ) ) {
            return;
        }

        $this->share_tagged(
            FieldStore::class,
            function () {
                return new FieldStore();
            }
        );

        $this->share_tagged(
            FormStore::class,
            function ( $container ) {
                return new FormStore( $container->get( FieldStore::class ) );
            }
        );
    }
}
