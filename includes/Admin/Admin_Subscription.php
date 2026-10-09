<?php
/**
 * Subscription packs admin
 *
 * @package WP_User_Frontend
 */

namespace WeDevs\Wpuf\Admin;

use WeDevs\Wpuf\Admin\Subscriptions\Pack_Fields;
use WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen;
use WeDevs\Wpuf\Admin\Subscriptions\User_Profile;

/**
 * Manage Subscription packs: the hooks, delegating to the pack editor schema
 * (`Subscriptions\Pack_Fields`), the packs admin screen
 * (`Subscriptions\Pack_Screen`) and the user profile section
 * (`Subscriptions\User_Profile`). Every public method and hook callable
 * stays on this class.
 *
 * @since WPUF_SINCE Split by concern; the hooks and public methods are unchanged.
 */
class Admin_Subscription {

    /**
     * @var Pack_Fields|null
     */
    private $pack_fields = null;

    /**
     * @var Pack_Screen|null
     */
    private $pack_screen = null;

    /**
     * @var User_Profile|null
     */
    private $user_profile = null;

    /**
     * The constructor
     */
    public function __construct() {
        add_filter( 'manage_wpuf_subscription_posts_columns', [ $this, 'subscription_columns_head' ] );
        add_filter( 'post_updated_messages', [ $this, 'form_updated_message' ] );
        add_filter( 'wpuf_subscription_additional_fields', [ $this, 'third_party_cpt_options' ] );

        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
        add_action( 'manage_wpuf_subscription_posts_custom_column', [ $this, 'subscription_columns_content' ], 10, 2 );

        // new subscription metabox hooks
        add_action( 'add_meta_boxes', [ $this, 'add_meta_boxes' ] );

        add_action( 'show_user_profile', [ $this, 'profile_subscription_details' ], 30 );
        add_action( 'edit_user_profile', [ $this, 'profile_subscription_details' ], 30 );
        add_action( 'personal_options_update', [ $this, 'profile_subscription_update' ] );
        add_action( 'edit_user_profile_update', [ $this, 'profile_subscription_update' ] );

        // display help link to docs
        add_action( 'admin_notices', [ $this, 'add_help_link' ] );

        // new subscription metabox hooks
        add_action( 'admin_print_styles-post-new.php', [ $this, 'enqueue_scripts' ] );
        add_action( 'admin_print_styles-post.php', [ $this, 'enqueue_scripts' ] );

        add_action( 'wpuf_load_subscription_page', [ $this, 'remove_notices' ] );
        add_action( 'wpuf_load_subscription_page', [ $this, 'enqueue_admin_scripts' ] );
        add_action( 'wpuf_load_subscription_page', [ $this, 'modify_admin_footer_text' ] );

        add_action( 'admin_init', [ $this, 'set_default_sort_order_for_existing_subscriptions' ] );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Fields::get_sections()
     *
     * @since WPUF_SINCE
     */
    public function get_sections() {
        return $this->pack_fields()->get_sections();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Fields::get_sub_sections()
     *
     * @since WPUF_SINCE
     */
    public function get_sub_sections() {
        return $this->pack_fields()->get_sub_sections();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Fields::get_fields()
     *
     * @since WPUF_SINCE
     */
    public function get_fields() {
        return $this->pack_fields()->get_fields();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Fields::get_dependent_fields()
     *
     * @since WPUF_SINCE
     */
    public function get_dependent_fields() {
        return $this->pack_fields()->get_dependent_fields();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Fields::get_post_types()
     *
     * @since WPUF_SINCE
     */
    public function get_post_types( $post_types = null ) {
        return $this->pack_fields()->get_post_types( $post_types );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Fields::third_party_cpt_options()
     *
     * @since WPUF_SINCE
     */
    public function third_party_cpt_options( $additional_options ) {
        return $this->pack_fields()->third_party_cpt_options( $additional_options );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Fields::option_field()
     *
     * @since WPUF_SINCE
     */
    public function option_field( $selected ) {
        return $this->pack_fields()->option_field( $selected );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Fields::lenght_type_option()
     *
     * @since WPUF_SINCE
     */
    public function lenght_type_option( $selected ) {
        return $this->pack_fields()->lenght_type_option( $selected );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::subscription_columns_head()
     *
     * @since WPUF_SINCE
     */
    public function subscription_columns_head( $head ) {
        return $this->pack_screen()->subscription_columns_head( $head );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::subscription_columns_content()
     *
     * @since WPUF_SINCE
     */
    public function subscription_columns_content( $column_name, $post_ID ) {
        return $this->pack_screen()->subscription_columns_content( $column_name, $post_ID );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::form_updated_message()
     *
     * @since WPUF_SINCE
     */
    public function form_updated_message( $messages ) {
        return $this->pack_screen()->form_updated_message( $messages );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::add_meta_boxes()
     *
     * @since WPUF_SINCE
     */
    public function add_meta_boxes() {
        return $this->pack_screen()->add_meta_boxes();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::subs_meta_box()
     *
     * @since WPUF_SINCE
     */
    public function subs_meta_box() {
        return $this->pack_screen()->subs_meta_box();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::pack_description_metabox()
     *
     * @since WPUF_SINCE
     */
    public function pack_description_metabox( $pack_id = null ) {
        return $this->pack_screen()->pack_description_metabox( $pack_id );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::enqueue_scripts()
     *
     * @since WPUF_SINCE
     */
    public function enqueue_scripts() {
        return $this->pack_screen()->enqueue_scripts();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::enqueue_admin_scripts()
     *
     * @since WPUF_SINCE
     */
    public function enqueue_admin_scripts() {
        return $this->pack_screen()->enqueue_admin_scripts();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::remove_notices()
     *
     * @since WPUF_SINCE
     */
    public function remove_notices() {
        return $this->pack_screen()->remove_notices();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::add_help_link()
     *
     * @since WPUF_SINCE
     */
    public function add_help_link() {
        return $this->pack_screen()->add_help_link();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::modify_admin_footer_text()
     *
     * @since WPUF_SINCE
     */
    public function modify_admin_footer_text() {
        return $this->pack_screen()->modify_admin_footer_text();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::admin_footer_text()
     *
     * @since WPUF_SINCE
     */
    public function admin_footer_text( $footer_text ) {
        return $this->pack_screen()->admin_footer_text( $footer_text );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\Pack_Screen::set_default_sort_order_for_existing_subscriptions()
     *
     * @since WPUF_SINCE
     */
    public function set_default_sort_order_for_existing_subscriptions() {
        return $this->pack_screen()->set_default_sort_order_for_existing_subscriptions();
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\User_Profile::profile_subscription_details()
     *
     * @since WPUF_SINCE
     */
    public function profile_subscription_details( $profileuser ) {
        return $this->user_profile()->profile_subscription_details( $profileuser );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\User_Profile::profile_subscription_update()
     *
     * @since WPUF_SINCE
     */
    public function profile_subscription_update( $user_id ) {
        return $this->user_profile()->profile_subscription_update( $user_id );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\User_Profile::packdropdown_without_recurring()
     *
     * @since WPUF_SINCE
     */
    public function packdropdown_without_recurring( $packs, $selected = '' ) {
        return $this->user_profile()->packdropdown_without_recurring( $packs, $selected );
    }

    /**
     * @see \WeDevs\Wpuf\Admin\Subscriptions\User_Profile::delete_user_package()
     *
     * @since WPUF_SINCE
     */
    public function delete_user_package() {
        return $this->user_profile()->delete_user_package();
    }

    /**
     * The pack fields group (built on first use).
     *
     * @since WPUF_SINCE
     *
     * @return Pack_Fields
     */
    private function pack_fields() {
        if ( ! $this->pack_fields ) {
            $this->pack_fields = new Pack_Fields( $this );
        }

        return $this->pack_fields;
    }

    /**
     * The pack screen group (built on first use).
     *
     * @since WPUF_SINCE
     *
     * @return Pack_Screen
     */
    private function pack_screen() {
        if ( ! $this->pack_screen ) {
            $this->pack_screen = new Pack_Screen( $this );
        }

        return $this->pack_screen;
    }

    /**
     * The user profile group (built on first use).
     *
     * @since WPUF_SINCE
     *
     * @return User_Profile
     */
    private function user_profile() {
        if ( ! $this->user_profile ) {
            $this->user_profile = new User_Profile( $this );
        }

        return $this->user_profile;
    }
}
