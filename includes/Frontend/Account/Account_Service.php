<?php
/**
 * The account page's data and actions, scoped to the current user
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Frontend\Account;

use WeDevs\Wpuf\Platform\Stores\Stores;
use WP_Error;
use WP_Post;
use WP_Query;
use stdClass;

/**
 * What `templates/account.php` and `dashboard/*.php` compute inline, as
 * methods the REST controller and the classic AJAX actions share. Every
 * method works on `get_current_user_id()`; no user id is accepted from the
 * caller. The section rules (`show_subscriptions`, `show_billing_address`,
 * `enable_payment`, the `wpuf_account_sections` filter, the default tab) are
 * the ones `account.php:62-80` applies, so the React rail and the classic
 * sidebar always list the same sections.
 *
 * @since WPUF_SINCE
 */
class Account_Service {

    /**
     * Sections WPUF renders natively in React; every other slug is served as
     * server HTML through `section_html()`.
     *
     * @since WPUF_SINCE
     */
    const NATIVE = [ 'dashboard', 'edit-profile', 'change-password' ];

    /**
     * Lucide icon per core section (the PHP switch of `account.php:87-113`).
     *
     * @since WPUF_SINCE
     */
    const ICONS = [
        'dashboard'       => 'house',
        'subscription'    => 'badge-dollar-sign',
        'edit-profile'    => 'user-round',
        'change-password' => 'shield-check',
        'billing-address' => 'map-pin',
        'submit-post'     => 'square-pen',
        'invoices'        => 'receipt',
        'message'         => 'message-circle',
    ];

    /**
     * The sections of the account page, in order, with the rules of `account.php`.
     *
     * @since WPUF_SINCE
     *
     * @return array[] slug, label, icon, kind ('native' | 'html'), url, active (default tab)
     */
    public function sections() {
        $default_tab = wpuf_get_option( 'account_page_active_tab', 'wpuf_my_account', 'dashboard' );
        $payments    = 'on' === wpuf_get_option( 'enable_payment', 'wpuf_payment', 'on' );
        $cpts        = $this->allowed_post_types();
        $out         = [];

        foreach ( wpuf_get_account_sections() as $section => $label ) {
            if ( is_array( $label ) ) {
                $section = $label['slug'];
                $label   = $label['label'];
            }

            if ( 'subscription' === $section && ( 'off' === wpuf_get_option( 'show_subscriptions', 'wpuf_my_account', 'on' ) || ! $payments ) ) {
                continue;
            }

            if ( 'billing-address' === $section && ( 'off' === wpuf_get_option( 'show_billing_address', 'wpuf_my_account', 'on' ) || ! $payments ) ) {
                continue;
            }

            $is_posts = in_array( $section, $cpts, true );

            $out[] = [
                'slug'      => (string) $section,
                'label'     => (string) $label,
                'icon'      => isset( self::ICONS[ $section ] ) ? self::ICONS[ $section ] : ( $is_posts ? 'files' : 'file-text' ),
                'kind'      => $this->kind( $section, $is_posts ),
                'post_type' => $is_posts ? $section : '',
                'url'       => add_query_arg( [ 'section' => $section ], $this->page_url() ),
                'active'    => $section === $default_tab,
            ];
        }

        return $out;
    }

    /**
     * How a section is served: native React or the PHP output of its hook.
     * Posts sections fall back to HTML when a third party hooks the posts
     * table, so its columns still print.
     *
     * @since WPUF_SINCE
     *
     * @param string $slug     Section slug
     * @param bool   $is_posts Whether the slug is an enabled post type
     *
     * @return string
     */
    private function kind( $slug, $is_posts ) {
        if ( $is_posts ) {
            $hooked = has_action( 'wpuf_account_posts_top' ) || has_action( 'wpuf_account_posts_head_col' ) || has_action( 'wpuf_account_posts_row_col' ) || has_action( 'wpuf_account_posts_nopost' );

            return $hooked ? 'html' : 'posts';
        }

        if ( 'edit-profile' === $slug && has_filter( 'wpuf_account_edit_profile_content' ) ) {
            return 'html';
        }

        return in_array( $slug, self::NATIVE, true ) ? 'native' : 'html';
    }

    /**
     * Post types with a section on the page (`cp_on_acc_page`).
     *
     * @since WPUF_SINCE
     *
     * @return string[]
     */
    public function allowed_post_types() {
        $types = wpuf_get_option( 'cp_on_acc_page', 'wpuf_my_account', [ 'post' ] );

        return array_values( array_filter( array_map( 'strval', is_array( $types ) ? $types : [ $types ] ) ) );
    }

    /**
     * The account page URL (the current page when the shortcode renders).
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function page_url() {
        $page_id = (int) wpuf_get_option( 'account_page', 'wpuf_my_account', 0 );
        $url     = $page_id ? get_permalink( $page_id ) : get_permalink();

        return $url ? $url : home_url( '/' );
    }

    /**
     * The current user as the profile header and overview show them.
     *
     * @since WPUF_SINCE
     *
     * @return array
     */
    public function profile() {
        $user   = wp_get_current_user();
        $avatar = wpuf_get_user_avatar_data( $user, 96 );
        $roles  = wp_roles()->get_names();
        $role   = ! empty( $user->roles ) ? $user->roles[0] : '';

        $profile = [
            'id'           => (int) $user->ID,
            'username'     => (string) $user->user_login,
            'display_name' => (string) $user->display_name,
            'first_name'   => (string) $user->first_name,
            'last_name'    => (string) $user->last_name,
            'email'        => (string) $user->user_email,
            'website'      => (string) $user->user_url,
            'bio'          => (string) $user->description,
            'role'         => $role,
            'role_label'   => isset( $roles[ $role ] ) ? translate_user_role( $roles[ $role ] ) : ucfirst( $role ),
            'registered'   => (string) $user->user_registered,
            'avatar'       => [
                'url'      => $avatar['url'] ? (string) $avatar['url'] : '',
                'initials' => (string) $avatar['initials'],
            ],
            'edit_url'     => add_query_arg( [ 'section' => 'edit-profile' ], $this->page_url() ),
            'logout_url'   => wp_logout_url( $this->page_url() ),
        ];

        /**
         * Filters the profile data the account page shows for the current user.
         *
         * @since WPUF_SINCE
         *
         * @param array    $profile Profile data
         * @param \WP_User $user    The user
         */
        return apply_filters( 'wpuf_account_profile', $profile, $user );
    }

    /**
     * The overview stats: posts per enabled type, the subscription when
     * payments are on, the billing address when shown. Pro adds its own
     * through the filter.
     *
     * @since WPUF_SINCE
     *
     * @return array
     */
    public function stats() {
        $user_id = get_current_user_id();
        $stats   = [];

        foreach ( $this->allowed_post_types() as $type ) {
            $object = get_post_type_object( $type );

            if ( ! $object ) {
                continue;
            }

            $counts = $this->status_counts( $type, $user_id );

            $stats[] = [
                'id'      => 'posts_' . $type,
                'kind'    => 'posts',
                'label'   => (string) $object->labels->name,
                'value'   => array_sum( $counts ),
                'detail'  => $counts,
                'section' => $type,
            ];
        }

        if ( 'on' === wpuf_get_option( 'enable_payment', 'wpuf_payment', 'on' ) && 'off' !== wpuf_get_option( 'show_subscriptions', 'wpuf_my_account', 'on' ) ) {
            $stats[] = $this->subscription_stat();
        }

        if ( 'on' === wpuf_get_option( 'enable_payment', 'wpuf_payment', 'on' ) && 'off' !== wpuf_get_option( 'show_billing_address', 'wpuf_my_account', 'on' ) ) {
            $address = wpuf_get_user()->get_billing_address( true );

            $stats[] = [
                'id'      => 'billing',
                'kind'    => 'billing',
                'label'   => __( 'Billing Address', 'wp-user-frontend' ),
                'value'   => is_array( $address ) ? array_values( array_filter( array_map( 'strval', $address ) ) ) : [],
                'section' => 'billing-address',
            ];
        }

        /**
         * Filters the stats the account overview shows for the current user.
         *
         * @since WPUF_SINCE
         *
         * @param array $stats   Stats (id, kind, label, value, detail, section)
         * @param int   $user_id The user
         */
        return array_values( (array) apply_filters( 'wpuf_account_stats', $stats, $user_id ) );
    }

    /**
     * The user's current pack as one stat (`dashboard/subscription.php` facts).
     *
     * @since WPUF_SINCE
     *
     * @return array
     */
    private function subscription_stat() {
        $stat = [
            'id'      => 'subscription',
            'kind'    => 'subscription',
            'label'   => __( 'Subscription', 'wp-user-frontend' ),
            'value'   => '',
            'detail'  => [],
            'section' => 'subscription',
        ];

        $wpuf_user = wpuf_get_user();
        $pack_id   = $wpuf_user->subscription()->current_pack_id();

        if ( ! $pack_id ) {
            $stat['value'] = __( 'No pack', 'wp-user-frontend' );

            return $stat;
        }

        $current = $wpuf_user->subscription()->current_pack();
        $pack    = wpuf()->subscription->get_subscription( $pack_id );

        $stat['value']  = $pack ? (string) $pack->post_title : __( 'Unknown pack', 'wp-user-frontend' );
        $stat['detail'] = [
            'status'  => ! is_wp_error( $current ) && isset( $current['status'] ) ? (string) $current['status'] : '',
            'expire'  => ! is_wp_error( $current ) && isset( $current['expire'] ) ? (string) $current['expire'] : '',
            'posts'   => ! is_wp_error( $current ) && isset( $current['posts'] ) && is_array( $current['posts'] ) ? $current['posts'] : [],
            'pack_id' => (int) $pack_id,
        ];

        return $stat;
    }

    /**
     * Status counts of the user's posts of one type (the statuses the posts table lists).
     *
     * @since WPUF_SINCE
     *
     * @param string $type    Post type
     * @param int    $user_id User id
     *
     * @return array status => count
     */
    private function status_counts( $type, $user_id ) {
        global $wpdb;

        $counts = array_fill_keys( [ 'publish', 'pending', 'draft', 'future', 'private' ], 0 );
        $rows   = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT post_status, COUNT(*) AS total FROM {$wpdb->posts} WHERE post_author = %d AND post_type = %s GROUP BY post_status",
                $user_id,
                $type
            )
        );

        foreach ( (array) $rows as $row ) {
            if ( isset( $counts[ $row->post_status ] ) ) {
                $counts[ $row->post_status ] = (int) $row->total;
            }
        }

        return $counts;
    }

    /**
     * One page of the user's posts of a type (the query of `dashboard/posts.php`).
     *
     * @since WPUF_SINCE
     *
     * @param string $type     Post type (must be an enabled section)
     * @param int    $page     Page number
     * @param int    $per_page Items per page (0 = the `per_page` setting)
     *
     * @return array|WP_Error items, total, pages, page, per_page, post_type (label), columns
     */
    public function posts( $type, $page = 1, $per_page = 0 ) {
        $type = sanitize_key( $type );

        if ( ! in_array( $type, $this->allowed_post_types(), true ) || ! post_type_exists( $type ) ) {
            return new WP_Error( 'wpuf_account_unknown_section', __( 'This section is not available.', 'wp-user-frontend' ), [ 'status' => 404 ] );
        }

        $per_page = $per_page > 0 ? min( 100, (int) $per_page ) : (int) wpuf_get_option( 'per_page', 'wpuf_dashboard', 5 );
        $args     = [
            'author'         => get_current_user_id(),
            'post_status'    => [ 'draft', 'future', 'pending', 'publish', 'private' ],
            'post_type'      => $type,
            'posts_per_page' => max( 1, $per_page ),
            'paged'          => max( 1, (int) $page ),
        ];

        /** This filter is documented in templates/dashboard/posts.php */
        $query  = new WP_Query( apply_filters( 'wpuf_dashboard_query', $args ) );
        $object = get_post_type_object( $type );
        $items  = [];

        foreach ( $query->posts as $post ) {
            $items[] = $this->post_row( $post );
        }

        $payments = 'on' === wpuf_get_option( 'enable_payment', 'wpuf_payment', 'on' ) && 'off' !== wpuf_get_option( 'show_payment_column', 'wpuf_dashboard', 'on' );

        return [
            'items'     => $items,
            'total'     => (int) $query->found_posts,
            'pages'     => (int) $query->max_num_pages,
            'page'      => $args['paged'],
            'per_page'  => $args['posts_per_page'],
            'post_type' => [
                'name'     => $type,
                'label'    => (string) $object->labels->name,
                'singular' => (string) $object->labels->singular_name,
            ],
            'columns'   => [
                'thumbnail' => 'on' === wpuf_get_option( 'show_ft_image', 'wpuf_dashboard' ),
                'payment'   => $payments,
            ],
        ];
    }

    /**
     * One row of the posts table.
     *
     * @since WPUF_SINCE
     *
     * @param WP_Post $post Post
     *
     * @return array
     */
    private function post_row( WP_Post $post ) {
        $status      = (string) $post->post_status;
        $viewable    = ! in_array( $status, [ 'draft', 'future', 'pending' ], true );
        $payment     = (string) Stores::submissions()->payment_status( $post->ID );
        $edit_page   = (int) wpuf_get_option( 'edit_page_id', 'wpuf_frontend_posting' );
        // Not wp_nonce_url(): it HTML-escapes the URL (&amp;), which is right in an attribute and wrong in JSON.
        $edit_url    = $edit_page ? add_query_arg(
            [
                'pid'      => $post->ID,
                '_wpnonce' => wp_create_nonce( 'wpuf_edit' ),
            ],
            get_permalink( $edit_page )
        ) : '';
        $can_delete  = (int) $post->post_author === get_current_user_id() || current_user_can( 'delete_others_pages' );
        $pay_url     = '';
        $payment_url = get_permalink( wpuf_get_option( 'payment_page', 'wpuf_payment' ) );

        if ( '' !== $payment && 'completed' !== $payment && $payment_url ) {
            $pay_url = add_query_arg(
                [
                    'action'  => 'wpuf_pay',
                    'type'    => 'post',
                    'post_id' => $post->ID,
                ],
                trailingslashit( $payment_url )
            );
        }

        $thumb = get_the_post_thumbnail_url( $post, wpuf_get_option( 'ft_img_size', 'wpuf_dashboard', 'thumbnail' ) );

        return [
            'id'             => (int) $post->ID,
            'title'          => (string) get_the_title( $post ),
            'status'         => $status,
            'status_label'   => $this->status_label( $status ),
            'date'           => (string) $post->post_date,
            'date_gmt'       => (string) $post->post_date_gmt,
            'permalink'      => $viewable ? (string) get_permalink( $post ) : '',
            'preview_url'    => $viewable ? '' : (string) add_query_arg( 'preview', 'true', get_permalink( $post ) ),
            'edit_url'       => $edit_url,
            'can_delete'     => $can_delete,
            'featured'       => in_array( (int) $post->ID, (array) get_option( 'sticky_posts' ), true ),
            'thumbnail'      => $thumb ? (string) $thumb : '',
            'payment_status' => $payment,
            'pay_url'        => $pay_url,
            'comments'       => (int) $post->comment_count,
        ];
    }

    /**
     * The status label `wpuf_show_post_status()` prints.
     *
     * @since WPUF_SINCE
     *
     * @param string $status Post status
     *
     * @return string
     */
    private function status_label( $status ) {
        $labels = [
            'publish' => __( 'Live', 'wp-user-frontend' ),
            'draft'   => __( 'Offline', 'wp-user-frontend' ),
            'pending' => __( 'Awaiting Approval', 'wp-user-frontend' ),
            'future'  => __( 'Scheduled', 'wp-user-frontend' ),
            'private' => __( 'Private', 'wp-user-frontend' ),
        ];

        return isset( $labels[ $status ] ) ? $labels[ $status ] : $status;
    }

    /**
     * Trash one of the user's posts (the `?action=del` rule of `dashboard/posts.php`).
     *
     * @since WPUF_SINCE
     *
     * @param int $post_id Post id
     *
     * @return true|WP_Error
     */
    public function delete_post( $post_id ) {
        $post = get_post( absint( $post_id ) );

        if ( ! $post instanceof WP_Post || ! in_array( $post->post_type, $this->allowed_post_types(), true ) ) {
            return new WP_Error( 'wpuf_account_post_not_found', __( 'Post not found.', 'wp-user-frontend' ), [ 'status' => 404 ] );
        }

        $is_author = (int) $post->post_author === get_current_user_id();

        if ( ! $is_author && ! current_user_can( 'delete_others_pages' ) ) {
            return new WP_Error( 'wpuf_account_forbidden', __( 'You are not the post author. Cheating huh!', 'wp-user-frontend' ), [ 'status' => 403 ] );
        }

        if ( ! wp_trash_post( $post->ID ) ) {
            return new WP_Error( 'wpuf_account_delete_failed', __( 'The post could not be deleted.', 'wp-user-frontend' ), [ 'status' => 500 ] );
        }

        return true;
    }

    /**
     * The PHP output of one section (`do_action( "wpuf_account_content_{$slug}" )`,
     * with the arguments `account.php:144` passes), for the sections React
     * does not render itself and for every third-party slug.
     *
     * @since WPUF_SINCE
     *
     * @param string $slug    Section slug
     * @param int    $pagenum Page number the section's template may read
     *
     * @return string|WP_Error
     */
    public function section_html( $slug, $pagenum = 1 ) {
        $slug     = sanitize_text_field( $slug );
        $sections = wpuf_get_account_sections();
        $known    = [];

        foreach ( $sections as $section => $label ) {
            $known[] = is_array( $label ) ? $label['slug'] : $section;
        }

        if ( ! in_array( $slug, $known, true ) ) {
            return new WP_Error( 'wpuf_account_unknown_section', __( 'This section is not available.', 'wp-user-frontend' ), [ 'status' => 404 ] );
        }

        // The dashboard templates read the request the way the page would carry it.
        $get             = $_GET; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $_GET['section'] = $slug;
        $_GET['pagenum'] = max( 1, (int) $pagenum );

        ob_start();

        try {
            /** This action is documented in templates/account.php */
            do_action( 'wpuf_account_content_' . $slug, $sections, $slug );
        } finally {
            $html = ob_get_clean();
            $_GET = $get;
        }

        return (string) $html;
    }

    /**
     * Free Edit profile (the body of the old `Frontend_Account::update_profile()`).
     *
     * @since WPUF_SINCE
     *
     * @param array $input first_name, last_name, email, current_password, pass1, pass2 (unslashed)
     *
     * @return true|WP_Error
     */
    public function update_profile( array $input ) {
        $current_user     = wp_get_current_user();
        $first_name       = ! empty( $input['first_name'] ) ? sanitize_text_field( $input['first_name'] ) : '';
        $last_name        = ! empty( $input['last_name'] ) ? sanitize_text_field( $input['last_name'] ) : '';
        $email            = ! empty( $input['email'] ) ? sanitize_text_field( $input['email'] ) : '';
        $current_password = ! empty( $input['current_password'] ) ? sanitize_text_field( $input['current_password'] ) : '';
        $pass1            = ! empty( $input['pass1'] ) ? sanitize_text_field( $input['pass1'] ) : '';
        $pass2            = ! empty( $input['pass2'] ) ? sanitize_text_field( $input['pass2'] ) : '';

        if ( ! $current_user->ID ) {
            return new WP_Error( 'wpuf_account_login', __( 'You must be logged in.', 'wp-user-frontend' ), [ 'status' => 401 ] );
        }

        if ( empty( $first_name ) ) {
            return $this->invalid( 'first_name', __( 'First Name is a required field.', 'wp-user-frontend' ) );
        }

        if ( empty( $last_name ) ) {
            return $this->invalid( 'last_name', __( 'Last Name is a required field.', 'wp-user-frontend' ) );
        }

        if ( empty( $email ) ) {
            return $this->invalid( 'email', __( 'Email is a required field.', 'wp-user-frontend' ) );
        }

        $user             = new stdClass();
        $user->ID         = $current_user->ID;
        $user->first_name = $first_name;
        $user->last_name  = $last_name;

        $email = sanitize_email( $email );

        if ( ! is_email( $email ) ) {
            return $this->invalid( 'email', __( 'Please provide a valid email address.', 'wp-user-frontend' ) );
        }

        if ( email_exists( $email ) && $email !== $current_user->user_email ) {
            return $this->invalid( 'email', __( 'This email address is already registered.', 'wp-user-frontend' ) );
        }

        $user->user_email = $email;

        if ( ! empty( $current_password ) && empty( $pass1 ) && empty( $pass2 ) ) {
            return $this->invalid( 'pass1', __( 'Please fill out all password fields.', 'wp-user-frontend' ) );
        }

        if ( ! empty( $pass1 ) && empty( $current_password ) ) {
            return $this->invalid( 'current_password', __( 'Please enter your current password.', 'wp-user-frontend' ) );
        }

        if ( ! empty( $pass1 ) && empty( $pass2 ) ) {
            return $this->invalid( 'pass2', __( 'Please re-enter your password.', 'wp-user-frontend' ) );
        }

        if ( ( ! empty( $pass1 ) || ! empty( $pass2 ) ) && $pass1 !== $pass2 ) {
            return $this->invalid( 'pass2', __( 'New passwords do not match.', 'wp-user-frontend' ) );
        }

        if ( ! empty( $pass1 ) && ! wp_check_password( $current_password, $current_user->user_pass, $current_user->ID ) ) {
            return $this->invalid( 'current_password', __( 'Your current password is incorrect.', 'wp-user-frontend' ) );
        }

        if ( $pass1 ) {
            $user->user_pass = $pass1;
        }

        $result = wp_update_user( $user );

        if ( is_wp_error( $result ) ) {
            return $this->invalid( 'current_password', __( 'Your current password is incorrect.', 'wp-user-frontend' ) );
        }

        return true;
    }

    /**
     * Change password (the body of the old `Frontend_Account::change_password()`).
     *
     * @since WPUF_SINCE
     *
     * @param array $input current_password, pass1, pass2 (unslashed)
     *
     * @return true|WP_Error
     */
    public function change_password( array $input ) {
        $current_user     = wp_get_current_user();
        $current_password = ! empty( $input['current_password'] ) ? (string) $input['current_password'] : '';
        $pass1            = ! empty( $input['pass1'] ) ? (string) $input['pass1'] : '';
        $pass2            = ! empty( $input['pass2'] ) ? (string) $input['pass2'] : '';

        if ( ! $current_user->ID ) {
            return new WP_Error( 'wpuf_account_login', __( 'You must be logged in.', 'wp-user-frontend' ), [ 'status' => 401 ] );
        }

        if ( empty( $current_password ) ) {
            return $this->invalid( 'current_password', __( 'Please enter your current password.', 'wp-user-frontend' ) );
        }

        if ( empty( $pass1 ) ) {
            return $this->invalid( 'pass1', __( 'Please enter a new password.', 'wp-user-frontend' ) );
        }

        if ( empty( $pass2 ) ) {
            return $this->invalid( 'pass2', __( 'Please confirm your new password.', 'wp-user-frontend' ) );
        }

        if ( $pass1 !== $pass2 ) {
            return $this->invalid( 'pass2', __( 'New passwords do not match.', 'wp-user-frontend' ) );
        }

        if ( ! wp_check_password( $current_password, $current_user->user_pass, $current_user->ID ) ) {
            return $this->invalid( 'current_password', __( 'Your current password is incorrect.', 'wp-user-frontend' ) );
        }

        $result = wp_update_user(
            [
                'ID'        => $current_user->ID,
                'user_pass' => $pass1,
            ]
        );

        if ( is_wp_error( $result ) ) {
            return new WP_Error( 'wpuf_account_password_failed', __( 'Could not update password. Please try again.', 'wp-user-frontend' ), [ 'status' => 500 ] );
        }

        return true;
    }

    /**
     * A validation error that names the field.
     *
     * @since WPUF_SINCE
     *
     * @param string $field   Field name
     * @param string $message Message
     *
     * @return WP_Error
     */
    private function invalid( $field, $message ) {
        return new WP_Error(
            'wpuf_account_invalid',
            $message,
            [
                'status' => 422,
                'field'  => $field,
            ]
        );
    }
}
