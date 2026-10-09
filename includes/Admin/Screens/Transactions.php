<?php
/**
 * Transactions screen
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\Screens;

use WeDevs\Wpuf\Admin\List_Table_Transactions;
use WeDevs\Wpuf\Platform\Caps;
use WeDevs\Wpuf\Platform\Transactions\TransactionService;

/**
 * User Frontend > Transactions. In the admin app as `#/transactions` on
 * Platform\REST\Controllers\TransactionsController; the classic list table
 * (load + render, moved from Admin\Menu) stays for a disabled app, and its
 * action links still run on the old URL.
 *
 * @since WPUF_SINCE
 */
class Transactions extends Screen {

    /**
     * Menu slug
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function slug() {
        return 'wpuf_transaction';
    }

    /**
     * Load the screen (moved from Admin\Menu).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function load() {
        $option = 'per_page';
        $args   = [
            'label'   => __( 'Number of items per page:', 'wp-user-frontend' ),
            'default' => 20,
            'option'  => 'transactions_per_page',
        ];

        add_screen_option( $option, $args );

        wpuf()->admin->transaction_list_table = new List_Table_Transactions();
    }

    /**
     * Render the screen (moved from Admin\Menu).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function render() {
        $page = WPUF_INCLUDES . '/Admin/views/transactions-list-table-view.php';

        wpuf_require_once( $page );
    }

    /**
     * The admin app route.
     *
     * @since WPUF_SINCE
     *
     * @return array[]
     */
    public function app_routes() {
        return [
            [
                'id'             => 'transactions',
                'path'           => '/transactions',
                'title'          => __( 'Transactions', 'wp-user-frontend' ),
                'app'            => 'transactions',
                'boot'           => 'transactions',
                'in_app'         => true,
                'menuLink'       => true,
                'notices'        => true,
                'container'      => 'wpuf-transactions-root',
                'containerClass' => 'px-[20px]',
            ],
        ];
    }

    /**
     * The route the old URL opens (its status tab).
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function app_route_for_request() {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only view state.
        $status = isset( $_GET['status'] ) ? sanitize_key( wp_unslash( $_GET['status'] ) ) : '';

        return '/transactions' . ( in_array( $status, [ 'completed', 'pending' ], true ) ? '?status=' . $status : '' );
    }

    /**
     * The old URL: an action link of the classic table (accept, reject,
     * delete, bulk) still runs there, with its own nonce check, then the
     * app opens.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function load_before_redirect() {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- the table verifies the nonce of each action.
        if ( empty( $_REQUEST['action'] ) && empty( $_REQUEST['action2'] ) ) {
            return;
        }

        ( new List_Table_Transactions() )->prepare_items();
    }

    /**
     * Assets of the app route.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function load_in_app() {
        wp_enqueue_style( 'wpuf-admin-pages' );
        wp_enqueue_script( 'wpuf-transactions' );
        wp_set_script_translations( 'wpuf-transactions', 'wp-user-frontend', WPUF_ROOT . '/languages' );
    }

    /**
     * What the route needs up front (rows load from REST).
     *
     * @since WPUF_SINCE
     *
     * @return array
     */
    public function app_globals() {
        $service = wpuf()->platform()->get( TransactionService::class );

        return [
            'wpufTransactions' => [
                'canManage' => Caps::can( Caps::MANAGE_SITE ),
                'gateways'  => $service->gateways(),
                'perPage'   => $service->per_page(),
            ],
        ];
    }
}
