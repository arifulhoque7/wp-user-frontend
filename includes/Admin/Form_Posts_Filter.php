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
        add_action( 'admin_notices', [ $this, 'filter_notice' ] );
        add_action( 'restrict_manage_posts', [ $this, 'keep_filter_field' ] );
    }

    /**
     * The form the posts list is filtered by, when the request asks for one.
     *
     * @since WPUF_SINCE
     *
     * @return int Form ID, or 0.
     */
    protected function requested_form() {
        global $pagenow;

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only list filter.
        if ( 'edit.php' !== $pagenow || empty( $_GET['wpuf_form'] ) ) {
            return 0;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only list filter.
        $form_id = absint( wp_unslash( $_GET['wpuf_form'] ) );

        return $form_id && 'wpuf_forms' === get_post_type( $form_id ) ? $form_id : 0;
    }

    /**
     * Say above the list that it shows one form's submissions, with a way back
     * to every post (WordPress's own views and title don't show the filter).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function filter_notice() {
        $form_id = $this->requested_form();

        if ( ! $form_id ) {
            return;
        }

        $post_type = isset( $GLOBALS['typenow'] ) && $GLOBALS['typenow'] ? $GLOBALS['typenow'] : 'post';
        $all_url   = admin_url( 'edit.php?post_type=' . rawurlencode( $post_type ) );
        $can_edit  = current_user_can( wpuf_admin_role() );
        $title     = $can_edit ? get_the_title( $form_id ) : '';
        ?>
        <div class="notice notice-info wpuf-form-posts-filter">
            <p>
                <?php
                if ( '' !== $title ) {
                    /* translators: %s: form name */
                    echo esc_html( sprintf( __( 'Showing only the posts submitted through the form "%s".', 'wp-user-frontend' ), $title ) );
                } else {
                    esc_html_e( 'Showing only the posts submitted through one form.', 'wp-user-frontend' );
                }
                ?>
                <a href="<?php echo esc_url( $all_url ); ?>"><?php esc_html_e( 'Show all posts', 'wp-user-frontend' ); ?></a>
            </p>
        </div>
        <?php
    }

    /**
     * Keep the filter when the list's own filter / search form is submitted.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function keep_filter_field() {
        $form_id = $this->requested_form();

        if ( $form_id ) {
            echo '<input type="hidden" name="wpuf_form" value="' . esc_attr( $form_id ) . '">';
        }
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
        if ( ! is_admin() || ! $query->is_main_query() ) {
            return;
        }

        $form_id = $this->requested_form();

        if ( ! $form_id ) {
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
