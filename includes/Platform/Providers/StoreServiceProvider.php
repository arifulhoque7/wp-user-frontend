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
use WeDevs\Wpuf\Platform\Stores\SettingsStore;
use WeDevs\Wpuf\Platform\Stores\SubscriptionStore;
use WeDevs\Wpuf\Platform\Tools\ToolsService;
use WeDevs\Wpuf\Platform\Transactions\TransactionService;

/**
 * Registers the stores every form, subscription and settings writer goes through.
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

        $this->share_tagged(
            SubscriptionStore::class,
            function () {
                return new SubscriptionStore();
            }
        );

        $this->share_tagged(
            SettingsStore::class,
            function () {
                return new SettingsStore();
            }
        );

        // Domain services over the stores and develop's tables (Tools, Transactions).
        $this->share_tagged(
            ToolsService::class,
            function () {
                return new ToolsService();
            }
        );

        $this->share_tagged(
            TransactionService::class,
            function () {
                return new TransactionService();
            }
        );
    }
}
