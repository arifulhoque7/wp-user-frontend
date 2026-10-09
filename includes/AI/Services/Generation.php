<?php
/**
 * AI form builder: generation service
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\AI\Services;

use WeDevs\Wpuf\AI\FormGenerator;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Generating a form from a prompt: input checks, the provider call and the attempt log.
 *
 * @since WPUF_SINCE Moved out of AI\RestController, which keeps the routes and delegates.
 */
class Generation {

    /**
     * The provider client.
     *
     * @var FormGenerator
     */
    protected $form_generator;

    /**
     * @since WPUF_SINCE
     *
     * @param FormGenerator $form_generator The provider client.
     */
    public function __construct( FormGenerator $form_generator ) {
        $this->form_generator = $form_generator;
    }

    /**
     * Generate form using AI
     *
     * @param WP_REST_Request $request REST request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function generate_form( WP_REST_Request $request ) {
        // Validate request size to prevent abuse
        $content_length = $request->get_header( 'content-length' );
        if ( $content_length && $content_length > 1048576 ) { // 1MB limit
            return new WP_Error(
                'request_too_large',
                __( 'Request payload too large', 'wp-user-frontend' ),
                [ 'status' => 413 ]
            );
        }

        $prompt = $request->get_param( 'prompt' );
        $session_id = $request->get_param( 'session_id' );
        $conversation_context = $request->get_param( 'conversation_context' ) ?? [];
        $form_type = $request->get_param( 'form_type' ) ?? 'post';
        $integration = $request->get_param( 'integration' ) ?? '';
        $provider = $request->get_param( 'provider' );
        $temperature = $request->get_param( 'temperature' );
        $max_tokens = $request->get_param( 'max_tokens' );
        $language = $request->get_param( 'language' ) ?? 'English';

        // Rate limiting removed - AI provider handles their own limits

        // Validate session ID format to prevent injection
        if ( ! empty( $session_id ) && ! preg_match( '/^[a-zA-Z0-9_-]{1,64}$/', $session_id ) ) {
            return new WP_Error(
                'invalid_session',
                __( 'Invalid session ID format', 'wp-user-frontend' ),
                [ 'status' => 400 ]
            );
        }

        // No key for the provider: say so instead of sending a request the provider rejects.
        $stored_ai    = get_option( 'wpuf_ai', [] );
        $stored_ai    = is_array( $stored_ai ) ? $stored_ai : [];
        $key_provider = ! empty( $provider ) && is_string( $provider ) ? $provider : ( $stored_ai['ai_provider'] ?? 'openai' );

        if ( empty( $stored_ai[ $key_provider . '_api_key' ] ) ) {
            return new WP_Error(
                'generation_failed',
                __( 'No API key is set for the selected AI provider. Add one in the AI settings.', 'wp-user-frontend' ),
                [ 'status' => 400 ]
            );
        }

        try {
            // Add integration to conversation context
            if ( ! empty( $integration ) ) {
                $conversation_context['integration'] = $integration;
            }

            $options = [
                'session_id' => $session_id,
                'conversation_context' => $conversation_context,
                'form_type' => $form_type,
                'provider' => $provider,
                'temperature' => $temperature,
                'max_tokens' => $max_tokens,
                'language' => $language,
            ];

            $result = $this->form_generator->generate_form( $prompt, $options );

            // Log the generation attempt
            $this->log_generation_attempt( $prompt, $result );

            if ( isset( $result['error'] ) && $result['error'] ) {
                return new WP_Error(
                    'generation_failed',
                    $result['message'] ?? __( 'Form generation failed', 'wp-user-frontend' ),
                    [ 'status' => 400 ]
                );
            }

            // Add integration to response so it can be persisted for regeneration
            if ( ! empty( $integration ) ) {
                $result['integration'] = $integration;
            }

            return new WP_REST_Response(
                [
                    'success' => true,
                    'data' => $result,
                ], 200
            );
        } catch ( \Exception $e ) {
            return new WP_Error(
                'generation_error',
                __( 'An error occurred while generating the form. Please try again.', 'wp-user-frontend' ),
                [ 'status' => 500 ]
            );
        }
    }

    /**
     * Comprehensive input validation for API requests
     *
     * @param array $data Input data to validate
     * @param array $rules Validation rules
     * @return array|WP_Error Validated data or error
     */
    private function validate_input( $data, $rules ) {
        $validated = [];

        foreach ( $rules as $field => $rule ) {
            $value = $data[ $field ] ?? null;

            // Required field check
            if ( isset( $rule['required'] ) && $rule['required'] && empty( $value ) ) {
                return new WP_Error(
                    'missing_field',
                    /* translators: %s: field name */
                    sprintf( __( 'Field %s is required', 'wp-user-frontend' ), $field ),
                    [ 'status' => 400 ]
                );
            }

            // Type validation
            if ( ! empty( $value ) && isset( $rule['type'] ) ) {
                switch ( $rule['type'] ) {
                    case 'string':
                        if ( ! is_string( $value ) ) {
                            /* translators: %s: field name */
                            return new WP_Error( 'invalid_type', sprintf( __( 'Field %s must be a string', 'wp-user-frontend' ), $field ) );
                        }
                        break;
                    case 'array':
                        if ( ! is_array( $value ) ) {
                            /* translators: %s: field name */
                            return new WP_Error( 'invalid_type', sprintf( __( 'Field %s must be an array', 'wp-user-frontend' ), $field ) );
                        }
                        break;
                    case 'integer':
                        if ( ! is_numeric( $value ) ) {
                            /* translators: %s: field name */
                            return new WP_Error( 'invalid_type', sprintf( __( 'Field %s must be numeric', 'wp-user-frontend' ), $field ) );
                        }
                        break;
                }
            }

            // Length validation
            if ( ! empty( $value ) && isset( $rule['max_length'] ) && strlen( $value ) > $rule['max_length'] ) {
                return new WP_Error(
                    'field_too_long',
                    /* translators: 1: field name, 2: maximum number of characters */
                    sprintf( __( 'Field %1$s cannot exceed %2$d characters', 'wp-user-frontend' ), $field, $rule['max_length'] ),
                    [ 'status' => 400 ]
                );
            }

            // Sanitize and store
            if ( ! empty( $value ) ) {
                $validated[ $field ] = isset( $rule['sanitize'] ) ?
                    call_user_func( $rule['sanitize'], $value ) :
                    sanitize_text_field( $value );
            }
        }

        return $validated;
    }

    /**
     * Log generation attempt for monitoring
     *
     * @param string $prompt User prompt
     * @param array $result Generation result
     */
    private function log_generation_attempt( $prompt, $result ) {
        $log_data = [
            'user_id' => get_current_user_id(),
            'timestamp' => current_time( 'mysql' ),
            'prompt_length' => strlen( $prompt ),
            'provider' => $result['provider'] ?? 'unknown',
            'success' => isset( $result['success'] ) ? $result['success'] : false,
            'session_id' => $result['session_id'] ?? '',
        ];

        // Store in option for basic analytics (keep last 100 entries)
        $log_history = get_option( 'wpuf_ai_generation_log', [] );
        array_unshift( $log_history, $log_data );
        $log_history = array_slice( $log_history, 0, 100 );
        update_option( 'wpuf_ai_generation_log', $log_history );
    }
}
