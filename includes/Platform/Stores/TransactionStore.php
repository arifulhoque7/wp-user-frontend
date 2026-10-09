<?php
/**
 * Transactions data store
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Stores;

use WeDevs\Wpuf\Platform\Contracts\DataStore;

/**
 * Rows of the Transactions screen: completed payments (the `wpuf_transaction`
 * table) and pending bank orders (`wpuf_order` posts) as one list. Every SQL
 * of the screen lives here; Platform\Transactions\TransactionService formats
 * the rows and runs the actions.
 *
 * @since WPUF_SINCE
 */
class TransactionStore implements DataStore {

    /**
     * Row kind: a completed payment row.
     */
    const KIND_TRANSACTION = 'transaction';

    /**
     * Row kind: a pending bank order (`wpuf_order` post).
     */
    const KIND_ORDER = 'order';

    /**
     * Status filters.
     */
    const STATUSES = [ 'all', 'completed', 'pending' ];

    /**
     * Sort columns.
     */
    const ORDERBY = [ 'created', 'id' ];

    /**
     * The gateway label of bank payments.
     */
    const BANK_LABEL = 'Bank/Manual';

    /**
     * Whether a payment row exists.
     *
     * @since WPUF_SINCE
     *
     * @param int $id Row ID
     *
     * @return bool
     */
    public function exists( $id ) {
        return null !== $this->read( $id );
    }

    /**
     * A payment row.
     *
     * @since WPUF_SINCE
     *
     * @param int $id Row ID
     *
     * @return object|null
     */
    public function read( $id ) {
        global $wpdb;

        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}wpuf_transaction WHERE id = %d", absint( $id ) ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

        return is_object( $row ) ? $row : null;
    }

    /**
     * A payment row (rows have no model).
     *
     * @since WPUF_SINCE
     *
     * @param int $id Row ID
     *
     * @return object|null
     */
    public function find( $id ) {
        return $this->read( $id );
    }

    /**
     * Payment rows by ID, keyed by ID.
     *
     * @since WPUF_SINCE
     *
     * @param int[] $ids Row IDs
     *
     * @return object[]
     */
    public function read_many( array $ids ) {
        global $wpdb;

        $ids = array_values( array_filter( array_map( 'absint', $ids ) ) );

        if ( ! $ids ) {
            return [];
        }

        $placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
        $rows         = [];

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.DirectDatabaseQuery
        foreach ( (array) $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}wpuf_transaction WHERE id IN ({$placeholders})", $ids ) ) as $row ) {
            $rows[ (int) $row->id ] = $row;
        }

        return $rows;
    }

    /**
     * One page of the list: `kind` + `id` of each row, in list order.
     *
     * @since WPUF_SINCE
     *
     * @param array $args status, search, gateway, from, to, orderby, order, page, per_page
     *
     * @return object[]
     */
    public function query( array $args = [] ) {
        global $wpdb;

        $args  = $this->args( $args );
        $union = $this->union( $args );

        if ( '' === $union ) {
            return [];
        }

        $sort  = 'id' === $args['orderby'] ? 'id' : 'sort_date';
        $order = $args['order'];

        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery -- filter values are prepared in filters(); sort column and order are allowlisted.
        return (array) $wpdb->get_results( $wpdb->prepare( "SELECT kind, id FROM ({$union}) AS wpuf_rows ORDER BY {$sort} {$order}, id {$order} LIMIT %d, %d", $args['offset'], $args['per_page'] ) );
    }

    /**
     * Rows matching the filters (every page).
     *
     * @since WPUF_SINCE
     *
     * @param array $args As query()
     *
     * @return int
     */
    public function count( array $args = [] ) {
        global $wpdb;

        $union = $this->union( $this->args( $args ) );

        if ( '' === $union ) {
            return 0;
        }

        return (int) $wpdb->get_var( "SELECT COUNT(*) FROM ({$union}) AS wpuf_rows" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery -- filter values are prepared in filters().
    }

    /**
     * Totals of the screen's cards and tabs.
     *
     * @since WPUF_SINCE
     *
     * @return array all, completed, pending (ints), income, tax (raw sums)
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
            'income'    => $tx->income,
            'tax'       => $tx->tax,
        ];
    }

    /**
     * Gateways that have payment rows.
     *
     * @since WPUF_SINCE
     *
     * @return string[]
     */
    public function gateways() {
        global $wpdb;

        return (array) $wpdb->get_col( "SELECT DISTINCT payment_type FROM {$wpdb->prefix}wpuf_transaction WHERE payment_type <> '' ORDER BY payment_type" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }

    /**
     * Delete a payment row.
     *
     * @since WPUF_SINCE
     *
     * @param int $id Row ID
     *
     * @return bool
     */
    public function delete( $id ) {
        global $wpdb;

        return (bool) $wpdb->delete( $wpdb->prefix . 'wpuf_transaction', [ 'id' => absint( $id ) ], [ '%d' ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }

    /**
     * Empty the transactions table (Tools > Transactions).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function truncate() {
        global $wpdb;

        $wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}wpuf_transaction" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- the tool empties the plugin's own table.
    }

    /**
     * Defaults and allowlists of the list arguments.
     *
     * @param array $args Raw arguments
     *
     * @return array
     */
    private function args( array $args ) {
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

        $args['status']   = in_array( $args['status'], self::STATUSES, true ) ? $args['status'] : 'all';
        $args['orderby']  = in_array( $args['orderby'], self::ORDERBY, true ) ? $args['orderby'] : 'created';
        $args['order']    = 'asc' === strtolower( (string) $args['order'] ) ? 'ASC' : 'DESC';
        $args['per_page'] = max( 1, min( 100, absint( $args['per_page'] ) ) );
        $args['offset']   = ( max( 1, absint( $args['page'] ) ) - 1 ) * $args['per_page'];

        return $args;
    }

    /**
     * The UNION of payment rows and pending orders for the filters, or '' for none.
     *
     * @param array $args Parsed arguments (see args())
     *
     * @return string
     */
    private function union( array $args ) {
        global $wpdb;

        list( $tx_sql, $order_sql ) = $this->filters( $args );

        $parts = [];

        if ( 'pending' !== $args['status'] ) {
            $parts[] = "SELECT 'transaction' AS kind, id, created AS sort_date FROM {$wpdb->prefix}wpuf_transaction WHERE 1=1 {$tx_sql}" . ( 'completed' === $args['status'] ? " AND status = 'completed'" : '' );
        }

        if ( 'completed' !== $args['status'] && null !== $order_sql ) {
            $parts[] = "SELECT 'order' AS kind, ID AS id, post_date AS sort_date FROM {$wpdb->posts} WHERE post_type = 'wpuf_order' AND post_status IN ('publish','pending') {$order_sql}";
        }

        return $parts ? '(' . implode( ') UNION ALL (', $parts ) . ')' : '';
    }

    /**
     * SQL conditions for the search, gateway and date filters: one for the
     * transaction table, one for orders (null: no order matches).
     *
     * @param array $args Query args
     *
     * @return array [ string, string|null ]
     */
    private function filters( array $args ) {
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
}
