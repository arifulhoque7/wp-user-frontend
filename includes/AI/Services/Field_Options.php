<?php
/**
 * AI form builder: field options service
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
 * Generating the options of a choice field from a prompt.
 *
 * @since WPUF_SINCE Moved out of AI\RestController, which keeps the routes and delegates.
 */
class Field_Options {

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
     * Generate field options using AI
     *
     * @param WP_REST_Request $request REST request object
     * @return WP_REST_Response|WP_Error Response object
     */
    public function generate_field_options( WP_REST_Request $request ) {
        try {
            $prompt = $request->get_param( 'prompt' );
            $field_type = $request->get_param( 'field_type' );
            $output_format = $request->get_param( 'output_format' ) ?? 'one_per_line';
            $tone = $request->get_param( 'tone' ) ?? 'casual';
            $max_options = $request->get_param( 'max_options' ) ?? 20;

            // Validate max options
            if ( $max_options < 1 || $max_options > 100 ) {
                return new WP_Error(
                    'invalid_max_options',
                    __( 'Maximum options must be between 1 and 100', 'wp-user-frontend' ),
                    [ 'status' => 400 ]
                );
            }

            // Call FormGenerator to generate options
            $result = $this->form_generator->generate_field_options(
                $prompt, [
                    'field_type' => $field_type,
                    'output_format' => $output_format,
                    'tone' => $tone,
                    'max_options' => $max_options,
                ]
            );

            // Check for both error === true and success === false as failure conditions
            if ( ( isset( $result['error'] ) && $result['error'] ) || ( isset( $result['success'] ) && ! $result['success'] ) ) {
                return new WP_Error(
                    'generation_failed',
                    $result['message'] ?? __( 'Failed to generate field options', 'wp-user-frontend' ),
                    [ 'status' => 400 ]
                );
            }

            // Sanitize generated options
            $sanitized_options = $this->sanitize_field_options( $result['options'] ?? [] );

            return new WP_REST_Response(
                [
                    'success' => true,
                    'options' => $sanitized_options,
                    'message' => __( 'Options generated successfully', 'wp-user-frontend' ),
                ], 200
            );
        } catch ( \Exception $e ) {
            return new WP_Error(
                'generation_error',
                __( 'An error occurred while generating options. Please try again.', 'wp-user-frontend' ),
                [ 'status' => 500 ]
            );
        }
    }

    /**
     * Sanitize field options
     *
     * @param array $options Raw options from AI (array of objects with 'label' and 'value' keys)
     * @return array Sanitized options as indexed array
     */
    private function sanitize_field_options( $options ) {
        if ( ! is_array( $options ) ) {
            return [];
        }

        $sanitized = [];

        foreach ( $options as $option ) {
            // Handle array of objects with label/value structure (from generate_field_options)
            if ( is_array( $option ) && isset( $option['label'] ) && isset( $option['value'] ) ) {
                $sanitized[] = [
                    'label' => sanitize_text_field( $option['label'] ),
                    'value' => sanitize_key( $option['value'] ),
                ];
            } elseif ( is_string( $option ) ) {
                // Handle simple string options
                $sanitized[] = [
                    'label' => sanitize_text_field( $option ),
                    'value' => sanitize_key( strtolower( str_replace( ' ', '_', $option ) ) ),
                ];
            }
        }

        return $sanitized;
    }
}
