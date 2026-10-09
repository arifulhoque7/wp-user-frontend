<?php
/**
 * Subscription pack store
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Stores;

use Exception;
use WeDevs\Wpuf\Admin\Subscription;
use WeDevs\Wpuf\Platform\Contracts\DataStore;
use WeDevs\Wpuf\Platform\Models\SubscriptionPack;
use WP_Error;
use WP_REST_Request;

/**
 * Writes subscription packs (post + meta) for the React screen (REST) and the
 * classic pack editor. Each path keeps the values and hook order it had, so
 * stored bytes do not change; the writes now live in one place.
 *
 * @since WPUF_SINCE
 */
class SubscriptionStore implements DataStore {

    use QueriesPosts;

    /**
     * Subscription post type
     */
    const POST_TYPE = 'wpuf_subscription';

    /**
     * Whether an id belongs to a subscription pack.
     *
     * @since WPUF_SINCE
     *
     * @param int $id Post id
     *
     * @return bool
     */
    public function is_subscription( $id ) {
        return self::POST_TYPE === get_post_type( absint( $id ) );
    }

    /**
     * Whether the id is a subscription pack (DataStore).
     *
     * @since WPUF_SINCE
     *
     * @param int $id Id
     *
     * @return bool
     */
    public function exists( $id ) {
        return $this->is_subscription( $id );
    }

    /**
     * A pack with its meta as `Admin\Subscription::get_subscription_meta()`
     * returns it (DataStore). Read only.
     *
     * @since WPUF_SINCE
     *
     * @param int $id Pack id
     *
     * @return array|null `post`, `meta`
     */
    public function read( $id ) {
        if ( ! $this->is_subscription( $id ) ) {
            return null;
        }

        $post = get_post( absint( $id ) );

        return [
            'post' => $post,
            'meta' => Subscription::get_subscription_meta( $post->ID, $post ),
        ];
    }

    /**
     * A pack as a model (DataStore).
     *
     * @since WPUF_SINCE
     *
     * @param int $id Pack id
     *
     * @return SubscriptionPack|null
     */
    public function find( $id ) {
        $read = $this->read( $id );

        return null === $read ? null : SubscriptionPack::from_read( $read );
    }

    /**
     * Packs as models (DataStore).
     *
     * @since WPUF_SINCE
     *
     * @param array $args Query args
     *
     * @return SubscriptionPack[]
     */
    public function query( array $args = [] ) {
        return array_values( array_filter( array_map( [ $this, 'find' ], $this->query_ids( self::POST_TYPE, $args ) ) ) );
    }

    /**
     * Number of packs matching the args (DataStore).
     *
     * @since WPUF_SINCE
     *
     * @param array $args Query args
     *
     * @return int
     */
    public function count( array $args = [] ) {
        return $this->count_posts( self::POST_TYPE, $args );
    }

    /**
     * Keep only term ids from a submitted list, leaving each id's type as sent
     * so stored values keep the shape the screen has always written.
     *
     * @since WPUF_SINCE
     *
     * @param mixed $ids Submitted ids
     *
     * @return array
     */
    public function sanitize_term_ids( $ids ) {
        if ( ! is_array( $ids ) ) {
            return [];
        }

        return array_values(
            array_filter(
                $ids,
                function ( $id ) {
                    return ( is_int( $id ) || is_string( $id ) ) && (string) absint( $id ) === (string) $id && absint( $id ) > 0;
                }
            )
        );
    }

    /**
     * Create or update a pack from the React screen's `subscription` payload.
     * The caller has checked the id (an existing pack) and the name (no `#`).
     *
     * @since WPUF_SINCE
     *
     * @param array           $subscription Payload (`ID`, post fields, `meta_value`)
     * @param WP_REST_Request $request      Request, handed to the hooks (term ids
     *                                      in it are sanitized for listeners)
     *
     * @return int|WP_Error Pack id; `wpuf_subscription_not_saved` when the post
     *                      could not be written, `wpuf_subscription_error` when a
     *                      listener threw
     */
    public function save_from_rest( $subscription, WP_REST_Request $request ) {
        $id     = ! empty( $subscription['ID'] ) ? (int) $subscription['ID'] : 0;
        $is_new = empty( $id );
        $name   = ! empty( $subscription['post_title'] ) ? sanitize_text_field( $subscription['post_title'] ) : '';
        $values = $this->rest_values( $subscription );

        try {
            $current_time = wpuf_current_datetime();

            $post_arr = [
                'post_type'         => self::POST_TYPE,
                'post_date'         => $values['date'],
                'post_date_gmt'     => get_gmt_from_date( $values['date'] ),
                'post_content'      => $values['post_content'],
                'post_title'        => $name,
                'post_status'       => $values['status'],
                'post_modified'     => $current_time->format( 'Y-m-d H:i:s' ),
                'post_modified_gmt' => get_gmt_from_date( $current_time->format( 'Y-m-d H:i:s' ) ),
            ];

            if ( ! empty( $id ) ) {
                $post_arr['ID'] = $id;
            }

            $id = wp_insert_post( $post_arr );

            if ( empty( $id ) || is_wp_error( $id ) ) {
                return new WP_Error( 'wpuf_subscription_not_saved', __( 'Failed to insert post', 'wp-user-frontend' ) );
            }

            // Fired once, with the saved pack id (a new pack has no id before
            // the insert), before the pack meta is written.
            do_action( 'wpuf_before_update_subscription_pack', $id, $request, $post_arr );

            // Listeners (pro taxonomy restriction) read the term ids from the
            // request, so hand them the filtered lists.
            $request_subscription = $request->get_param( 'subscription' );

            foreach ( [ '_sub_allowed_term_ids', '_sub_view_allowed_term_ids' ] as $term_key ) {
                if ( isset( $request_subscription['meta_value'][ $term_key ] ) ) {
                    $request_subscription['meta_value'][ $term_key ] = $this->sanitize_term_ids( $request_subscription['meta_value'][ $term_key ] );
                }
            }

            // The pack GET returns an empty posting restriction for every pack; on an
            // existing pack an empty list that was never stored stays absent on save
            // (untouched save = no change). A new pack stores the empty list like
            // develop's REST save did (G2, task 4.1b).
            if (
                ! $is_new
                && isset( $request_subscription['meta_value'] )
                && array_key_exists( '_sub_allowed_term_ids', (array) $request_subscription['meta_value'] )
                && empty( $request_subscription['meta_value']['_sub_allowed_term_ids'] )
                && ! metadata_exists( 'post', $id, '_sub_allowed_term_ids' )
            ) {
                unset( $request_subscription['meta_value']['_sub_allowed_term_ids'] );
            }

            $request->set_param( 'subscription', $request_subscription );

            do_action( 'wpuf_before_update_subscription_pack_meta', $id, $request );

            foreach ( $values['meta'] as $meta_key => $meta_value ) {
                update_post_meta( $id, $meta_key, $meta_value );
            }

            do_action( 'wpuf_after_update_subscription_pack_meta', $id, $request );

            // The classic pack screen fired this after saving; listeners (pro
            // postnum rollback) read the classic field names.
            $pack_data = [];
            foreach ( (array) ( isset( $subscription['meta_value'] ) ? $subscription['meta_value'] : [] ) as $meta_key => $meta_value ) {
                $pack_data[ ltrim( $meta_key, '_' ) ] = $meta_value;
            }
            $pack_data['post_title']                 = $name;
            $pack_data['postnum_rollback_on_delete'] = $values['meta']['postnum_rollback_on_delete'];

            do_action( 'wpuf_update_subscription_pack', $id, $pack_data );

            // A pack with view restrictions turns the global restriction on.
            if ( ! empty( $values['meta']['_sub_view_allowed_term_ids'] ) ) {
                update_option( 'wpuf_taxonomy_view_restrictions_enabled', 'yes' );
            }

            return $id;
        } catch ( Exception $e ) {
            return new WP_Error( 'wpuf_subscription_error', $e->getMessage() );
        }
    }

    /**
     * Change one post field of a pack from the list screens (status toggle).
     * Only fields and values allowed by `wpuf_subscription_single_row_fields`.
     *
     * @since WPUF_SINCE
     *
     * @param int             $id      Pack id (an existing pack)
     * @param string          $row     Post field
     * @param string          $value   New value
     * @param WP_REST_Request $request Request, handed to the hooks
     *
     * @return true|WP_Error `wpuf_subscription_field_not_editable` (status 400)
     *                       or `wpuf_subscription_not_updated`
     */
    public function update_single_row( $id, $row, $value, WP_REST_Request $request ) {
        /**
         * Post fields a single-row subscription edit may change, with the
         * values each accepts. The list screens only toggle the status.
         *
         * @since WPUF_SINCE
         *
         * @param array $fields Field name => allowed values.
         */
        $editable = (array) apply_filters(
            'wpuf_subscription_single_row_fields',
            [
                'post_status' => [ 'publish', 'draft', 'pending', 'private', 'trash' ],
            ]
        );

        if ( ! isset( $editable[ $row ] ) || ! in_array( $value, (array) $editable[ $row ], true ) ) {
            return new WP_Error( 'wpuf_subscription_field_not_editable', __( 'Failed to update', 'wp-user-frontend' ), [ 'status' => 400 ] );
        }

        do_action( 'wpuf_before_update_subscription_single_row', $id, $request );
        $result = wp_update_post(
            [
                'ID' => $id,
                $row => $value,
            ]
        );
        do_action( 'wpuf_after_update_subscription_single_row', $id, $request );

        if ( empty( $result ) || is_wp_error( $result ) ) {
            return new WP_Error( 'wpuf_subscription_not_updated', __( 'Failed to update subscription', 'wp-user-frontend' ) );
        }

        return true;
    }

    /**
     * Packs as `Admin\Subscription::get_subscriptions()` lists them: posts
     * ordered by `_sort_order` with their meta in `meta_value`; a pack
     * without a sort order gets 1 stored on the way.
     *
     * @since WPUF_SINCE
     *
     * @param array $args get_posts() arguments on top of the defaults
     *
     * @return \WP_Post[]
     */
    public function ordered( array $args = [] ) {
        $posts = get_posts(
            wp_parse_args(
                $args,
                [
                    'post_type'      => 'wpuf_subscription',
                    'posts_per_page' => -1,
                    'post_status'    => 'publish',
                    'meta_key'       => '_sort_order', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- the packs' order, as before.
                    'orderby'        => 'meta_value_num',
                    'order'          => 'ASC',
                ]
            )
        );

        foreach ( $posts as $post ) {
            $post->meta_value = Subscription::get_subscription_meta( $post->ID, $posts );

            if ( empty( $post->meta_value['_sort_order'] ) ) {
                update_post_meta( $post->ID, '_sort_order', 1 );
                $post->meta_value['_sort_order'] = 1;
            }
        }

        return $posts;
    }

    /**
     * Packs per post status (auto-drafts left out) plus `all` (trash left out).
     *
     * @since WPUF_SINCE
     *
     * @return array status => count
     */
    public function counts_by_status() {
        global $wpdb;

        $rows   = $wpdb->get_results( $wpdb->prepare( "SELECT post_status, COUNT(*) AS count FROM {$wpdb->posts} WHERE post_type = %s AND post_status != %s GROUP BY post_status", 'wpuf_subscription', 'auto-draft' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        $status = [];
        $total  = 0;

        foreach ( (array) $rows as $row ) {
            $status[ $row->post_status ] = (int) $row->count;
            $total                      += (int) $row->count;
        }

        $status['all'] = empty( $status['trash'] ) ? $total : $total - $status['trash'];

        return $status;
    }

    /**
     * Packs of one status, or every pack ('all'), as the pack class counted them.
     *
     * @since WPUF_SINCE
     *
     * @param string $status Post status or 'all'
     *
     * @return int
     */
    public function count_status( $status = 'all' ) {
        global $wpdb;

        if ( 'all' === $status ) {
            return (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'wpuf_subscription'" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
        }

        return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'wpuf_subscription' AND post_status = %s", $status ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
    }

    /**
     * Delete a pack for good.
     *
     * @since WPUF_SINCE
     *
     * @param int $id Pack id
     *
     * @return bool Whether it was deleted (false for a post that is not a pack)
     */
    public function delete( $id ) {
        if ( ! $this->is_subscription( $id ) ) {
            return false;
        }

        return (bool) wp_delete_post( $id, true );
    }

    /**
     * Delete every pack for good, any status, trash included (Tools > Delete Forms).
     *
     * @since WPUF_SINCE
     *
     * @return int Packs deleted
     */
    public function delete_all() {
        $deleted = 0;

        foreach ( $this->query_ids( 'wpuf_subscription', [ 'status' => [ 'publish', 'draft', 'pending', 'trash' ] ] ) as $id ) {
            if ( wp_delete_post( $id, true ) ) {
                $deleted++;
            }
        }

        return $deleted;
    }

    /**
     * Give every pack without a usable `_sort_order` (missing, empty or <= 0)
     * the default order 1 (the one-off migration Admin_Subscription runs).
     *
     * @since WPUF_SINCE
     *
     * @return int Packs updated
     */
    public function set_default_sort_order() {
        $ids = get_posts(
            [
                'post_type'      => 'wpuf_subscription',
                'posts_per_page' => -1,
                'post_status'    => [ 'publish', 'draft', 'private' ],
                'fields'         => 'ids',
                'meta_query'     => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- one-off migration.
                    'relation' => 'OR',
                    [
                        'key'     => '_sort_order',
                        'compare' => 'NOT EXISTS',
                    ],
                    [
                        'key'     => '_sort_order',
                        'value'   => '',
                        'compare' => '=',
                    ],
                    [
                        'key'     => '_sort_order',
                        'value'   => 0,
                        'compare' => '<=',
                    ],
                ],
            ]
        );

        foreach ( $ids as $id ) {
            update_post_meta( $id, '_sort_order', 1 );
        }

        return count( $ids );
    }

    /**
     * Save the classic pack editor's fields (already unslashed `$_POST`). The
     * caller has checked the nonce and the capability.
     *
     * @since WPUF_SINCE
     *
     * @param int   $subscription_id Pack id
     * @param array $post_data       Submitted fields
     *
     * @return void
     */
    public function save_from_classic( $subscription_id, $post_data ) {
        foreach ( $this->classic_values( $post_data ) as $meta_key => $meta_value ) {
            update_post_meta( $subscription_id, $meta_key, $meta_value );
        }

        do_action( 'wpuf_update_subscription_pack', $subscription_id, $post_data );
    }

    /**
     * Post fields and meta (in write order) the REST save stores.
     *
     * @param array $subscription Payload
     *
     * @return array { date, post_content, status, meta }
     */
    private function rest_values( $subscription ) {
        $meta_value = isset( $subscription['meta_value'] ) && is_array( $subscription['meta_value'] ) ? $subscription['meta_value'] : [];
        $text       = function ( $key, $fallback ) use ( $meta_value ) {
            return ! empty( $meta_value[ $key ] ) ? sanitize_text_field( $meta_value[ $key ] ) : $fallback;
        };
        $number     = function ( $key, $fallback ) use ( $meta_value ) {
            return ! empty( $meta_value[ $key ] ) ? (int) $meta_value[ $key ] : $fallback;
        };
        $texts      = function ( $key ) use ( $meta_value ) {
            return ! empty( $meta_value[ $key ] ) ? array_map( 'sanitize_text_field', $meta_value[ $key ] ) : '';
        };

        $recurring_pay          = $text( '_recurring_pay', 'no' );
        $cycle_period           = $text( '_cycle_period', '' );
        $post_expiration_number = $number( '_post_expiration_number', '' );
        $post_expiration_period = $text( '_post_expiration_period', '' );
        $sort_order             = $number( '_sort_order', 1 );

        if ( $sort_order < 1 ) {
            $sort_order = 1;
        }

        if ( 'no' !== $recurring_pay && empty( $cycle_period ) ) {
            $cycle_period = 'day';
        }

        return [
            'status'       => ! empty( $subscription['post_status'] ) ? sanitize_text_field( $subscription['post_status'] ) : 'publish',
            'date'         => ! empty( $subscription['post_date'] ) ? sanitize_text_field( $subscription['post_date'] ) : '',
            'post_content' => ! empty( $subscription['post_content'] ) ? sanitize_textarea_field( $subscription['post_content'] ) : '',
            'meta'         => [
                '_billing_amount'            => ! empty( $meta_value['_billing_amount'] ) ? floatval( $meta_value['_billing_amount'] ) : 0,
                '_expiration_number'         => $number( '_expiration_number', 0 ),
                '_expiration_period'         => $text( '_expiration_period', 'day' ),
                '_recurring_pay'             => $recurring_pay,
                '_billing_cycle_number'      => $number( '_billing_cycle_number', 0 ),
                '_cycle_period'              => $cycle_period,
                '_enable_billing_limit'      => $text( '_enable_billing_limit', '' ),
                '_billing_limit'             => $text( '_billing_limit', '' ),
                '_trial_status'              => $text( '_trial_status', 'no' ),
                '_trial_duration'            => $number( '_trial_duration', 0 ),
                '_trial_duration_type'       => $text( '_trial_duration_type', 0 ),
                '_post_type_name'            => $texts( '_post_type_name' ),
                'additional_cpt_options'     => $texts( 'additional_cpt_options' ),
                '_enable_post_expiration'    => $text( '_enable_post_expiration', 'no' ),
                '_post_expiration_number'    => $post_expiration_number,
                '_post_expiration_period'    => $post_expiration_period,
                // Readers (User_Subscription, the pack details) use the strtotime()
                // duration the classic editor stored, e.g. "7 day". The screen's
                // "no expiry" values (-1, unit "forever") store '' like the classic
                // editor does, not "-1 day" (expired at once if expiration is enabled).
                '_post_expiration_time'      => ( $post_expiration_number > 0 && $post_expiration_period && 'forever' !== $post_expiration_period ) ? $post_expiration_number . ' ' . $post_expiration_period : '',
                '_expired_post_status'       => $text( '_expired_post_status', 'draft' ),
                '_enable_mail_after_expired' => $text( '_enable_mail_after_expired', 'no' ),
                '_post_expiration_message'   => ! empty( $meta_value['_post_expiration_message'] ) ? wp_kses_post( $meta_value['_post_expiration_message'] ) : '',
                '_total_feature_item'        => $number( '_total_feature_item', 0 ),
                '_remove_feature_item'       => $text( '_remove_feature_item', '' ),
                '_sort_order'                => $sort_order,
                '_sub_view_allowed_term_ids' => ! empty( $meta_value['_sub_view_allowed_term_ids'] ) ? $this->sanitize_term_ids( $meta_value['_sub_view_allowed_term_ids'] ) : [],
                'postnum_rollback_on_delete' => $text( 'postnum_rollback_on_delete', '' ),
            ],
        ];
    }

    /**
     * Meta (in write order) the classic pack editor stores.
     *
     * @param array $post_data Submitted fields (unslashed)
     *
     * @return array
     */
    private function classic_values( $post_data ) {
        $expiration_time    = '';
        $enable_post_expir  = '';
        $expire_post_status = '';
        $post_expire_msg    = '';
        $settings           = isset( $post_data['post_expiration_settings'] ) ? $post_data['post_expiration_settings'] : null;
        $field              = function ( $key, $fallback ) use ( $post_data ) {
            return ! empty( $post_data[ $key ] ) ? sanitize_text_field( wp_unslash( $post_data[ $key ] ) ) : $fallback;
        };
        // Missing lists stored '' (array_map() on null); PHP 8 threw instead.
        $texts = function ( $key ) use ( $post_data ) {
            return isset( $post_data[ $key ] ) ? array_map( 'sanitize_text_field', (array) $post_data[ $key ] ) : '';
        };

        if ( isset( $settings ) ) {
            if ( isset( $settings['expiration_time_value'], $settings['expiration_time_type'] ) ) {
                // Stored as a strtotime()-readable duration, e.g. "7 day". The separator must be a
                // single space; anything else makes strtotime() fail and the post expire immediately.
                $expiration_time = sanitize_text_field( wp_unslash( $settings['expiration_time_value'] ) ) . ' ' . sanitize_text_field( wp_unslash( $settings['expiration_time_type'] ) );
            }

            if ( isset( $settings['enable_post_expiration'] ) ) {
                $enable_post_expir = sanitize_text_field( wp_unslash( $settings['enable_post_expiration'] ) );
            }

            if ( isset( $settings['expired_post_status'] ) ) {
                $expire_post_status = sanitize_text_field( wp_unslash( $settings['expired_post_status'] ) );
            }

            if ( isset( $settings['post_expiration_message'] ) ) {
                $post_expire_msg = sanitize_text_field( wp_unslash( $settings['post_expiration_message'] ) );
            }
        }

        $expiration_parts = explode( ' ', $expiration_time );
        $sort_order       = isset( $post_data['sort_order'] ) ? absint( $post_data['sort_order'] ) : 1;

        if ( $sort_order < 1 ) {
            $sort_order = 1;
        }

        return [
            // Prices keep their decimals, like the REST save.
            '_billing_amount'            => isset( $post_data['billing_amount'] ) ? floatval( $post_data['billing_amount'] ) : 0,
            '_expiration_number'         => ! empty( $post_data['expiration_number'] ) ? absint( $post_data['expiration_number'] ) : '',
            '_expiration_period'         => sanitize_text_field( wp_unslash( isset( $post_data['expiration_period'] ) ? $post_data['expiration_period'] : '' ) ),
            '_recurring_pay'             => isset( $post_data['recurring_pay'] ) ? sanitize_text_field( wp_unslash( $post_data['recurring_pay'] ) ) : 'no',
            '_billing_cycle_number'      => $field( 'billing_cycle_number', 0 ),
            '_cycle_period'              => $field( 'cycle_period', '' ),
            '_billing_limit'             => $field( 'billing_limit', '' ),
            '_trial_status'              => isset( $post_data['trial_status'] ) ? sanitize_text_field( wp_unslash( $post_data['trial_status'] ) ) : 'no',
            '_trial_duration'            => $field( 'trial_duration', '' ),
            '_trial_duration_type'       => $field( 'trial_duration_type', '' ),
            '_post_type_name'            => $texts( 'post_type_name' ),
            'additional_cpt_options'     => $texts( 'additional_cpt_options' ),
            '_enable_post_expiration'    => $enable_post_expir,
            '_post_expiration_time'      => $expiration_time,
            // Same number/period keys the REST save writes.
            '_post_expiration_number'    => isset( $expiration_parts[1] ) ? (int) $expiration_parts[0] : '',
            '_post_expiration_period'    => isset( $expiration_parts[1] ) ? $expiration_parts[1] : '',
            '_sort_order'                => $sort_order,
            '_expired_post_status'       => $expire_post_status,
            '_enable_mail_after_expired' => isset( $settings['enable_mail_after_expired'] ) ? $settings['enable_mail_after_expired'] : '',
            '_post_expiration_message'   => $post_expire_msg,
            '_total_feature_item'        => isset( $post_data['total_feature_item'] ) ? sanitize_text_field( wp_unslash( $post_data['total_feature_item'] ) ) : '',
            '_remove_feature_item'       => isset( $post_data['remove_feature_item'] ) ? sanitize_text_field( wp_unslash( $post_data['remove_feature_item'] ) ) : '',
        ];
    }
}
