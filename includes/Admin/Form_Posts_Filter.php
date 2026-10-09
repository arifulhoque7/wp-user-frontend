<?php
/**
 * Filter the admin posts list by the WPUF form that made the posts
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin;

/**
 * `edit.php?post_type=<type>&wpuf_form=<form id>` lists only the posts
 * submitted through that form (the `_wpuf_form_id` post meta). The forms
 * list's Submissions count links here.
 *
 * @since WPUF_SINCE
 */
class Form_Posts_Filter {

    /**
     * Register the hooks.
     *
     * @since WPUF_SINCE
     */
    public function __construct() {
        add_action( 'pre_get_posts', [ $this, 'filter_by_form' ] );
    }

    /**
     * Add the form meta query to the main admin posts list query.
     *
     * @since WPUF_SINCE
     *
     * @param \WP_Query $query Query.
     *
     * @return void
     */
    public function filter_by_form( $query ) {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only list filter.
        if ( ! is_admin() || ! $query->is_main_query() || empty( $_GET['wpuf_form'] ) ) {
            return;
        }

        global $pagenow;

        if ( 'edit.php' !== $pagenow ) {
            return;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only list filter.
        $form_id = absint( wp_unslash( $_GET['wpuf_form'] ) );

        if ( ! $form_id || 'wpuf_forms' !== get_post_type( $form_id ) ) {
            return;
        }

        $meta_query   = (array) $query->get( 'meta_query' );
        $meta_query[] = [
            'key'   => '_wpuf_form_id',
            'value' => $form_id,
        ];

        $query->set( 'meta_query', $meta_query );
    }
}
