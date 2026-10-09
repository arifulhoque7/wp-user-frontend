<?php
/**
 * Pack admin screen
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\Subscriptions;

use WeDevs\Wpuf\Admin\Admin_Subscription;
use WeDevs\Wpuf\Admin\BootPayload;
use WeDevs\Wpuf\Frontend\Payment;
use WeDevs\Wpuf\Platform\Stores\Stores;

/**
 * The subscription packs in wp-admin: the CPT list columns, the classic pack
 * metaboxes, the update messages, the React screen's scripts and boot data,
 * notices, help link, footer text and the one-off sort order migration
 * (through the subscription store).
 *
 * @since WPUF_SINCE Moved out of Admin_Subscription, which keeps the hooks and delegates.
 */
class Pack_Screen {

    /**
     * The facade: callbacks and methods of the other groups go through it.
     *
     * @var Admin_Subscription
     */
    protected $admin;

    /**
     * @since WPUF_SINCE
     *
     * @param Admin_Subscription $admin The facade.
     */
    public function __construct( Admin_Subscription $admin ) {
        $this->admin = $admin;
    }

    /**
     * Subscription column headings
     *
     * @param array $head
     *
     * @return array
     */
    public function subscription_columns_head( $head ) {
        unset( $head['date'] );
        $head['title']       = __( 'Pack Name', 'wp-user-frontend' );
        $head['amount']      = __( 'Amount', 'wp-user-frontend' );
        $head['subscribers'] = __( 'Subscribers', 'wp-user-frontend' );
        $head['recurring']   = __( 'Recurring', 'wp-user-frontend' );
        $head['duration']    = __( 'Duration', 'wp-user-frontend' );

        return $head;
    }

    /**
     * Susbcription lists column content
     *
     * @param string $column_name
     * @param int    $post_ID
     *
     * @return void
     */
    public function subscription_columns_content( $column_name, $post_ID ) {
        $meta = $this->pack_meta( $post_ID );

        switch ( $column_name ) {
            case 'amount':
                $amount = ( isset( $meta['_billing_amount'] ) ? $meta['_billing_amount'] : '' );

                if ( intval( $amount ) == 0 ) {
                    $amount = __( 'Free', 'wp-user-frontend' );
                } else {
                    $amount = wpuf_format_price( $amount );
                }
                echo esc_html( $amount );
                break;

            case 'subscribers':
                $users = wpuf()->subscription->subscription_pack_users( $post_ID );

                echo wp_kses_post( '<a href="' . admin_url( 'edit.php?post_type=wpuf_subscription&page=wpuf_subscribers&post_ID=' . $post_ID ) . '" />' . count( $users ) . '</a>' );
                break;

            case 'recurring':
                $recurring = ( isset( $meta['_recurring_pay'] ) ? $meta['_recurring_pay'] : '' );

                if ( wpuf_is_option_on( $recurring ) ) {
                    esc_html_e( 'Yes', 'wp-user-frontend' );
                } else {
                    esc_html_e( 'No', 'wp-user-frontend' );
                }
                break;

            case 'duration':
                $recurring_pay = ( isset( $meta['_recurring_pay'] ) ? $meta['_recurring_pay'] : '' );
                $billing_cycle_number = ( isset( $meta['_billing_cycle_number'] ) ? $meta['_billing_cycle_number'] : '' );
                $cycle_period = ( isset( $meta['_cycle_period'] ) ? $meta['_cycle_period'] : '' );

                if ( wpuf_is_option_on( $recurring_pay ) ) {
                    echo esc_attr( $billing_cycle_number . ' ' . $cycle_period ) . '\'s (cycle)';
                } else {
                    $expiration_number = ( isset( $meta['_expiration_number'] ) ? $meta['_expiration_number'] : '' );
                    $expiration_period = ( isset( $meta['_expiration_period'] ) ? $meta['_expiration_period'] : '' );
                    echo esc_attr( $expiration_number . ' ' . $expiration_period ) . '\'s';
                }
                break;
        }
    }

    /**
     * Custom post update message
     *
     * @param array $messages
     *
     * @return array
     */
    public function form_updated_message( $messages ) {
        $message = [
            0  => '',
            1  => __( 'Subscription pack updated.', 'wp-user-frontend' ),
            2  => __( 'Custom field updated.', 'wp-user-frontend' ),
            3  => __( 'Custom field deleted.', 'wp-user-frontend' ),
            4  => __( 'Subscription pack updated.', 'wp-user-frontend' ),
            5  => isset( $_GET['revision'] ) ? sprintf(
                // translators: %s is Revision
                __( 'Subscription pack restored to revision from %s', 'wp-user-frontend' ),
                wp_post_revision_title(
                    (int) $_GET['revision'],
                    false
                )
            ) : false,
            6  => __( 'Subscription pack published.', 'wp-user-frontend' ),
            7  => __( 'Subscription pack saved.', 'wp-user-frontend' ),
            8  => __( 'Subscription pack submitted.', 'wp-user-frontend' ),
            9  => '',
            10 => __( 'Subscription pack draft updated.', 'wp-user-frontend' ),
        ];

        $messages['wpuf_subscription'] = $message;

        return $messages;
    }

    /**
     * Add settings metaboxes
     */
    public function add_meta_boxes() {
        add_meta_box( 'wpuf-metabox-subscription', __( 'Pack Description', 'wp-user-frontend' ), [ $this->admin, 'pack_description_metabox' ], 'wpuf_subscription', 'normal', 'high' );
        add_meta_box( 'wpuf_subs_metabox', 'Subscription Options', [ $this->admin, 'subs_meta_box' ], 'wpuf_subscription' );
    }

    /**
     * Subscription settings metabox
     *
     * @return void
     */
    public function subs_meta_box() {
        global $post;

        $sub_meta = wpuf()->subscription->get_subscription_meta( $post->ID, $post );

        $hidden_recurring_class = ! wpuf_is_option_on( $sub_meta['_recurring_pay'] ) ? 'none' : '';
        $hidden_trial_class     = ! wpuf_is_option_on( $sub_meta['_trial_status'] ) ? 'none' : '';
        $hidden_expire          = ! wpuf_is_option_on( $sub_meta['_recurring_pay'] ) ? 'none' : '';
        $is_post_exp_selected   = isset( $sub_meta['_enable_post_expiration'] ) && wpuf_is_option_on( $sub_meta['_enable_post_expiration'] ) ? 'checked' : '';
        $_post_expiration_time  = explode( ' ', isset( $sub_meta['_post_expiration_time'] ) ? $sub_meta['_post_expiration_time'] : ' ' );
        $time_value             = isset( $_post_expiration_time[0] ) ? $_post_expiration_time[0] : 1;
        $time_type              = isset( $_post_expiration_time[1] ) ? $_post_expiration_time[1] : 'day';

        $expired_post_status          = isset( $sub_meta['_expired_post_status'] ) ? $sub_meta['_expired_post_status'] : '';
        $is_enable_mail_after_expired = isset( $sub_meta['_enable_mail_after_expired'] ) && wpuf_is_option_on( $sub_meta['_enable_mail_after_expired'] ) ? 'checked' : '';
        $post_expiration_message      = isset( $sub_meta['_post_expiration_message'] ) ? $sub_meta['_post_expiration_message'] : '';
        $featured_item                = ! empty( $sub_meta['_total_feature_item'] ) ? $sub_meta['_total_feature_item'] : 0;
        $remove_featured_item         = ! empty( $sub_meta['_remove_feature_item'] ) ? $sub_meta['_remove_feature_item'] : 0;
        $billing_amount               = ! empty( $sub_meta['billing_amount'] ) ? esc_attr( $sub_meta['billing_amount'] ) : 0;
        ?>

        <div class="wpuf-subscription-pack-settings">
            <nav class="subscription-nav-tab">
                <ul>
                    <li class="tab-current">
                        <a href="#wpuf-payment-settings">
                            <span class="dashicons dashicons-cart"></span>
                            <?php esc_html_e( 'Payment Settings', 'wp-user-frontend' ); ?>
                        </a>
                    </li>

                    <li>
                        <a href="#wpuf-post-restriction">
                            <span class="dashicons dashicons-admin-post"></span>
                            <?php esc_html_e( 'Posting Restriction', 'wp-user-frontend' ); ?>
                        </a>
                    </li>

                    <?php do_action( 'wpuf_admin_subs_nav_tab', $post ); ?>
                </ul>
            </nav>

            <div class="subscription-nav-content">
                <section id="wpuf-payment-settings">
                    <table class="form-table">
                        <tbody>
                            <tr>
                                <th><label for="wpuf-billing-amount">
                                        <span class="wpuf-biling-amount wpuf-subcription-expire"
                                            style="display: <?php echo esc_attr( $hidden_expire ); ?>;"><?php esc_html_e( 'Billing amount:', 'wp-user-frontend' ); ?></span>
                                        <span class="wpuf-billing-cycle wpuf-recurring-child"
                                            style="display: <?php echo esc_attr( $hidden_recurring_class ); ?>;"><?php esc_html_e( 'Billing amount each cycle:', 'wp-user-frontend' ); ?></span></label>
                                </th>
                                <td>
                                    <?php echo esc_attr( wpuf_get_currency( 'symbol' ) ); ?>
                                    <input type="text" size="20" style="" id="wpuf-billing-amount"
                                        value="<?php echo esc_attr( $sub_meta['billing_amount'] ); ?>" name="billing_amount" />
                                    <div><span class="description"></span></div>
                                </td>
                            </tr>
                            <tr class="wpuf-subcription-expire" style="display: <?php echo esc_attr( $hidden_expire ); ?>;">
                                <th><label
                                        for="wpuf-expiration-number"><?php esc_html_e( 'Expires In:', 'wp-user-frontend' ); ?></label>
                                </th>
                                <td>
                                    <input type="text" size="20" style="" id="wpuf-expiration-number"
                                        value="<?php echo esc_attr( $sub_meta['expiration_number'] ); ?>"
                                        name="expiration_number" />

                                    <select id="expiration-period" name="expiration_period">
                                        <?php echo esc_html( $this->admin->option_field( $sub_meta['expiration_period'] ) ); ?>
                                    </select>
                                    <div><span class="description"></span></div>
                                </td>
                            </tr>

                            <?php do_action( 'wpuf_admin_subscription_detail', $sub_meta, $hidden_recurring_class, $hidden_trial_class, $this->admin ); ?>
                        </tbody>
                    </table>
                </section>
                <section id="wpuf-post-restriction">
                    <table class="form-table">
                        <tbody>
                            <tr>
                                <th><label
                                        for="wpuf-sticky-item"><?php esc_html_e( 'Number of featured item', 'wp-user-frontend' ); ?></label>
                                </th>
                                <td>
                                    <input type="text" size="20" style="" id="wpuf-sticky-item"
                                        value="<?php echo intval( $featured_item ); ?>" name="total_feature_item" />
                                    <br>
                                    <span
                                        class="description"><?php esc_html_e( 'How many items a user can set as featured, including all post types', 'wp-user-frontend' ); ?></span>
                                </td>
                            </tr>
                            <tr>
                                <th><label
                                        for="wpuf-sticky-item"><?php esc_html_e( 'Remove featured item on subscription expiry', 'wp-user-frontend' ); ?></label>
                                </th>
                                <td>
                                    <label for="">
                                        <input type="checkbox" value="on" <?php echo esc_attr( wpuf_is_option_on( $remove_featured_item ) ? 'checked' : '' ); ?> name="remove_feature_item" />
                                        <?php esc_html_e( 'The featured item will be removed if the subscription expires', 'wp-user-frontend' ); ?>
                                    </label>
                                </td>
                            </tr>
                            <?php
                            echo wp_kses(
                                $this->admin->get_post_types( $sub_meta['post_type_name'] ),
                                [
                                    'div'    => [],
                                    'tr'     => [],
                                    'td'     => [],
                                    'th'     => [],
                                    'label'  => [
                                        'for' => [],
                                    ],
                                    'input'  => [
                                        'type'  => [],
                                        'size'  => [],
                                        'style' => [],
                                        'id'    => [],
                                        'value' => [],
                                        'name'  => [],
                                    ],
                                    'span'   => [
                                        'class' => [],
                                    ],
                                    'strong' => [],
                                ]
                            );
                            ?>
                            <?php
                            // do_action( 'wpuf_admin_subscription_detail', $sub_meta, $hidden_recurring_class, $hidden_trial_class, $this->admin );
                            ?>
                            <tr class="wpuf-metabox-post_expiration">

                                <th><?php esc_html_e( 'Post Expiration', 'wp-user-frontend' ); ?></th>

                                <td>
                                    <label>
                                        <input type="checkbox" id="wpuf-enable_post_expiration"
                                            name="post_expiration_settings[enable_post_expiration]" value="on" <?php echo esc_attr( $is_post_exp_selected ); ?> />
                                        <?php esc_html_e( 'Enable Post Expiration', 'wp-user-frontend' ); ?>
                                    </label>
                                </td>
                            </tr>
                            <tr class="wpuf-metabox-post_expiration wpuf_subscription_expiration_field">
                                <?php
                                $time_type_array = [
                                    'year',
                                    'month',
                                    'day',
                                ];
                                ?>
                                <th class="wpuf-post-exp-time">
                                    <?php esc_html_e( 'Post Expiration Time', 'wp-user-frontend' ); ?> </th>
                                <td class="wpuf-post-exp-time">
                                    <input type="number" name="post_expiration_settings[expiration_time_value]"
                                        id="wpuf-expiration_time_value" value="<?php echo esc_attr( $time_value ); ?>"
                                        id="wpuf-expiration_time_value" min="1">
                                    <select name="post_expiration_settings[expiration_time_type]"
                                        id="wpuf-expiration_time_type">
                                        <?php
                                        foreach ( $time_type_array as $each_time_type ) {
                                            ?>
                                            <option value="<?php echo esc_attr( $each_time_type ); ?>" <?php echo $each_time_type == $time_type ? 'selected' : ''; ?>>
                                                <?php echo esc_html( ucfirst( $each_time_type ) . '(s)' ); ?></option>
                                            <?php
                                        }
                                        ?>
                                    </select>
                                </td>

                            </tr>
                            <tr class="wpuf_subscription_expiration_field">
                                <th>
                                    <?php esc_html_e( 'Post Status', 'wp-user-frontend' ); ?>
                                </th>
                                <td>
                                    <?php $post_statuses = get_post_statuses(); ?>
                                    <select name="post_expiration_settings[expired_post_status]" id="wpuf-expired_post_status">
                                        <?php
                                        foreach ( $post_statuses as $post_status => $text ) {
                                            ?>
                                            <option value="<?php echo esc_attr( $post_status ); ?>" <?php echo ( $expired_post_status == $post_status ) ? 'selected' : ''; ?>>
                                                <?php echo esc_html( $text ); ?></option>
                                            <?php
                                        }
                                        ?>
                                    </select>
                                    <p class="description">
                                        <?php esc_html_e( 'Status of post after post expiration time is over ', 'wp-user-frontend' ); ?>
                                    </p>
                                </td>
                            </tr>
                            <tr class="wpuf_subscription_expiration_field">
                                <th>
                                    <?php esc_html_e( 'Expiration Mail', 'wp-user-frontend' ); ?>
                                </th>
                                <td>
                                    <label>
                                        <input type="checkbox" name="post_expiration_settings[enable_mail_after_expired]"
                                            value="on" <?php echo esc_attr( $is_enable_mail_after_expired ); ?> />
                                        <?php esc_html_e( 'Send Expiration Email to Post Author', 'wp-user-frontend' ); ?>
                                    </label>

                                    <p class="help">
                                        <?php esc_html_e( 'Send Mail to Author After Exceeding Post Expiration Time', 'wp-user-frontend' ); ?>
                                    </p>
                                </td>
                            </tr>
                            <tr class="wpuf_subscription_expiration_field">
                                <th><?php esc_html_e( 'Expiration Message', 'wp-user-frontend' ); ?></th>
                                <td>
                                    <textarea name="post_expiration_settings[post_expiration_message]"
                                        id="wpuf-post_expiration_message" cols="50"
                                        rows="5"><?php echo esc_attr( $post_expiration_message ); ?></textarea>
                                    <p class="description">
                                        <strong>
                                            <?php
                                            printf(
                                                // translators: %1$s: {post_author}, %2$s: {post_url}, %3$s: {blogname}, %4$s: {post_title}, %5$s: {post_status}
                                                esc_html__( 'You may use: %1$s %2$s %3$s %4$s %5$s', 'wp-user-frontend' ),
                                                '{post_author}',
                                                '{post_url}',
                                                '{blogname}',
                                                '{post_title}',
                                                '{post_status}'
                                            )
                                            ?>
                                        </strong>
                                    </p>
                                </td>
                            </tr>

                            <?php
                            /**
                             * @since 2.7.0
                             */
                            do_action( 'wpuf_admin_subscription_post_restriction', $sub_meta, $post, $this->admin );
                            ?>
                        </tbody>
                    </table>
                </section>

                <?php do_action( 'wpuf_admin_subs_nav_content', $post ); ?>
            </div>
            <?php wp_nonce_field( 'subs_meta_box_nonce', 'meta_box_nonce' ); ?>
        </div>

        <?php
    }

    /**
     * Replaces default post editor with a simiple rich editor
     *
     * @param int $pack_id
     *
     * @return void
     */
    public function pack_description_metabox( $pack_id = null ) {
        global $post;

        wp_editor(
            $post->post_content,
            'post_content',
            [
                'editor_height' => 100,
                'quicktags'     => false,
                'media_buttons' => false,
            ]
        );
    }

    /**
     * Enqueue script for subscription editor page
     *
     * @return void
     */
    public function enqueue_scripts() {
        $screen = get_current_screen();

        if ( 'wpuf_subscription' !== $screen->post_type ) {
            return;
        }

        wp_enqueue_style( 'wpuf-admin' );
        wp_enqueue_script( 'wpuf-metabox-tabs' );
    }

    /**
     * Enqueue scripts for subscription page
     *
     * @since 4.0.11
     *
     * @return void
     */
    public function enqueue_admin_scripts() {
        // Registered in the shared Assets registry (task 2.5b).
        wp_enqueue_script( 'wpuf-admin-subscriptions-react' );
        wp_enqueue_style( 'wpuf-subscriptions-react' );
        $script_handle = 'wpuf-admin-subscriptions-react';
        wp_set_script_translations( $script_handle, 'wp-user-frontend', WPUF_ROOT . '/languages' );
        wpuf()->platform()->get( BootPayload::class )->attach( 'subscriptions', $script_handle );

        wp_localize_script(
            $script_handle,
            'wpufSubscriptions',
            [
                'version'         => WPUF_VERSION,
                'assetUrl'        => WPUF_ASSET_URI,
                'siteUrl'         => site_url(),
                'currencySymbol'  => wpuf_get_currency( 'symbol' ),
                'supportUrl'      => esc_url(
                    'https://wedevs.com/contact/?utm_source=wpuf-subscription'
                ),
                'isProActive'     => class_exists( 'WP_User_Frontend_Pro' ),
                'upgradeUrl'      => esc_url(
                    'https://wedevs.com/wp-user-frontend-pro/pricing/?utm_source=wpuf-subscription'
                ),
                'nonce'           => wp_create_nonce( 'wp_rest' ),
                'rest_url'        => esc_url_raw( rest_url() ),
                'sections'        => $this->admin->get_sections(),
                'subSections'     => $this->admin->get_sub_sections(),
                'fields'          => $this->admin->get_fields(),
                'dependentFields' => $this->admin->get_dependent_fields(),
                'perPage'         => apply_filters( 'wpuf_subscription_per_page', 9 ),
            ]
        );

        /**
         * Fires after the subscription React scripts are enqueued.
         * Pro and third-party plugins should use this hook to enqueue their own
         * scripts with 'wpuf-admin-subscriptions-react' as a dependency.
         *
         * @since WPUF_SINCE
         *
         * @param string $script_handle The handle of the subscription React script
         */
        do_action( 'wpuf_subscription_react_scripts_enqueued', $script_handle );

        // The pre-React handle stays enqueued as an alias of the React script.
        wp_enqueue_script( 'wpuf-admin-subscriptions' );
    }

    /**
     * Remove admin notices from this page
     *
     * @since 4.0.11
     *
     * @return void
     */
    public function remove_notices() {
        add_action( 'in_admin_header', 'wpuf_remove_admin_notices' );
    }

    /**
     * Add help link to the subscriptions listing page
     *
     * @return void
     */
    public function add_help_link() {
        $screen = get_current_screen();

        if ( 'edit-wpuf_subscription' != $screen->id ) {
            return;
        }
        ?>
        <div class="wpuf-footer-help">
            <span class="wpuf-footer-help-content">
                <span class="dashicons dashicons-editor-help"></span>
                <?php
                printf(
                    // translators: %s is a link about subscription payment
                    wp_kses_post( __( 'Learn more about <a href="%s" target="_blank">Subscription</a>', 'wp-user-frontend' ) ),
                    'https://wedevs.com/docs/wp-user-frontend-pro/subscription-payment/?utm_source=wpuf-footer-help&utm_medium=text-link&utm_campaign=learn-more-subscription'
                );
                ?>
            </span>
        </div>

        <script type="text/javascript">
            jQuery(function ($) {
                $('.wpuf-footer-help').appendTo('.wrap');
            });
        </script>
        <?php
    }

    /**
     * Modify the admin footer text
     *
     * @since 4.0.11
     *
     * @return void
     */
    public function modify_admin_footer_text() {
        add_action( 'admin_footer_text', [ $this->admin, 'admin_footer_text' ] );
    }

    /**
     * Modify the admin footer text
     *
     * @since 4.0.11
     *
     * @param string $footer_text
     *
     * @return string
     */
    public function admin_footer_text( $footer_text ) {
        $footer_text  = __( 'Thank you for using <strong>WP User Frontend</strong>.', 'wp-user-frontend' );
        $footer_text .= ' ' . sprintf(
            // Translators: %s: link to the classic UI
            __( 'Use the <a href="%s">classic UI</a>.', 'wp-user-frontend' ),
            admin_url( 'edit.php?post_type=wpuf_subscription' )
        );

        return $footer_text;
    }

    /**
     * Set default sort order for existing subscriptions that don't have it
     *
     * @since 4.1.7
     */
    public function set_default_sort_order_for_existing_subscriptions() {
        // Check if we've already run this migration
        if ( get_transient( 'wpuf_sort_order_migration_done' ) ) {
            return;
        }

        Stores::subscriptions()->set_default_sort_order();

        set_transient( 'wpuf_sort_order_migration_done', true, WEEK_IN_SECONDS );
    }

    /**
     * The meta of a pack through the subscription store ([] for a post that is not a pack).
     *
     * @since WPUF_SINCE
     *
     * @param int $pack_id Pack id
     *
     * @return array
     */
    private function pack_meta( $pack_id ) {
        $pack = Stores::subscriptions()->read( $pack_id );

        return $pack && isset( $pack['meta'] ) && is_array( $pack['meta'] ) ? $pack['meta'] : [];
    }
}
