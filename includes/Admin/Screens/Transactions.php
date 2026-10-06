<?php
/**
 * Transactions screen
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\Screens;

use WeDevs\Wpuf\Admin\List_Table_Transactions;

/**
 * User Frontend > Transactions (list table). Load and render moved from Admin\Menu, whose callbacks forward here.
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
}
