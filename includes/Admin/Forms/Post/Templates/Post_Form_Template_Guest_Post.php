<?php

namespace WeDevs\Wpuf\Admin\Forms\Post\Templates;

use WeDevs\Wpuf\Admin\Forms\Form_Template;

/**
 * Paid Guest Post Template
 */
class Post_Form_Template_Guest_Post extends Form_Template {

    public function __construct() {
        parent::__construct();

        $this->enabled     = true;
        $this->title       = __( 'Paid Guest Post Form', 'wp-user-frontend' );
        $this->description = __( 'Accept guest post submissions with one-time payment enabled. Collect title, content, tags, category, and featured image.', 'wp-user-frontend' );
        $this->image       = WPUF_ASSET_URI . '/images/templates/guest-post.svg';
        $this->form_fields = [
            [
                'input_type'       => 'text',
                'template'         => 'post_title',
                'required'         => 'yes',
                'label'            => __( 'Post Title', 'wp-user-frontend' ),
                'name'             => 'post_title',
                'is_meta'          => 'no',
                'help'             => __( 'Choose a compelling and descriptive title for your guest post.', 'wp-user-frontend' ),
                'css'              => '',
                'placeholder'      => __( 'Enter your article title here', 'wp-user-frontend' ),
                'default'          => '',
                'size'             => '40',
                'wpuf_cond'        => $this->conditionals,
                'wpuf_visibility'  => $this->get_default_visibility_prop(),
                'restriction_to'   => 'max',
                'restriction_type' => 'character',
                'width'            => 'large',
            ],
            [
                'input_type'          => 'textarea',
                'template'            => 'post_content',
                'required'            => 'yes',
                'label'               => __( 'Post Content', 'wp-user-frontend' ),
                'name'                => 'post_content',
                'is_meta'             => 'no',
                'help'                => __( 'Provide the full content of your guest post. Ensure it\'s well-written and relevant.', 'wp-user-frontend' ),
                'css'                 => '',
                'rows'                => '5',
                'cols'                => '25',
                'placeholder'         => __( 'Write your article content here', 'wp-user-frontend' ),
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
                'required'            => 'no',
                'label'               => __( 'Post Excerpt', 'wp-user-frontend' ),
                'name'                => 'post_excerpt',
                'is_meta'             => 'no',
                'help'                => __( 'A short summary of your post, usually displayed on archive pages. Keep it concise.', 'wp-user-frontend' ),
                'css'                 => '',
                'rows'                => '3',
                'cols'                => '25',
                'placeholder'         => __( 'Enter a brief summary here', 'wp-user-frontend' ),
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
                'button_label'    => __( 'Featured Image', 'wp-user-frontend' ),
                'name'            => 'featured_image',
                'is_meta'         => 'no',
                'help'            => __( 'Select an image that best represents your article. This will be the main image for your post.', 'wp-user-frontend' ),
                'css'             => '',
                'max_size'        => '1024',
                'placeholder'     => __( 'Upload your featured image', 'wp-user-frontend' ),
                'wpuf_cond'       => $this->conditionals,
                'wpuf_visibility' => $this->get_default_visibility_prop(),
                'width'           => 'large',
            ],
            [
                'input_type'      => 'taxonomy',
                'template'        => 'taxonomy',
                'required'        => 'yes',
                'label'           => __( 'Category', 'wp-user-frontend' ),
                'name'            => 'category',
                'is_meta'         => 'no',
                'help'            => __( 'Choose the most relevant category for your guest post.', 'wp-user-frontend' ),
                'first'           => __( 'Select a category', 'wp-user-frontend' ),
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
                'input_type'      => 'text',
                'template'        => 'post_tags',
                'required'        => 'no',
                'label'           => __( 'Tags', 'wp-user-frontend' ),
                'name'            => 'tags',
                'is_meta'         => 'no',
                'help'            => __( 'Add relevant keywords or phrases that describe your post.', 'wp-user-frontend' ),
                'css'             => '',
                'placeholder'     => __( 'Enter tags (comma-separated)', 'wp-user-frontend' ),
                'default'         => '',
                'size'            => '40',
                'wpuf_cond'       => $this->conditionals,
                'wpuf_visibility' => $this->get_default_visibility_prop(),
                'width'           => 'large',
            ],
        ];

        $this->form_settings = [
            'form_title'                 => __( 'Paid Guest Post Submission', 'wp-user-frontend' ),
            'form_desc'                  => __( 'Submit your guest article with a one-time payment. Include your title, content, tags, and featured image.', 'wp-user-frontend' ),
            'post_type'                  => 'post',
            'post_status'                => 'draft',
            'default_cat'                => '-1',
            'post_permission'            => 'guest_post',
            'guest_post'                 => 'true',
            'guest_details'              => 'true',
            'message_restrict'           => __( 'This page is restricted. Please {login} / {register} to view this page.', 'wp-user-frontend' ),
            'redirect_to'                => 'post',
            'comment_status'             => 'open',
            'submit_text'                => __( 'Submit Guest Post', 'wp-user-frontend' ),
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
            'edit_post_status'           => 'draft',
            'edit_redirect_to'           => 'same',
            'update_message'             => __( 'Guest post has been updated successfully.', 'wp-user-frontend' ),
            'edit_url'                   => '',
            'update_text'                => __( 'Update Guest Post', 'wp-user-frontend' ),
            'form_template'              => 'post_form_template_guest_post',
            'enable_payment'             => 'yes',
            'pay_per_post'               => 'yes',
            'pay_type'                   => 'fixed',
            'post_expiration_settings'   => [
                'enable_post_expiration' => 'false',
            ],
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

Please review and publish the post if it meets your guidelines.', 'wp-user-frontend' ),
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
Edit URL: {editlink}', 'wp-user-frontend' ),
            ],
            'form_settings'              => [
                'use_theme_css'          => 'false',
                'form_template'          => 'layout1',
                'color_scheme'           => '',
            ],
            'draft_enabled'              => 'true',
            'multistep'                  => [
                'enable'                 => 'no',
            ],
        ];
    }
}
