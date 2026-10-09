<?php

namespace WeDevs\Wpuf\AI;

use WP_REST_Controller;
use WP_REST_Server;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * REST API Controller for AI Form Builder
 *
 * Handles all REST API endpoints for AI form generation with comprehensive
 * security, validation, and error handling. Implements rate limiting,
 * XSS protection, and proper WordPress capability checks.
 *
 * Security Features:
 * - Rate limiting (10 requests/hour per user)
 * - XSS protection with field sanitization
 * - Proper capability checks with role filtering
 * - Session validation and timeout handling
 * - Enhanced error logging with context
 *
 * @since 4.2.1
 * @version 1.2.0
 */
class RestController extends WP_REST_Controller {

    /**
     * The namespace of this controller's route.
     *
     * @since 4.2.1
     *
     * @var string
     */
    protected $namespace = 'wpuf/v1';

    /**
     * Route name
     *
     * @since 4.2.1
     *
     * @var string
     */
    protected $rest_base = 'ai-form-builder';

    /**
     * Form Generator instance
     *
     * @var FormGenerator
     */
    private $form_generator;

    /**
     * @var Services\Generation
     */
    private $generation;

    /**
     * @var Services\Provider_Settings
     */
    private $settings;

    /**
     * @var Services\Field_Options
     */
    private $field_options;

    /**
     * @var Services\Form_Writer
     */
    private $writer;

    /**
     * Constructor
     *
     * @since 4.2.1
     */
    public function __construct() {
        $this->form_generator = new FormGenerator();
        $this->generation = new Services\Generation( $this->form_generator );
        $this->settings = new Services\Provider_Settings( $this->form_generator );
        $this->field_options = new Services\Field_Options( $this->form_generator );
        $this->writer = new Services\Form_Writer( $this->form_generator );
        add_action( 'wp_ajax_wpuf_ai_generate_field_options', [ $this, 'ajax_generate_field_options' ] );
    }

    /**
     * Register the routes for the objects of the controller.
     *
     * @since 4.2.1
     *
     * @return void
     */
    public function register_routes() {
        // Generate form endpoint
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/generate',
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [ $this, 'generate_form' ],
                'permission_callback' => [ $this, 'check_permission' ],
                'args'                => [
                    'prompt'               => [
                        'required'          => true,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_textarea_field',
                        'validate_callback' => [ $this, 'validate_prompt' ],
                    ],
                    'session_id'           => [
                        'required'          => false,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'conversation_context' => [
                        'required' => false,
                        'type'     => 'object',
                        'default'  => [],
                    ],
                    'form_type'            => [
                        'required'          => false,
                        'type'              => 'string',
                        'default'           => 'post',
                        'enum'              => [ 'post', 'profile', 'registration' ],
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'integration'          => [
                        'required'          => false,
                        'type'              => 'string',
                        'default'           => '',
                        'enum'              => [ '', 'woocommerce', 'edd', 'events_calendar', 'dokan', 'wc_vendors', 'wcfm' ],
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'provider'             => [
                        'required' => false,
                        'type'     => 'string',
                        'default'  => 'openai',
                        'enum'     => [ 'openai', 'anthropic', 'google' ],
                    ],
                    'temperature'          => [
                        'required' => false,
                        'type'     => 'number',
                        'minimum'  => 0,
                        'maximum'  => 1,
                        'default'  => 0.7,
                    ],
                    'max_tokens'           => [
                        'required' => false,
                        'type'     => 'integer',
                        'minimum'  => 100,
                        'maximum'  => 4000,
                        'default'  => 2000,
                    ],
                ],
            ]
        );

        // Test connection endpoint
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/test',
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [ $this, 'test_connection' ],
                'permission_callback' => [ $this, 'check_permission' ],
                'args'                => [
                    'api_key'  => [
                        'required'          => false,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'provider' => [
                        'required' => false,
                        'type'     => 'string',
                        'enum'     => [ 'openai', 'anthropic', 'google' ],
                    ],
                    'model'    => [
                        'required'          => false,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ]
        );

        // Get providers endpoint
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/providers',
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [ $this, 'get_providers' ],
                'permission_callback' => [ $this, 'check_permission' ],
            ]
        );

        // Get available integrations endpoint
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/integrations',
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [ $this, 'get_integrations' ],
                'permission_callback' => [ $this, 'check_permission' ],
                'args'                => [
                    'form_type' => [
                        'required'          => false,
                        'type'              => 'string',
                        'default'           => 'post',
                        'enum'              => [ 'post', 'profile', 'registration' ],
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                ],
            ]
        );

        // Save settings endpoint
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/settings',
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [ $this, 'save_settings' ],
                'permission_callback' => [ $this, 'check_admin_permission' ],
                'args'                => [
                    'provider'    => [
                        'required' => true,
                        'type'     => 'string',
                        'enum'     => [ 'openai', 'anthropic', 'google' ],
                    ],
                    'model'       => [
                        'required' => false,
                        'type'     => 'string',
                    ],
                    'api_key'     => [
                        'required'          => false,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'temperature' => [
                        'required' => false,
                        'type'     => 'number',
                        'minimum'  => 0,
                        'maximum'  => 1,
                    ],
                    'max_tokens'  => [
                        'required' => false,
                        'type'     => 'integer',
                        'minimum'  => 100,
                        'maximum'  => 4000,
                    ],
                ],
            ]
        );

        // Create form from AI data endpoint
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/create-form',
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [ $this, 'create_form_from_ai' ],
                'permission_callback' => [ $this, 'check_permission' ],
                'args'                => [
                    'form_data' => [
                        'required'   => true,
                        'type'       => 'object',
                        'properties' => [
                            'form_title'       => [ 'type' => 'string' ],
                            'form_description' => [ 'type' => 'string' ],
                            'wpuf_fields'      => [ 'type' => 'array' ],
                            'form_settings'    => [ 'type' => 'object' ],
                        ],
                    ],
                    'form_type' => [
                        'required' => false,
                        'type'     => 'string',
                        'default'  => 'post',
                        'enum'     => [ 'post', 'profile', 'registration' ],
                    ],
                ],
            ]
        );

        // Modify form from AI data endpoint
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/modify-form',
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [ $this, 'modify_form_from_ai' ],
                'permission_callback' => [ $this, 'check_permission' ],
                'args'                => [
                    'form_id'           => [
                        'required' => true,
                        'type'     => 'integer',
                    ],
                    'modification_data' => [
                        'required'   => true,
                        'type'       => 'object',
                        'properties' => [
                            'action'            => [ 'type' => 'string' ],
                            'modification_type' => [ 'type' => 'string' ],
                            'target'            => [ 'type' => 'string' ],
                            'changes'           => [ 'type' => 'object' ],
                        ],
                    ],
                ],
            ]
        );

        // Get settings endpoint
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/settings',
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [ $this, 'get_settings' ],
                'permission_callback' => [ $this, 'check_admin_permission' ],
            ]
        );

        // Refresh Google models endpoint
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/refresh-google-models',
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [ $this, 'refresh_google_models' ],
                'permission_callback' => [ $this, 'check_admin_permission' ],
            ]
        );

        // Get available models endpoint
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/models',
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [ $this, 'get_models' ],
                'permission_callback' => [ $this, 'check_permission' ],
            ]
        );

        // Generate field options endpoint
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/generate-options',
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [ $this, 'generate_field_options' ],
                'permission_callback' => [ $this, 'check_permission' ],
                'args'                => [
                    'prompt'        => [
                        'required'          => true,
                        'type'              => 'string',
                        'sanitize_callback' => 'sanitize_textarea_field',
                        'validate_callback' => [ $this, 'validate_prompt' ],
                    ],
                    'field_type'    => [
                        'required'          => true,
                        'type'              => 'string',
                        'enum'              => [ 'dropdown_field', 'radio_field', 'checkbox_field', 'multiple_select' ],
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'output_format' => [
                        'required'          => false,
                        'type'              => 'string',
                        'enum'              => [ 'one_per_line', 'value_label' ],
                        'default'           => 'one_per_line',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'tone'          => [
                        'required'          => false,
                        'type'              => 'string',
                        'enum'              => [ 'casual', 'formal', 'professional', 'friendly' ],
                        'default'           => 'casual',
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'max_options'   => [
                        'required' => false,
                        'type'     => 'integer',
                        'minimum'  => 1,
                        'maximum'  => 100,
                        'default'  => 20,
                    ],
                ],
            ]
        );
    }

    /**
     * AJAX handler for generating field options
     *
     * @since 4.2.2
     *
     * @return void
     */
    public function ajax_generate_field_options() {
        check_ajax_referer( 'form-builder-setting-nonce', 'nonce' );

        if ( ! $this->check_permission() ) {
            wp_send_json_error( [ 'message' => __( 'Permission denied', 'wp-user-frontend' ) ] );
        }

        $prompt = sanitize_textarea_field( wp_unslash( $_POST['prompt'] ?? '' ) );
        $field_type = sanitize_text_field( wp_unslash( $_POST['field_type'] ?? 'dropdown_field' ) );

        if ( empty( $prompt ) ) {
            wp_send_json_error( [ 'message' => __( 'Prompt is required', 'wp-user-frontend' ) ] );
        }

        $result = $this->form_generator->generate_field_options( $prompt, [ 'field_type' => $field_type ] );

        if ( is_wp_error( $result ) ) {
            wp_send_json_error( [ 'message' => $result->get_error_message() ] );
        }

        // Check for both error === true and success === false as failure conditions
        if ( ( isset( $result['error'] ) && $result['error'] ) || ( isset( $result['success'] ) && ! $result['success'] ) ) {
            wp_send_json_error( [ 'message' => $result['message'] ?? __( 'Failed to generate options', 'wp-user-frontend' ) ] );
        }

        if ( isset( $result['success'] ) && $result['success'] ) {
            // Sanitize options before returning (matching REST handler behavior)
            $sanitized_options = $this->sanitize_field_options( $result['options'] ?? [] );
            wp_send_json_success( [ 'options' => $sanitized_options ] );
        }

        wp_send_json_error( [ 'message' => $result['message'] ?? __( 'Failed to generate options', 'wp-user-frontend' ) ] );
    }

    /**
     * Check if user has permission to use AI form builder
     *
     * @return bool
     */
    public function check_permission() {
        // Check for proper WPUF capabilities and AI feature access
        if ( ! is_user_logged_in() ) {
            return false;
        }

        // Check if user can create forms
        if ( ! current_user_can( 'edit_posts' ) && ! current_user_can( 'wpuf_create_forms' ) ) {
            return false;
        }

        // Allow admin override
        if ( current_user_can( 'manage_options' ) ) {
            return true;
        }

        // Check if AI features are enabled for this user role
        $allowed_roles = apply_filters( 'wpuf_ai_allowed_roles', [ 'administrator', 'editor' ] );
        $user = wp_get_current_user();

        return ! empty( array_intersect( $allowed_roles, $user->roles ) );
    }

    /**
     * Check if user has admin permission
     *
     * @return bool
     */
    public function check_admin_permission() {
        return current_user_can( 'manage_options' );
    }

    /**
     * Validate prompt parameter
     *
     * @param string $value Prompt value
     * @param WP_REST_Request $request REST request object
     * @param string $param Parameter name
     * @return bool|WP_Error
     */
    public function validate_prompt( $value, $request, $param ) {
        if ( empty( trim( $value ) ) ) {
            return new WP_Error(
                'invalid_prompt',
                __( 'Prompt cannot be empty', 'wp-user-frontend' )
            );
        }

        if ( strlen( $value ) > 1000 ) {
            return new WP_Error(
                'prompt_too_long',
                __( 'Prompt is too long. Maximum 1000 characters allowed.', 'wp-user-frontend' )
            );
        }

        return true;
    }



    /**
     * @see \WeDevs\Wpuf\AI\Services\Generation::generate_form()
     *
     * @since WPUF_SINCE
     */
    public function generate_form( WP_REST_Request $request ) {
        return $this->generation->generate_form( $request );
    }

    /**
     * @see \WeDevs\Wpuf\AI\Services\Provider_Settings::test_connection()
     *
     * @since WPUF_SINCE
     */
    public function test_connection( WP_REST_Request $request ) {
        return $this->settings->test_connection( $request );
    }

    /**
     * @see \WeDevs\Wpuf\AI\Services\Provider_Settings::get_providers()
     *
     * @since WPUF_SINCE
     */
    public function get_providers( WP_REST_Request $request ) {
        return $this->settings->get_providers( $request );
    }

    /**
     * @see \WeDevs\Wpuf\AI\Services\Provider_Settings::get_integrations()
     *
     * @since WPUF_SINCE
     */
    public function get_integrations( WP_REST_Request $request ) {
        return $this->settings->get_integrations( $request );
    }

    /**
     * @see \WeDevs\Wpuf\AI\Services\Provider_Settings::save_settings()
     *
     * @since WPUF_SINCE
     */
    public function save_settings( WP_REST_Request $request ) {
        return $this->settings->save_settings( $request );
    }

    /**
     * @see \WeDevs\Wpuf\AI\Services\Provider_Settings::get_settings()
     *
     * @since WPUF_SINCE
     */
    public function get_settings( WP_REST_Request $request ) {
        return $this->settings->get_settings( $request );
    }

    /**
     * @see \WeDevs\Wpuf\AI\Services\Provider_Settings::refresh_google_models()
     *
     * @since WPUF_SINCE
     */
    public function refresh_google_models( WP_REST_Request $request ) {
        return $this->settings->refresh_google_models( $request );
    }

    /**
     * @see \WeDevs\Wpuf\AI\Services\Provider_Settings::get_models()
     *
     * @since WPUF_SINCE
     */
    public function get_models( WP_REST_Request $request ) {
        return $this->settings->get_models( $request );
    }

    /**
     * @see \WeDevs\Wpuf\AI\Services\Field_Options::generate_field_options()
     *
     * @since WPUF_SINCE
     */
    public function generate_field_options( WP_REST_Request $request ) {
        return $this->field_options->generate_field_options( $request );
    }

    /**
     * @see \WeDevs\Wpuf\AI\Services\Form_Writer::create_form_from_ai()
     *
     * @since WPUF_SINCE
     */
    public function create_form_from_ai( WP_REST_Request $request ) {
        return $this->writer->create_form_from_ai( $request );
    }

    /**
     * @see \WeDevs\Wpuf\AI\Services\Form_Writer::modify_form_from_ai()
     *
     * @since WPUF_SINCE
     */
    public function modify_form_from_ai( WP_REST_Request $request ) {
        return $this->writer->modify_form_from_ai( $request );
    }
}
