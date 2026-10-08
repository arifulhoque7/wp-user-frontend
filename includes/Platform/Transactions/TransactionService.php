<?php
/**
 * Transactions service
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Transactions;

use WeDevs\Wpuf\Frontend\Payment;
use WP_Error;

/**
 * User Frontend > Transactions for the admin app (`#/transactions`,
 * Platform\REST\Controllers\TransactionsController).
 *
 * Two kinds of rows, as on the classic page: completed payments are rows of
 * the `wpuf_transaction` table, pending bank payments are `wpuf_order`
 * posts. Their IDs overlap, so every row carries its kind (`transaction` or
 * `order`) and the actions check it: accept / reject take orders, delete
 * takes transactions. Accept and reject fire the same hooks as the classic
 * page (`wpuf_gateway_bank_order_complete`, `wpuf_{$gateway}_bank_order_reject`,
 * `wpuf_payment_received` through Payment::insert_payment()).
 *
 * @since WPUF_SINCE
 */
class TransactionService {

    /**
     * Kind of a completed payment row.
     */
    const KIND_TRANSACTION = 'transaction';

    /**
     * Kind of a pending bank payment (wpuf_order post).
     */
    const KIND_ORDER = 'order';

    /**
     * Status tabs.
     */
    const STATUSES = [ 'all', 'completed', 'pending' ];

    /**
     * Sortable columns.
     */
    const ORDERBY = [ 'created', 'id' ];

    /**
     * Gateway label of an accepted bank payment (classic page).
     */
    const BANK_LABEL = 'Bank/Manual';

    /**
     * One page of rows, with the tab counts.
     *
     * @since WPUF_SINCE
     *
     * @param array $args status, search, gateway, from, to, orderby, order, page, per_page
     *
     * @return array items, total, counts
     */
    public function query( $args ) {
        global $wpdb;

        $args = wp_parse_args(
            $args,
            [
                'status'   => 'all',
                'search'   => '',
                'gateway'  => '',
                'from'     => '',
                'to'       => '',
                'orderby'  => 'created',
                'order'    => 'desc',
                'page'     => 1,
                'per_page' => 20,
            ]
        );

        $status   = in_array( $args['status'], self::STATUSES, true ) ? $args['status'] : 'all';
        $orderby  = in_array( $args['orderby'], self::ORDERBY, true ) ? $args['orderby'] : 'created';
        $order    = 'asc' === strtolower( $args['order'] ) ? 'ASC' : 'DESC';
        $per_page = max( 1, min( 100, absint( $args['per_page'] ) ) );
        $offset   = ( max( 1, absint( $args['page'] ) ) - 1 ) * $per_page;

        list( $tx_sql, $order_sql ) = $this->filters( $args );

        $parts = [];

        if ( 'pending' !== $status ) {
            $parts[] = "SELECT 'transaction' AS kind, id, created AS sort_date FROM {$wpdb->prefix}wpuf_transaction WHERE 1=1 {$tx_sql}" . ( 'completed' === $status ? " AND status = 'completed'" : '' );
        }

        if ( 'completed' !== $status && null !== $order_sql ) {
            $parts[] = "SELECT 'order' AS kind, ID AS id, post_date AS sort_date FROM {$wpdb->posts} WHERE post_type = 'wpuf_order' AND post_status IN ('publish','pending') {$order_sql}";
        }

        $items = [];
        $total = 0;

        if ( $parts ) {
            $union = '(' . implode( ') UNION ALL (', $parts ) . ')';
            $sort  = 'id' === $orderby ? 'id' : 'sort_date';
            // phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery -- filter values are prepared in filters(); sort column and order are allowlisted.
            $total = (int) $wpdb->get_var( "SELECT COUNT(*) FROM ({$union}) AS wpuf_rows" );
            $rows  = $wpdb->get_results( $wpdb->prepare( "SELECT kind, id FROM ({$union}) AS wpuf_rows ORDER BY {$sort} {$order}, id {$order} LIMIT %d, %d", $offset, $per_page ) );
            // phpcs:enable

            $items = $this->hydrate( (array) $rows );
        }

        return [
            'items'  => $items,
            'total'  => $total,
            'counts' => $this->counts(),
        ];
    }

    /**
     * SQL conditions for the search, gateway and date filters: one for the
     * transaction table, one for orders (null: no order matches).
     *
     * @param array $args Query args
     *
     * @return array [ string, string|null ]
     */
    private function filters( $args ) {
        global $wpdb;

        $tx    = '';
        $order = '';

        $search = trim( (string) $args['search'] );

        if ( '' !== $search ) {
            $like = '%' . $wpdb->esc_like( $search ) . '%';
            $tx  .= $wpdb->prepare(
                ' AND ( payer_email LIKE %s OR payer_first_name LIKE %s OR payer_last_name LIKE %s OR transaction_id LIKE %s OR CAST(id AS CHAR) = %s )',
                $like,
                $like,
                $like,
                $like,
                $search
            );
            // An order keeps the payer in its serialized `_data` meta.
            $order .= $wpdb->prepare(
                " AND ( CAST(ID AS CHAR) = %s OR EXISTS ( SELECT 1 FROM {$wpdb->postmeta} m WHERE m.post_id = ID AND m.meta_key = '_data' AND m.meta_value LIKE %s ) )",
                $search,
                $like
            );
        }

        $gateway = (string) $args['gateway'];

        if ( '' !== $gateway ) {
            $tx .= $wpdb->prepare( ' AND payment_type = %s', $gateway );

            // Orders are bank payments waiting for approval.
            if ( self::BANK_LABEL !== $gateway ) {
                $order = null;
            }
        }

        foreach ( [
			'from' => '>=',
			'to' => '<=',
		] as $key => $operator ) {
            $date = (string) $args[ $key ];

            if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $date ) ) {
                continue;
            }

            $value = $date . ( 'to' === $key ? ' 23:59:59' : ' 00:00:00' );
            $tx   .= $wpdb->prepare( " AND created {$operator} %s", $value ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- operator is from the fixed map above.

            if ( null !== $order ) {
                $order .= $wpdb->prepare( " AND post_date {$operator} %s", $value ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- operator is from the fixed map above.
            }
        }

        return [ $tx, $order ];
    }

    /**
     * Rows for the IDs of a page, in the page's order.
     *
     * @param object[] $rows kind, id
     *
     * @return array[]
     */
    private function hydrate( $rows ) {
        global $wpdb;

        $tx_ids = [];

        foreach ( $rows as $row ) {
            if ( self::KIND_TRANSACTION === $row->kind ) {
                $tx_ids[] = (int) $row->id;
            }
        }

        $transactions = [];

        if ( $tx_ids ) {
            $placeholders = implode( ',', array_fill( 0, count( $tx_ids ), '%d' ) );
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery
            foreach ( (array) $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}wpuf_transaction WHERE id IN ({$placeholders})", $tx_ids ) ) as $transaction ) {
                $transactions[ (int) $transaction->id ] = $transaction;
            }
        }

        $items = [];

        foreach ( $rows as $row ) {
            $id = (int) $row->id;

            if ( self::KIND_TRANSACTION === $row->kind ) {
                if ( isset( $transactions[ $id ] ) ) {
                    $items[] = $this->format_transaction( $transactions[ $id ] );
                }
            } else {
                $item = $this->format_order( $id );

                if ( $item ) {
                    $items[] = $item;
                }
            }
        }

        return $items;
    }

    /**
     * A completed payment row for the app.
     *
     * @param object $row Table row
     *
     * @return array
     */
    private function format_transaction( $row ) {
        return $this->format(
            [
                'kind'             => self::KIND_TRANSACTION,
                'id'               => (int) $row->id,
                'status'           => (string) $row->status,
                'user_id'          => (int) $row->user_id,
                'subtotal'         => '' !== (string) $row->subtotal ? $row->subtotal : $row->cost,
                'discount'         => $row->discount,
                'coupon_id'        => (int) $row->coupon_id,
                'tax'              => $row->tax,
                'cost'             => $row->cost,
                'post_id'          => (int) $row->post_id,
                'pack_id'          => (int) $row->pack_id,
                'payer_first_name' => $row->payer_first_name,
                'payer_last_name'  => $row->payer_last_name,
                'payer_email'      => $row->payer_email,
                'payer_address'    => $this->address( $row->payer_address ),
                'gateway'          => $row->payment_type,
                'transaction_id'   => (string) $row->transaction_id,
                'created'          => $row->created,
            ]
        );
    }

    /**
     * A pending bank payment (wpuf_order post) for the app, read as the
     * classic page reads it (wpuf_get_pending_transactions()).
     *
     * @param int $order_id Order post ID
     *
     * @return array|null
     */
    private function format_order( $order_id ) {
        $info = get_post_meta( $order_id, '_data', true );

        if ( ! is_array( $info ) ) {
            return null;
        }

        $type     = isset( $info['type'] ) ? $info['type'] : '';
        $item     = isset( $info['item_number'] ) ? (int) $info['item_number'] : 0;
        $tax      = ! empty( $info['tax'] ) ? $info['tax'] : 0;
        $price    = isset( $info['price'] ) ? $info['price'] : 0;
        $subtotal = ! empty( $info['subtotal'] ) ? $info['subtotal'] : ( ! empty( $info['cost'] ) ? $info['cost'] : $price );
        $method   = isset( $info['post_data']['wpuf_payment_method'] ) ? $info['post_data']['wpuf_payment_method'] : '';

        return $this->format(
            [
                'kind'             => self::KIND_ORDER,
                'id'               => (int) $order_id,
                'status'           => 'pending',
                'user_id'          => isset( $info['user_info']['id'] ) ? (int) $info['user_info']['id'] : 0,
                'subtotal'         => $subtotal,
                'discount'         => ! empty( $info['discount'] ) ? $info['discount'] : 0,
                'coupon_id'        => ! empty( $info['post_data']['coupon_id'] ) ? absint( $info['post_data']['coupon_id'] ) : 0,
                'tax'              => $tax,
                'cost'             => ! empty( $info['cost'] ) ? floatval( $info['cost'] ) : ( $price ? floatval( $price ) + floatval( $tax ) : $subtotal ),
                'post_id'          => 'post' === $type ? $item : 0,
                'pack_id'          => 'pack' === $type ? $item : 0,
                'payer_first_name' => isset( $info['user_info']['first_name'] ) ? $info['user_info']['first_name'] : '',
                'payer_last_name'  => isset( $info['user_info']['last_name'] ) ? $info['user_info']['last_name'] : '',
                'payer_email'      => isset( $info['user_info']['email'] ) ? $info['user_info']['email'] : '',
                'payer_address'    => [],
                'gateway'          => function_exists( 'wpuf_get_payment_type_label' ) ? wpuf_get_payment_type_label( $method ) : $method,
                'transaction_id'   => '',
                'created'          => isset( $info['date'] ) ? $info['date'] : get_post_field( 'post_date', $order_id ),
            ]
        );
    }

    /**
     * Add what the app shows: formatted money, names, links.
     *
     * @param array $row Raw row
     *
     * @return array
     */
    private function format( $row ) {
        $user = $row['user_id'] ? get_userdata( $row['user_id'] ) : false;

        $row['key']      = $row['kind'] . ':' . $row['id'];
        $row['user']     = $user ? [
            'id'   => (int) $user->ID,
            'name' => $user->display_name,
            'url'  => current_user_can( 'edit_user', $user->ID ) ? admin_url( 'user-edit.php?user_id=' . $user->ID ) : '',
        ] : null;
        $row['payer']    = trim( $row['payer_first_name'] . ' ' . $row['payer_last_name'] );
        $row['coupon']   = $row['coupon_id'] ? [
            'id'   => $row['coupon_id'],
            'code' => get_the_title( $row['coupon_id'] ),
            'url'  => current_user_can( 'edit_post', $row['coupon_id'] ) ? admin_url( 'post.php?post=' . $row['coupon_id'] . '&action=edit' ) : '',
        ] : null;
        $row['post']     = $this->linked_post( $row['post_id'] );
        $row['pack']     = $this->linked_post( $row['pack_id'] );
        $row['amounts']  = [
            'subtotal' => $this->money( $row['subtotal'] ),
            'discount' => (float) $row['discount'] ? $this->money( $row['discount'] ) : '',
            'tax'      => $this->money( $row['tax'] ),
            'cost'     => $this->money( $row['cost'] ),
        ];
        $row['date']     = $row['created'] ? mysql2date( get_option( 'date_format' ), $row['created'] ) : '';

        return $row;
    }

    /**
     * Title and edit link of a post or pack.
     *
     * @param int $post_id Post ID
     *
     * @return array|null
     */
    private function linked_post( $post_id ) {
        if ( ! $post_id ) {
            return null;
        }

        $title = get_the_title( $post_id );

        return [
            'id'    => (int) $post_id,
            'title' => '' !== $title ? html_entity_decode( $title, ENT_QUOTES, 'UTF-8' ) : '#' . $post_id,
            'url'   => current_user_can( 'edit_post', $post_id ) ? admin_url( 'post.php?post=' . $post_id . '&action=edit' ) : '',
        ];
    }

    /**
     * A price as the site shows it, as plain text.
     *
     * @param mixed $amount Amount
     *
     * @return string
     */
    private function money( $amount ) {
        return html_entity_decode( wp_strip_all_tags( wpuf_format_price( (float) $amount ) ), ENT_QUOTES, 'UTF-8' );
    }

    /**
     * The payer address stored with a payment (serialized array; classes
     * are never restored).
     *
     * @param mixed $value Stored value
     *
     * @return array
     */
    private function address( $value ) {
        if ( ! is_string( $value ) || '' === $value || ! is_serialized( $value ) || PHP_VERSION_ID < 70000 ) {
            return [];
        }

        $address = @unserialize( trim( $value ), [ 'allowed_classes' => false ] ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.PHP.DiscouragedPHPFunctions.serialize_unserialize

        if ( ! is_array( $address ) ) {
            return [];
        }

        return array_filter( array_map( 'strval', array_filter( $address, 'is_scalar' ) ) );
    }

    /**
     * Tab counts and totals of completed payments.
     *
     * @since WPUF_SINCE
     *
     * @return array
     */
    public function counts() {
        global $wpdb;

        // phpcs:disable WordPress.DB.DirectDatabaseQuery
        $tx      = $wpdb->get_row( "SELECT COUNT(*) AS rows_all, SUM( status = 'completed' ) AS completed, SUM( CASE WHEN status = 'completed' THEN cost + 0 ELSE 0 END ) AS income, SUM( CASE WHEN status = 'completed' THEN tax + 0 ELSE 0 END ) AS tax FROM {$wpdb->prefix}wpuf_transaction" );
        $pending = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'wpuf_order' AND post_status IN ('publish','pending')" );
        // phpcs:enable

        $tx = is_object( $tx ) ? $tx : (object) [
            'rows_all'  => 0,
            'completed' => 0,
            'income'    => 0,
            'tax'       => 0,
        ];

        return [
            'all'       => (int) $tx->rows_all + $pending,
            'completed' => (int) $tx->completed,
            'pending'   => $pending,
            'income'    => $this->money( $tx->income ),
            'tax'       => $this->money( $tx->tax ),
        ];
    }

    /**
     * Gateways that appear on completed payments, for the filter.
     *
     * @since WPUF_SINCE
     *
     * @return string[]
     */
    public function gateways() {
        global $wpdb;

        $gateways = $wpdb->get_col( "SELECT DISTINCT payment_type FROM {$wpdb->prefix}wpuf_transaction WHERE payment_type <> '' ORDER BY payment_type" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

        if ( ! in_array( self::BANK_LABEL, $gateways, true ) ) {
            $gateways[] = self::BANK_LABEL;
        }

        return array_values( $gateways );
    }

    /**
     * Run an action on rows.
     *
     * @since WPUF_SINCE
     *
     * @param string  $action accept, reject or delete
     * @param array[] $rows   kind, id
     *
     * @return array done, skipped
     */
    public function run( $action, $rows ) {
        $done    = 0;
        $skipped = 0;

        foreach ( (array) $rows as $row ) {
            $kind = isset( $row['kind'] ) ? (string) $row['kind'] : '';
            $id   = isset( $row['id'] ) ? absint( $row['id'] ) : 0;

            $result = $id ? $this->run_one( $action, $kind, $id ) : false;

            if ( true === $result ) {
                ++$done;
            } else {
                ++$skipped;
            }
        }

        return [
            'done'    => $done,
            'skipped' => $skipped,
        ];
    }

    /**
     * One action on one row.
     *
     * @param string $action accept, reject or delete
     * @param string $kind   Row kind
     * @param int    $id     Row ID
     *
     * @return bool
     */
    private function run_one( $action, $kind, $id ) {
        if ( 'delete' === $action ) {
            return self::KIND_TRANSACTION === $kind && $this->delete( $id );
        }

        if ( self::KIND_ORDER !== $kind || 'wpuf_order' !== get_post_type( $id ) ) {
            return false;
        }

        return 'accept' === $action ? $this->accept( $id ) : ( 'reject' === $action ? $this->reject( $id ) : false );
    }

    /**
     * Delete a completed payment row.
     *
     * @param int $id Row ID
     *
     * @return bool
     */
    private function delete( $id ) {
        global $wpdb;

        return (bool) $wpdb->delete( $wpdb->prefix . 'wpuf_transaction', [ 'id' => $id ], [ '%d' ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }

    /**
     * Reject a pending bank payment: as the classic page.
     *
     * @param int $order_id Order post ID
     *
     * @return bool
     */
    private function reject( $order_id ) {
        $info    = get_post_meta( $order_id, '_data', true );
        $gateway = isset( $info['post_data']['wpuf_payment_method'] ) ? sanitize_key( $info['post_data']['wpuf_payment_method'] ) : '';

        // Same hook as the classic page's reject.
        do_action( "wpuf_{$gateway}_bank_order_reject", $order_id );

        return (bool) wp_delete_post( $order_id, true );
    }

    /**
     * Accept a pending bank payment: as the classic single accept (payer
     * address and coupon usage included, which the classic bulk accept
     * skipped). The order ID is the new row's transaction ID, which also
     * keeps Payment::insert_payment() from updating another row.
     *
     * @param int $order_id Order post ID
     *
     * @return bool
     */
    private function accept( $order_id ) {
        $info = get_post_meta( $order_id, '_data', true );

        if ( ! is_array( $info ) || empty( $info['type'] ) ) {
            return false;
        }

        $item = isset( $info['item_number'] ) ? $info['item_number'] : 0;

        $transaction = [
            'user_id'          => isset( $info['user_info']['id'] ) ? $info['user_info']['id'] : 0,
            'status'           => 'completed',
            'subtotal'         => isset( $info['subtotal'] ) ? $info['subtotal'] : 0,
            'discount'         => ! empty( $info['discount'] ) ? $info['discount'] : 0,
            'coupon_id'        => ! empty( $info['post_data']['coupon_id'] ) ? absint( $info['post_data']['coupon_id'] ) : 0,
            'tax'              => isset( $info['tax'] ) ? $info['tax'] : 0,
            'cost'             => isset( $info['price'] ) ? $info['price'] : 0,
            'post_id'          => 'post' === $info['type'] ? $item : 0,
            'pack_id'          => 'pack' === $info['type'] ? $item : 0,
            'payer_first_name' => isset( $info['user_info']['first_name'] ) ? $info['user_info']['first_name'] : '',
            'payer_last_name'  => isset( $info['user_info']['last_name'] ) ? $info['user_info']['last_name'] : '',
            'payer_address'    => wpuf_get_option( 'show_address', 'wpuf_address_options', false ) ? wpuf_get_user_address() : '',
            'payer_email'      => isset( $info['user_info']['email'] ) ? $info['user_info']['email'] : '',
            'payment_type'     => self::BANK_LABEL,
            'transaction_id'   => $order_id,
            'created'          => current_time( 'mysql' ),
        ];

        // Same hook as the classic page's accept.
        do_action( 'wpuf_gateway_bank_order_complete', $transaction, $order_id );

        Payment::insert_payment( $transaction, $order_id );

        if ( $transaction['coupon_id'] ) {
            $used = (int) get_post_meta( $transaction['coupon_id'], '_coupon_used', true );
            update_post_meta( $transaction['coupon_id'], '_coupon_used', $used + 1 );
        }

        wp_delete_post( $order_id, true );

        return true;
    }

    /**
     * Rows per page saved for the user (the classic page's screen option).
     *
     * @since WPUF_SINCE
     *
     * @return int
     */
    public function per_page() {
        $per_page = (int) get_user_option( 'transactions_per_page' );

        return $per_page > 0 ? $per_page : 20;
    }

    /**
     * Save rows per page for the user.
     *
     * @since WPUF_SINCE
     *
     * @param int $per_page Rows per page
     *
     * @return void
     */
    public function save_per_page( $per_page ) {
        $per_page = max( 1, min( 100, absint( $per_page ) ) );

        if ( $per_page !== $this->per_page() ) {
            // Where WordPress keeps the classic page's screen option.
            update_user_meta( get_current_user_id(), 'transactions_per_page', $per_page );
        }
    }
}
