<?php
/**
 * Store access for legacy entry points
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Stores;

use WeDevs\Wpuf\Platform\Providers\StoreServiceProvider;

/**
 * The stores from the platform container, also before the platform boots
 * (plugin activation runs the installer without `plugins_loaded`).
 *
 * @since WPUF_SINCE
 */
class Stores {

    /**
     * Form store
     *
     * @since WPUF_SINCE
     *
     * @return FormStore
     */
    public static function forms() {
        return self::get( FormStore::class );
    }

    /**
     * Field store
     *
     * @since WPUF_SINCE
     *
     * @return FieldStore
     */
    public static function fields() {
        return self::get( FieldStore::class );
    }

    /**
     * Resolve a store, registering the stores first when the boot has not run yet.
     *
     * @param string $id Service id
     *
     * @return object
     */
    private static function get( $id ) {
        $container = wpuf()->platform();

        if ( ! $container->has( $id ) ) {
            ( new StoreServiceProvider( $container ) )->register();
        }

        return $container->get( $id );
    }
}
