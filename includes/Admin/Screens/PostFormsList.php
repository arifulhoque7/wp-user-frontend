<?php
/**
 * Post forms screen (list and builder)
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\Screens;

use WeDevs\Wpuf\Admin\BootPayload;
use WeDevs\Wpuf\Admin\Forms\Template_Picker;

/**
 * User Frontend > Post Forms: the React forms list, or the form builder for
 * `action=edit|add-new`.
 *
 * @since WPUF_SINCE
 */
class PostFormsList extends Screen {

    use PrintsNotices;

    /**
     * Menu slug
     *
     * @since WPUF_SINCE
     *
     * @return string
     */
    public function slug() {
        return 'wpuf-post-forms';
    }

    /**
     * The list shows notices; the builder removes them (Admin_Form_Builder).
     *
     * @since WPUF_SINCE
     *
     * @return bool
     */
    public function captures_notices() {
        return ! in_array( $this->action(), [ 'edit', 'add-new' ], true );
    }

    /**
     * Load step: the `wpuf_load_post_forms` hook (builder init and list actions listen).
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function load() {
        /**
         * Backdoor for calling the menu hook.
         * This hook won't get translated even the site language is changed
         */
        do_action( 'wpuf_load_post_forms' );
    }

    /**
     * Print the list or the builder.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function render() {
        if ( wpuf_is_pro_active() && defined( 'WPUF_PRO_VERSION' ) && version_compare( WPUF_PRO_VERSION, '4.1.0', '<' ) ) {
            require_once WPUF_INCLUDES . '/Admin/views/need-to-update.php';

            return;
        }

        // phpcs:ignore WordPress.Security.NonceVerification
        $action           = ! empty( $_GET['action'] ) ? sanitize_text_field( wp_unslash( $_GET['action'] ) ) : null;
        $add_new_page_url = admin_url( 'admin.php?page=wpuf-post-forms&action=add-new' );
        $form_type        = __( 'Post Form', 'wp-user-frontend' );

        switch ( $action ) {
            case 'edit':
            case 'add-new':
                require_once WPUF_INCLUDES . '/Admin/views/post-form.php';
                break;

            default:
                wp_enqueue_style( 'wpuf-admin' );
                wp_enqueue_style( 'wpuf-forms-list' );
                wp_enqueue_script( 'wpuf-forms-list-react' );
                wp_set_script_translations( 'wpuf-forms-list-react', 'wp-user-frontend', WPUF_ROOT . '/languages' );
                wpuf()->platform()->get( BootPayload::class )->attach( 'post_forms', 'wpuf-forms-list-react' );

                // Check AI configuration status
                $ai_settings = get_option( 'wpuf_ai', [] );
                $ai_provider = isset( $ai_settings['ai_provider'] ) ? $ai_settings['ai_provider'] : '';
                $ai_model    = isset( $ai_settings['ai_model'] ) ? $ai_settings['ai_model'] : '';
                $provider_key_field = $ai_provider . '_api_key';
                $ai_api_key = isset( $ai_settings[ $provider_key_field ] ) ? $ai_settings[ $provider_key_field ] : '';
                $ai_configured = ! empty( $ai_provider ) && ! empty( $ai_api_key ) && ! empty( $ai_model );

                wp_localize_script(
                    'wpuf-forms-list-react', 'wpuf_forms_list',
                    [
                        'post_counts'            => wpuf_get_forms_counts_with_status(),
                        'rest_nonce'             => wp_create_nonce( 'wp_rest' ),
                        'rest_url'               => esc_url_raw( rest_url() ),
                        'bulk_nonce'             => wp_create_nonce( 'bulk-post-forms' ),
                        'template_nonce'         => wp_create_nonce( 'wpuf_create_from_template' ),
                        'is_plain_permalink'     => empty( get_option( 'permalink_structure' ) ),
                        'permalink_settings_url' => admin_url( 'options-permalink.php' ),
                        'ai_configured'          => $ai_configured,
                        'ai_settings_url'        => admin_url( 'admin.php?page=wpuf-settings#wpuf_ai' ),
                    ]
                );
                // The template picker of the React forms list ("Add New").
                wp_localize_script(
                    'wpuf-forms-list-react', 'wpuf_form_templates',
                    Template_Picker::data(
                        [
                            'form_type'      => 'post',
                            'registry'       => wpuf_get_post_form_templates(),
                            'pro_templates'  => wpuf_get_pro_form_previews(),
                            'action_name'    => 'post_form_template',
                            'blank_form_url' => admin_url( 'admin.php?page=wpuf-post-forms&action=add-new' ),
                        ]
                    )
                );
                $this->print_notices();
                require_once WPUF_INCLUDES . '/Admin/views/post-forms-list-table-view.php';

                break;
        }
    }

    /**
     * The `action` query value.
     *
     * @return string|null
     */
    private function action() {
        // phpcs:ignore WordPress.Security.NonceVerification
        return ! empty( $_GET['action'] ) ? sanitize_text_field( wp_unslash( $_GET['action'] ) ) : null;
    }

    /**
     * Admin app routes: the post forms list, the builder and the AI form
     * builder (task 5d). Not in the app yet: they open their pages.
     *
     * @since WPUF_SINCE
     *
     * @return array[]
     */
    public function app_routes() {
        return [
            [
                'id'        => 'post-forms',
                'path'      => '/post-forms',
                'title'     => __( 'Post Forms', 'wp-user-frontend' ),
                'app'       => 'forms-list',
                'boot'      => 'post_forms',
                'menuLink'  => true,
                'container' => 'wpuf-post-forms-list-table-view',
                'notices'   => true,
                'page'      => 'admin.php?page=wpuf-post-forms',
            ],
            [
                'id'       => 'post-form-new',
                'path'     => '/post-forms/new',
                'app'      => 'form-builder',
                'boot'     => 'form_builder',
                'menuPath' => '/post-forms',
                'page'     => 'admin.php?page=wpuf-post-forms&action=add-new',
            ],
            [
                'id'          => 'post-form-edit',
                'path'        => '/post-forms/:id/edit',
                'title'       => __( 'Edit Form', 'wp-user-frontend' ),
                'app'         => 'form-builder',
                'boot'        => 'form_builder',
                'menuPath'    => '/post-forms',
                'container'   => 'wpuf-form-builder-app',
                'bodyClasses' => [ 'wpuf-builder-screen' ],
                'page'        => 'admin.php?page=wpuf-post-forms&action=edit&id=:id',
            ],
            [
                'id'          => 'post-forms-ai',
                'path'        => '/post-forms/ai',
                'title'       => __( 'AI Form Builder', 'wp-user-frontend' ),
                'app'         => 'ai-form-builder',
                'boot'        => 'wpuf-ai-form-generation',
                'menuPath'    => '/post-forms',
                'container'   => 'wpuf-ai-form-builder',
                'bodyClasses' => [ 'wpuf-ai-form-builder-page' ],
                'page'        => 'admin.php?action=post_form_template&template=ai_form&_wpnonce=' . wp_create_nonce( 'wpuf_create_from_template' ),
            ],
        ];
    }
}
