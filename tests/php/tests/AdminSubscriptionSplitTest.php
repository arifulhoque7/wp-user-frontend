<?php
/**
 * Admin_Subscription split: facade hooks, groups, store reads
 *
 * @package WP_User_Frontend
 */

use WeDevs\Wpuf\Admin\Admin_Subscription;
use WeDevs\Wpuf\Admin\Subscriptions\Pack_Fields;
use WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen;
use WeDevs\Wpuf\Admin\Subscriptions\User_Profile;
use WeDevs\Wpuf\Platform\Stores\Stores;

/**
 * The facade keeps every hook on itself and hands the facade (not a group) to the hooks; the columns and the sort order migration read and write through the subscription store.
 */
class AdminSubscriptionSplitTest extends WP_UnitTestCase {

    /**
     * Hooks the constructor adds (hook, method).
     *
     * @var array
     */
    const HOOKS = [
        [ 'manage_wpuf_subscription_posts_columns', 'subscription_columns_head' ],
        [ 'post_updated_messages', 'form_updated_message' ],
        [ 'wpuf_subscription_additional_fields', 'third_party_cpt_options' ],
        [ 'admin_enqueue_scripts', 'enqueue_scripts' ],
        [ 'manage_wpuf_subscription_posts_custom_column', 'subscription_columns_content' ],
        [ 'add_meta_boxes', 'add_meta_boxes' ],
        [ 'show_user_profile', 'profile_subscription_details' ],
        [ 'edit_user_profile', 'profile_subscription_details' ],
        [ 'personal_options_update', 'profile_subscription_update' ],
        [ 'edit_user_profile_update', 'profile_subscription_update' ],
        [ 'admin_notices', 'add_help_link' ],
        [ 'admin_print_styles-post-new.php', 'enqueue_scripts' ],
        [ 'admin_print_styles-post.php', 'enqueue_scripts' ],
        [ 'wpuf_load_subscription_page', 'remove_notices' ],
        [ 'wpuf_load_subscription_page', 'enqueue_admin_scripts' ],
        [ 'wpuf_load_subscription_page', 'modify_admin_footer_text' ],
        [ 'admin_init', 'set_default_sort_order_for_existing_subscriptions' ],
    ];

    /**
     * Every hook stays on the facade with a facade callable, and every public method is delegated to a group.
     */
    public function test_facade_keeps_the_hooks_and_every_public_method() {
        $admin = new Admin_Subscription();

        foreach ( self::HOOKS as $hook ) {
            $this->assertNotFalse( has_action( $hook[0], [ $admin, $hook[1] ] ), $hook[0] . ' -> ' . $hook[1] );
            remove_action( $hook[0], [ $admin, $hook[1] ] );
        }

        $groups = [];

        foreach ( [ Pack_Fields::class, Pack_Screen::class, User_Profile::class ] as $group ) {
            foreach ( ( new ReflectionClass( $group ) )->getMethods( ReflectionMethod::IS_PUBLIC ) as $method ) {
                if ( '__construct' !== $method->getName() ) {
                    $groups[ $method->getName() ] = $group;
                }
            }
        }

        foreach ( ( new ReflectionClass( Admin_Subscription::class ) )->getMethods( ReflectionMethod::IS_PUBLIC ) as $method ) {
            if ( '__construct' !== $method->getName() ) {
                $this->assertArrayHasKey( $method->getName(), $groups, $method->getName() . ' has a group' );
            }
        }

        $this->assertCount( 25, $groups, 'the 25 public methods of the old class' );
    }

    /**
     * The pack metabox hands the facade to its hooks, so Pro's callbacks keep calling the facade's methods.
     */
    public function test_metabox_hooks_receive_the_facade() {
        $admin = ( new ReflectionClass( Admin_Subscription::class ) )->newInstanceWithoutConstructor();
        $pack  = self::factory()->post->create( [ 'post_type' => 'wpuf_subscription', 'post_title' => 'Pack' ] );
        $seen  = [];
        $spy   = function ( $sub_meta, $recurring, $trial, $object ) use ( &$seen ) {
            $seen[] = $object;
            echo esc_html( $object->lenght_type_option( 'x' ) );
        };

        add_action( 'wpuf_admin_subscription_detail', $spy, 10, 4 );
        $GLOBALS['post'] = get_post( $pack ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- the metabox reads the global, as on post.php.
        ob_start();
        $admin->subs_meta_box( get_post( $pack ) );
        $html = ob_get_clean();
        remove_action( 'wpuf_admin_subscription_detail', $spy, 10 );

        $this->assertCount( 1, $seen );
        $this->assertSame( $admin, $seen[0] );
        $this->assertStringContainsString( 'wpuf-recuring-pay', $html );
    }

    /**
     * The list columns read the pack through the store, as before from its meta.
     */
    public function test_columns_read_through_the_store() {
        $admin = ( new ReflectionClass( Admin_Subscription::class ) )->newInstanceWithoutConstructor();
        $pack  = self::factory()->post->create( [ 'post_type' => 'wpuf_subscription', 'post_title' => 'Pack' ] );
        update_post_meta( $pack, '_billing_amount', '12.5' );
        update_post_meta( $pack, '_recurring_pay', 'yes' );
        update_post_meta( $pack, '_billing_cycle_number', '2' );
        update_post_meta( $pack, '_cycle_period', 'week' );

        $column = function ( $name ) use ( $admin, $pack ) {
            ob_start();
            $admin->subscription_columns_content( $name, $pack );

            return trim( wp_strip_all_tags( ob_get_clean() ) );
        };

        $this->assertSame( html_entity_decode( wpuf_format_price( '12.5' ) ), html_entity_decode( $column( 'amount' ) ) );
        $this->assertSame( 'Yes', $column( 'recurring' ) );
        $this->assertSame( "2 week's (cycle)", $column( 'duration' ) );

        ob_start();
        $admin->subscription_columns_content( 'amount', 999999 );
        $this->assertSame( 'Free', trim( wp_strip_all_tags( ob_get_clean() ) ), 'a post that is not a pack reads as a free pack, no notice' );
    }

    /**
     * The sort order migration sets 1 on packs without an order, through the store, once (transient).
     */
    public function test_sort_order_migration_runs_through_the_store_once() {
        delete_transient( 'wpuf_sort_order_migration_done' );
        $admin   = ( new ReflectionClass( Admin_Subscription::class ) )->newInstanceWithoutConstructor();
        $missing = self::factory()->post->create( [ 'post_type' => 'wpuf_subscription' ] );
        $zero    = self::factory()->post->create( [ 'post_type' => 'wpuf_subscription' ] );
        $kept    = self::factory()->post->create( [ 'post_type' => 'wpuf_subscription' ] );
        update_post_meta( $zero, '_sort_order', 0 );
        update_post_meta( $kept, '_sort_order', 7 );

        $admin->set_default_sort_order_for_existing_subscriptions();

        $this->assertSame( '1', get_post_meta( $missing, '_sort_order', true ) );
        $this->assertSame( '1', get_post_meta( $zero, '_sort_order', true ) );
        $this->assertSame( '7', get_post_meta( $kept, '_sort_order', true ) );
        $this->assertTrue( (bool) get_transient( 'wpuf_sort_order_migration_done' ) );
        $this->assertSame( 0, Stores::subscriptions()->set_default_sort_order(), 'nothing left to migrate' );
        delete_transient( 'wpuf_sort_order_migration_done' );
    }
}
