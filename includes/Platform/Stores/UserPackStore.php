<?php
/**
 * User pack store
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Stores;

use WeDevs\Wpuf\Platform\Contracts\DataStore;

/**
 * The subscription pack a user holds and the flags around it, all user meta:
 * `_wpuf_subscription_pack` (the pack array, or 'cancel'), `wpuf_fp_used`
 * (free packs used), `_wpuf_used_trial`, the expiry notice flags.
 *
 * @since WPUF_SINCE
 */
class UserPackStore implements DataStore {

    /**
     * Meta keys.
     */
    const PACK        = '_wpuf_subscription_pack';
    const FREE_USED   = 'wpuf_fp_used';
    const TRIAL_USED  = '_wpuf_used_trial';
    const PRE_NOTICE  = 'wpuf_pre_sub_exp';
    const POST_NOTICE = 'wpuf_post_sub_exp';

    /**
     * Whether a user holds pack data.
     *
     * @since WPUF_SINCE
     *
     * @param int $id User id
     *
     * @return bool
     */
    public function exists( $id ) {
        return '' !== get_user_meta( $id, self::PACK, true );
    }

    /**
     * A user's pack meta as stored (array, 'cancel', or '' when none).
     *
     * @since WPUF_SINCE
     *
     * @param int  $id     User id
     * @param bool $single One value (false: the raw list, as get_user_meta())
     *
     * @return mixed
     */
    public function read( $id, $single = true ) {
        return get_user_meta( $id, self::PACK, $single );
    }

    /**
     * A user's pack meta (DataStore).
     *
     * @since WPUF_SINCE
     *
     * @param int $id User id
     *
     * @return mixed
     */
    public function find( $id ) {
        return $this->read( $id );
    }

    /**
     * Every stored pack: rows of `user_id` and the raw `meta_value`
     * (serialized), as the expiry cron reads them.
     *
     * @since WPUF_SINCE
     *
     * @param array $args Unused
     *
     * @return object[]
     */
    public function query( array $args = [] ) {
        global $wpdb;

        return (array) $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
            $wpdb->prepare(
                "SELECT um.meta_value, um.user_id FROM {$wpdb->usermeta} um LEFT JOIN {$wpdb->users} u ON u.ID = um.user_id WHERE um.meta_key = %s",
                self::PACK
            )
        );
    }

    /**
     * Users holding pack data.
     *
     * @since WPUF_SINCE
     *
     * @param array $args Unused
     *
     * @return int
     */
    public function count( array $args = [] ) {
        return count( $this->query( $args ) );
    }

    /**
     * Store a user's pack meta.
     *
     * @since WPUF_SINCE
     *
     * @param int   $user_id User id
     * @param mixed $pack    Pack array, or 'cancel'
     *
     * @return void
     */
    public function write( $user_id, $pack ) {
        update_user_meta( $user_id, self::PACK, $pack );
    }

    /**
     * Remove a user's pack meta.
     *
     * @since WPUF_SINCE
     *
     * @param int $user_id User id
     *
     * @return bool
     */
    public function delete( $user_id ) {
        return delete_user_meta( $user_id, self::PACK );
    }

    /**
     * The pack id a user holds, false when none.
     *
     * @since WPUF_SINCE
     *
     * @param int $user_id User id
     *
     * @return int|false
     */
    public function pack_id( $user_id ) {
        $pack = $this->read( $user_id );

        return is_array( $pack ) && isset( $pack['pack_id'] ) ? (int) $pack['pack_id'] : false;
    }

    /**
     * Free pack ids a user already used, keyed by id.
     *
     * @since WPUF_SINCE
     *
     * @param int $user_id User id
     *
     * @return array
     */
    public function free_packs_used( $user_id ) {
        $used = get_user_meta( $user_id, self::FREE_USED, true );

        return is_array( $used ) ? $used : [];
    }

    /**
     * Remember a free pack as used.
     *
     * @since WPUF_SINCE
     *
     * @param int $user_id User id
     * @param int $pack_id Pack id
     *
     * @return void
     */
    public function mark_free_pack_used( $user_id, $pack_id ) {
        $used             = $this->free_packs_used( $user_id );
        $used[ $pack_id ] = $pack_id;

        update_user_meta( $user_id, self::FREE_USED, $used );
    }

    /**
     * Whether the user already used a trial.
     *
     * @since WPUF_SINCE
     *
     * @param int $user_id User id
     *
     * @return bool
     */
    public function used_trial( $user_id ) {
        return wpuf_is_checkbox_or_toggle_on( get_user_meta( $user_id, self::TRIAL_USED, true ) );
    }

    /**
     * Clear the "expiry mail sent" flags (a new non-recurring pack).
     *
     * @since WPUF_SINCE
     *
     * @param int $user_id User id
     *
     * @return void
     */
    public function clear_expiry_notices( $user_id ) {
        update_user_meta( $user_id, self::PRE_NOTICE, '' );
        update_user_meta( $user_id, self::POST_NOTICE, '' );
    }
}
