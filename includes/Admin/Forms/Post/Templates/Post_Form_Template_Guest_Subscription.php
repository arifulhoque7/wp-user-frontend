<?php

namespace WeDevs\Wpuf\Admin\Forms\Post\Templates;

use WeDevs\Wpuf\Admin\Forms\Form_Template;

/**
 * Guest Post with Recurring Payment form template
 */
class Post_Form_Template_Guest_Subscription extends Form_Template {

    public function __construct() {
        parent::__construct();

        $this->enabled     = true;
        $this->title       = __( 'Guest Post with Recurring Payment', 'wp-user-frontend' );
        $this->description = __( 'Accept guest post submissions with mandatory recurring subscription. Collect post title, content, excerpt, tags, category, and featured image.', 'wp-user-frontend' );
        $this->image       = WPUF_ASSET_URI . '/images/templates/guest-post-subscription.svg';
        $this->form_fields = [
            [
                'input_type'       => 'text',
                'template'         => 'post_title',
                'required'         => 'yes',
                'label'            => __( 'Post Title', 'wp-user-frontend' ),
                'name'             => 'post_title',
                'is_meta'          => 'no',
                'help'             => __( 'Enter a compelling title for your guest post', 'wp-user-frontend' ),
                'css'              => '',
                'placeholder'      => __( 'Enter your post title', 'wp-user-frontend' ),
                'default'          => '',
                'size'             => '40',
                'wpuf_cond'        => $this->conditionals,
                'wpuf_visibility'  => $this->get_default_visibility_prop(),
                'restriction_to'   => 'max',
                'restriction_type' => 'character',
                'width'            => 'large',
            ],
            [
                'input_type'      => 'taxonomy',
                'template'        => 'taxonomy',
                'required'        => 'yes',
                'label'           => __( 'Category', 'wp-user-frontend' ),
                'name'            => 'category',
                'is_meta'         => 'no',
                'help'            => __( 'Select the most appropriate category for your guest post', 'wp-user-frontend' ),
                'first'           => __( '- Select Category -', 'wp-user-frontend' ),
                'css'             => '',
                'type'            => 'select',
                'orderby'         => 'name',
                'order'           => 'ASC',
                'exclude_type'    => 'exclude',
                'exclude'         => [],
                'woo_attr'        => 'no',
                'woo_attr_vis'    => 'no',
                'options'         => [],
                'wpuf_cond'       => $this->conditionals,
                'wpuf_visibility' => $this->get_default_visibility_prop(),
                'width'           => 'large',
                'show_inline'     => false,
            ],
            [
                'input_type'          => 'textarea',
                'template'            => 'post_content',
                'required'            => 'yes',
                'label'               => __( 'Post Content', 'wp-user-frontend' ),
                'name'                => 'post_content',
                'is_meta'             => 'no',
                'help'                => __( 'Write your complete guest post content. Provide valuable, original content for our readers.', 'wp-user-frontend' ),
                'css'                 => '',
                'rows'                => '8',
                'cols'                => '25',
                'placeholder'         => __( 'Share your expertise and insights here...', 'wp-user-frontend' ),
                'default'             => '',
                'rich'                => 'yes',
                'insert_image'        => 'yes',
                'wpuf_cond'           => $this->conditionals,
                'wpuf_visibility'     => $this->get_default_visibility_prop(),
                'restriction_to'      => 'max',
                'restriction_type'    => 'character',
                'text_editor_control' => [],
                'width'               => 'large',
            ],
            [
                'input_type'          => 'textarea',
                'template'            => 'post_excerpt',
                'required'            => 'yes',
                'label'               => __( 'Post Excerpt', 'wp-user-frontend' ),
                'name'                => 'post_excerpt',
                'is_meta'             => 'no',
                'help'                => __( 'Provide a compelling excerpt that summarizes your post and entices readers to read more.', 'wp-user-frontend' ),
                'css'                 => '',
                'rows'                => '3',
                'cols'                => '25',
                'placeholder'         => __( 'Write a brief summary of your post...', 'wp-user-frontend' ),
                'default'             => '',
                'rich'                => 'no',
                'wpuf_cond'           => $this->conditionals,
                'wpuf_visibility'     => $this->get_default_visibility_prop(),
                'restriction_to'      => 'max',
                'restriction_type'    => 'character',
                'text_editor_control' => [],
                'width'               => 'large',
            ],
            [
                'input_type'      => 'image_upload',
                'template'        => 'featured_image',
                'count'           => '1',
                'required'        => 'yes',
                'label'           => __( 'Featured Image', 'wp-user-frontend' ),
                'button_label'    => __( 'Upload Featured Image', 'wp-user-frontend' ),
                'name'            => 'featured_image',
                'is_meta'         => 'no',
                'help'            => __( 'Upload a high-quality featured image that represents your post content (minimum 1200x630px recommended)', 'wp-user-frontend' ),
                'css'             => '',
                'max_size'        => '2048',
                'wpuf_cond'       => $this->conditionals,
                'wpuf_visibility' => $this->get_default_visibility_prop(),
                'width'           => 'large',
            ],
            [
                'input_type'      => 'text',
                'template'        => 'post_tags',
                'required'        => 'yes',
                'label'           => __( 'Tags', 'wp-user-frontend' ),
                'name'            => 'tags',
                'is_meta'         => 'no',
                'help'            => __( 'Add relevant tags to help readers discover your content. Separate multiple tags with commas.', 'wp-user-frontend' ),
                'css'             => '',
                'placeholder'     => __( 'e.g. technology, business, marketing', 'wp-user-frontend' ),
                'default'         => '',
                'size'            => '40',
                'wpuf_cond'       => $this->conditionals,
                'wpuf_visibility' => $this->get_default_visibility_prop(),
                'width'           => 'large',
            ],
        ];

        $this->form_settings = [
            // Basic form settings
            'form_title'                 => __( 'Guest Post Submission (Subscription Required)', 'wp-user-frontend' ),
            'form_description'           => __( 'Submit your guest post (this submission is under your active subscription plan). Include your article content, tags, excerpt, and featured image.', 'wp-user-frontend' ),
            
            // Post settings
            'post_type'                  => 'post',
            'post_status'                => 'draft',
            'default_cat'                => "-1",
            'post_permission'            => 'guest_post',
            'guest_post'                 => 'true',
            'guest_details'              => 'ture',
            'guest_name'                 => 'true',
            'guest_email'                => 'true',
            'message_restrict'           => __( 'This form requires a subscription. Please subscribe to submit guest posts.', 'wp-user-frontend' ),
            'redirect_to'                => 'post',
            'comment_status'             => 'open',
            'submit_text'                => __( 'Submit Guest Post', 'wp-user-frontend' ),
            'draft_post'                 => 'on',
            'submit_button_cond'         => [
                'condition_status' => 'no',
                'cond_logic'       => 'any',
                'conditions'       => [
                    [
                        'name'             => '',
                        'operator'         => '=',
                        'option'           => '',
                    ],
                ],
            ],

            // Post update settings
            'edit_post_status'           => 'draft',
            'edit_redirect_to'           => 'same',
            'update_message'             => __( 'Your guest post has been updated successfully and is pending review.', 'wp-user-frontend' ),
            'edit_url'                   => '',
            'update_text'                => __( 'Update Guest Post', 'wp-user-frontend' ),

            // Payment settings
            'payment_options'            => 'on',
            'choose_payment_option'      => 'force_pack_purchase',
            'force_pack_purchase'        => 'on',
            'fallback_ppp_enable'        => 'off',
            'pay_per_post_cost'          => '0',
            'fallback_ppp_cost'          => '0',

            // Form template
            'form_template'              => 'post_form_template_guest_subscription',

            // Notification settings
            'notification'               => [
                'new'                        => 'on',
                'new_to'                     => get_option( 'admin_email' ),
                'new_subject'                => __( 'New guest post submission received', 'wp-user-frontend' ),
                'new_body'                   => __( 'Hi,

A new guest post has been submitted on your site {sitename} ({siteurl}).

Here are the details:
Post Title: {post_title}
Content: {post_content}
Excerpt: {post_excerpt}
Author: {author}
Post URL: {permalink}
Edit URL: {editlink}

This post was submitted through a subscription-based guest post form and is pending your review.

Best regards,
{sitename}', 'wp-user-frontend' ),
                'edit'                       => 'on',
                'edit_to'                    => get_option( 'admin_email' ),
                'edit_subject'               => __( 'Guest post has been updated', 'wp-user-frontend' ),
                'edit_body'                  => __( 'Hi,

The guest post "{post_title}" has been updated.

Here are the details:
Post Title: {post_title}
Content: {post_content}
Excerpt: {post_excerpt}
Author: {author}
Post URL: {permalink}
Edit URL: {editlink}

Best regards,
{sitename}', 'wp-user-frontend' )
            ],

            // Display settings
            'theme_css'                  => 'off',
            'custom_css'                 => '',
            'form_layout'                => 'layout1',

            // Other settings
            'enable_post_expiration'     => 'off',
            'expiration_date'            => '',
            'enable_post_lock'           => 'off',
            'post_lock_time'             => '0',
        ];
    }

    /**
     * Process form submission for guest posts with subscription
     *
     * @param int $post_id
     * @param int $form_id
     * @param array $form_settings
     */
    public function after_insert( $post_id, $form_id, $form_settings ) {
        // Set additional post meta for guest post tracking
        if ( $post_id && isset( $form_settings['post_permission'] ) && $form_settings['post_permission'] === 'guest_post' ) {
            update_post_meta( $post_id, '_wpuf_guest_post_subscription', true );
            update_post_meta( $post_id, '_wpuf_form_id', $form_id );
            
            // Add guest author information if available
            if ( isset( $_POST['guest_name'] ) && !empty( $_POST['guest_name'] ) ) {
                update_post_meta( $post_id, '_wpuf_guest_author_name', sanitize_text_field( $_POST['guest_name'] ) );
            }
            
            if ( isset( $_POST['guest_email'] ) && !empty( $_POST['guest_email'] ) ) {
                update_post_meta( $post_id, '_wpuf_guest_author_email', sanitize_email( $_POST['guest_email'] ) );
            }
        }
    }

    /**
     * Handle form updates for guest posts
     *
     * @param int $post_id
     * @param int $form_id
     * @param array $form_settings
     */
    public function handle_form_updates( $post_id, $form_id, $form_settings ) {
        // Ensure the post remains in draft status unless admin approves
        if ( $post_id && get_post_meta( $post_id, '_wpuf_guest_post_subscription', true ) ) {
            $post_status = get_post_status( $post_id );
            
            // Keep post as draft if it's being updated by guest author
            if ( !current_user_can( 'edit_others_posts' ) && $post_status !== 'publish' ) {
                wp_update_post( [
                    'ID'          => $post_id,
                    'post_status' => 'draft'
                ] );
            }
        }
    }
}
