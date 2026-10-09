<?php
/**
 * AI form builder: provider settings service
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\AI\Services;

use WeDevs\Wpuf\AI\FormGenerator;
use WeDevs\Wpuf\AI\Config;
use WP_REST_Request;
use WP_REST_Response;

/**
 * The AI settings and providers: connection test, provider and integration lists, settings read and save, model lists.
 *
 * @since WPUF_SINCE Moved out of AI\RestController, which keeps the routes and delegates.
 */
class Provider_Settings {

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
     * Test connection to AI provider
     *
     * @param WP_REST_Request $request REST request object
     * @return WP_REST_Response Response object
     */
    public function test_connection( WP_REST_Request $request ) {
        try {
            // Get parameters from request
            $api_key = $request->get_param( 'api_key' );
            $provider = $request->get_param( 'provider' );
            $model = $request->get_param( 'model' );

            // The settings screen only has the masked key; use the stored one.
            $stored_ai = get_option( 'wpuf_ai', [] );
            $stored    = is_array( $stored_ai ) && is_string( $provider ) && isset( $stored_ai[ $provider . '_api_key' ] ) ? $stored_ai[ $provider . '_api_key' ] : '';

            if ( function_exists( 'wpuf_settings_is_masked_secret' ) && wpuf_settings_is_masked_secret( $api_key, $stored, 4 ) ) {
                $api_key = $stored;
            }

            // Pass provider and model to test_connection
            $result = $this->form_generator->test_connection( $api_key, $provider, $model );

            return new WP_REST_Response( $result, $result['success'] ? 200 : 400 );
        } catch ( \Exception $e ) {
            return new WP_REST_Response(
                [
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 500
            );
        }
    }

    /**
     * Get available providers
     *
     * @param WP_REST_Request $request REST request object
     * @return WP_REST_Response Response object
     */
    public function get_providers( WP_REST_Request $request ) {
        $providers = $this->form_generator->get_providers();
        $current_provider = $this->form_generator->get_current_provider();

        return new WP_REST_Response(
            [
                'success' => true,
                'providers' => $providers,
                'current_provider' => $current_provider,
            ], 200
        );
    }

    /**
     * Get available integrations
     *
     * Returns list of available integrations based on installed plugins
     *
     * @since 4.2.9
     *
     * @param WP_REST_Request $request REST request object
     * @return WP_REST_Response Response object
     */
    public function get_integrations( WP_REST_Request $request ) {
        $form_type = $request->get_param( 'form_type' ) ?? 'post';

        // Define all possible integrations with their requirements
        $all_integrations = [
            // Post form integrations
            'woocommerce' => [
                'id'          => 'woocommerce',
                'label'       => __( 'WooCommerce Product', 'wp-user-frontend' ),
                'description' => __( 'Create WooCommerce product submission forms', 'wp-user-frontend' ),
                'enabled'     => class_exists( 'WooCommerce', false ),
                'form_types'  => [ 'post' ],
                'icon'        => 'woocommerce',
            ],
            'edd' => [
                'id'          => 'edd',
                'label'       => __( 'Easy Digital Downloads', 'wp-user-frontend' ),
                'description' => __( 'Create EDD download submission forms', 'wp-user-frontend' ),
                'enabled'     => class_exists( 'Easy_Digital_Downloads' ),
                'form_types'  => [ 'post' ],
                'icon'        => 'download',
            ],
            'events_calendar' => [
                'id'          => 'events_calendar',
                'label'       => __( 'The Events Calendar', 'wp-user-frontend' ),
                'description' => __( 'Create event submission forms', 'wp-user-frontend' ),
                'enabled'     => class_exists( 'Tribe__Events__Main' ),
                'form_types'  => [ 'post' ],
                'icon'        => 'calendar',
            ],
            // Registration form integrations
            'dokan' => [
                'id'          => 'dokan',
                'label'       => __( 'Dokan Vendor', 'wp-user-frontend' ),
                'description' => __( 'Create Dokan vendor registration forms', 'wp-user-frontend' ),
                'enabled'     => class_exists( 'WeDevs_Dokan' ),
                'form_types'  => [ 'profile', 'registration' ],
                'icon'        => 'store',
            ],
            'wc_vendors' => [
                'id'          => 'wc_vendors',
                'label'       => __( 'WC Vendors', 'wp-user-frontend' ),
                'description' => __( 'Create WC Vendors registration forms', 'wp-user-frontend' ),
                'enabled'     => class_exists( 'WC_Vendors' ),
                'form_types'  => [ 'profile', 'registration' ],
                'icon'        => 'store',
            ],
            'wcfm' => [
                'id'          => 'wcfm',
                'label'       => __( 'WCFM Membership', 'wp-user-frontend' ),
                'description' => __( 'Create WCFM vendor registration forms', 'wp-user-frontend' ),
                'enabled'     => class_exists( 'WCFMvm' ),
                'form_types'  => [ 'profile', 'registration' ],
                'icon'        => 'store',
            ],
        ];

        // Filter integrations based on form type and enabled status
        $available_integrations = [];
        foreach ( $all_integrations as $integration ) {
            // Only include if enabled and supports the current form type
            if ( $integration['enabled'] && in_array( $form_type, $integration['form_types'], true ) ) {
                $available_integrations[] = $integration;
            }
        }

        /**
         * Filter available AI form builder integrations
         *
         * Allows pro plugin to add or modify available integrations.
         *
         * @since 4.2.2
         *
         * @param array  $available_integrations Array of integration objects
         * @param string $form_type              Form type ('post' or 'profile')
         */
        $available_integrations = apply_filters( 'wpuf_ai_integrations', $available_integrations, $form_type );

        return new WP_REST_Response(
            [
                'success' => true,
                'integrations' => $available_integrations,
                'form_type' => $form_type,
            ], 200
        );
    }

    /**
     * Save AI settings
     *
     * @param WP_REST_Request $request REST request object
     * @return WP_REST_Response Response object
     */
    public function save_settings( WP_REST_Request $request ) {
        $provider    = $request->get_param( 'provider' );
        $model       = $request->get_param( 'model' );
        $api_key     = $request->get_param( 'api_key' );
        $temperature = $request->get_param( 'temperature' );
        $max_tokens  = $request->get_param( 'max_tokens' );

        // Get existing settings
        $existing = get_option( 'wpuf_ai', [] );

        // Validate API key format if provided
        if ( ! empty( $api_key ) ) {
            $api_key = sanitize_text_field( $api_key );
            if ( strlen( $api_key ) < 10 ) {
                return new WP_REST_Response(
                    [
                        'success' => false,
                        'message' => __( 'API key appears to be too short', 'wp-user-frontend' ),
                    ], 400
                );
            }
        }

        // Normalize optional params
        if ( $temperature !== null ) {
            $temperature = max( 0.0, min( 1.0, (float) $temperature ) );
        }
        if ( $max_tokens !== null ) {
            $max_tokens = max( 100, min( 4000, (int) $max_tokens ) );
        }

        // Update with new values
        $settings = [
            'ai_provider' => $provider ? $provider : ( $existing['ai_provider'] ?? 'openai' ),
            'ai_model'    => $model ? $model : ( $existing['ai_model'] ?? 'gpt-3.5-turbo' ),
            'ai_api_key'  => ! empty( $api_key )
                                ? $api_key
                                : ( $existing['ai_api_key'] ?? '' ),
            'temperature' => $temperature !== null
                                ? $temperature
                                : ( $existing['temperature'] ?? 0.7 ),
            'max_tokens'  => $max_tokens !== null
                                ? $max_tokens
                                : ( $existing['max_tokens'] ?? 2000 ),
        ];

        $saved = update_option( 'wpuf_ai', $settings );

        // Auto-refresh all models when settings are saved
        if ( $saved ) {
            // Check if models need refresh (cache older than 1 hour or not exists)
            $cached = get_transient( 'wpuf_ai_models_cache' );
            $should_refresh = true;

            if ( false !== $cached && is_array( $cached ) && isset( $cached['last_updated'] ) ) {
                $cache_age = time() - $cached['last_updated'];
                $should_refresh = $cache_age > HOUR_IN_SECONDS;
            }

            if ( $should_refresh ) {
                // Fetch all models from all providers (don't fail if this errors)
                Config::update_all_models();
            }
        }

        if ( $saved ) {
            return new WP_REST_Response(
                [
                    'success' => true,
                    'message' => __( 'Settings saved successfully', 'wp-user-frontend' ),
                ], 200
            );
        } else {
            return new WP_REST_Response(
                [
                    'success' => false,
                    'message' => __( 'Failed to save settings', 'wp-user-frontend' ),
                ], 400
            );
        }
    }

    /**
     * Get AI settings
     *
     * @param WP_REST_Request $request REST request object
     * @return WP_REST_Response Response object
     */
    public function get_settings( WP_REST_Request $request ) {
        // Get settings from WPUF settings system
        $wpuf_ai_settings = get_option( 'wpuf_ai', [] );

        // Map to expected format
        $settings = [
            'provider' => $wpuf_ai_settings['ai_provider'] ?? 'openai',
            'model' => $wpuf_ai_settings['ai_model'] ?? 'gpt-3.5-turbo',
            'temperature' => $wpuf_ai_settings['temperature'] ?? 0.7,
            'max_tokens' => $wpuf_ai_settings['max_tokens'] ?? 2000,
            'api_key' => $wpuf_ai_settings['ai_api_key'] ?? '',
        ];

        // Don't expose the actual API key, just whether it's set
        $settings['has_api_key'] = ! empty( $settings['api_key'] );
        unset( $settings['api_key'] );

        return new WP_REST_Response(
            [
                'success' => true,
                'settings' => $settings,
            ], 200
        );
    }

    /**
     * Refresh Google models from API
     *
     * @param WP_REST_Request $request REST request object
     * @return WP_REST_Response Response object
     */
    public function refresh_google_models( WP_REST_Request $request ) {
        // Get Google API key from settings
        $wpuf_ai_settings = get_option( 'wpuf_ai', [] );

        // Check for Google API key (stored as google_api_key)
        $api_key = $wpuf_ai_settings['google_api_key'] ?? '';

        if ( empty( $api_key ) ) {
            return new WP_REST_Response(
                [
                    'success' => false,
                    'message' => __( 'Google API key not configured. Please save your Google API key first.', 'wp-user-frontend' ),
                ], 400
            );
        }

        // Fetch models from all providers
        $result = Config::update_all_models();

        if ( is_wp_error( $result ) ) {
            return new WP_REST_Response(
                [
                    'success' => false,
                    'message' => $result->get_error_message(),
                ], 400
            );
        }

        // Get the updated models
        $models = Config::get_models();

        return new WP_REST_Response(
            [
                'success' => true,
                'message' => __( 'Google models updated successfully', 'wp-user-frontend' ),
                'models' => $models,
            ], 200
        );
    }

    /**
     * Get available models
     *
     * @param WP_REST_Request $request REST request object
     * @return WP_REST_Response Response object
     */
    public function get_models( WP_REST_Request $request ) {
        // Get all models from cache
        $models = Config::get_models();

        return new WP_REST_Response(
            [
                'success' => true,
                'models' => $models,
            ], 200
        );
    }
}
