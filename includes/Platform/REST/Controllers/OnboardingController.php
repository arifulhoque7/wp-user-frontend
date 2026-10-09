<?php
/**
 * Onboarding REST controller
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\REST\Controllers;

use WeDevs\Wpuf\Admin\Onboarding;
use WeDevs\Wpuf\Platform\Caps;
use WeDevs\Wpuf\Platform\REST\RestController;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * `wpuf/v1/onboarding`: the setup wizard's state, a step's save (the step
 * handlers of Admin\Onboarding, with the values the step's form sent) and a
 * step visit (where the admin left off).
 *
 * @since WPUF_SINCE
 */
class OnboardingController extends RestController {

    /**
     * Route base.
     *
     * @var string
     */
    protected $rest_base = 'onboarding';

    /**
     * Resource name in error codes.
     *
     * @var string
     */
    protected $resource = 'onboarding';

    /**
     * The wizard.
     *
     * @var Onboarding|null
     */
    private $wizard = null;

    /**
     * Register the routes.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function register_routes() {
        $step = [
            'type'              => 'string',
            'required'          => true,
            'sanitize_callback' => 'sanitize_key',
        ];

        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base,
            [
                [
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => [ $this, 'get_item' ],
                    'permission_callback' => [ $this, 'can_manage' ],
                ],
            ]
        );

        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/(?P<step>[a-z_]+)',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [ $this, 'save_step' ],
                    'permission_callback' => [ $this, 'can_manage' ],
                    'args'                => [
                        'step'   => $step,
                        'values' => [
                            'type'    => 'object',
                            'default' => [],
                        ],
                    ],
                ],
            ]
        );

        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base . '/(?P<step>[a-z_]+)/visit',
            [
                [
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => [ $this, 'visit_step' ],
                    'permission_callback' => [ $this, 'can_manage' ],
                    'args'                => [
                        'step' => $step,
                    ],
                ],
            ]
        );
    }

    /**
     * Who may run the wizard: as its page.
     *
     * @since WPUF_SINCE
     *
     * @return true|WP_Error
     */
    public function can_manage() {
        if ( ! is_user_logged_in() ) {
            return new WP_Error( 'wpuf_rest_unauthorized', __( 'You must be logged in.', 'wp-user-frontend' ), [ 'status' => 401 ] );
        }

        if ( ! Caps::can( Caps::MANAGE_SITE ) ) {
            return new WP_Error( 'wpuf_rest_forbidden', __( 'You do not have permission to run the setup.', 'wp-user-frontend' ), [ 'status' => 403 ] );
        }

        return true;
    }

    /**
     * The wizard's state.
     *
     * @since WPUF_SINCE
     *
     * @param WP_REST_Request $request Request
     *
     * @return \WP_REST_Response
     */
    public function get_item( $request ) {
        unset( $request );

        return rest_ensure_response( $this->wizard()->get_state() );
    }

    /**
     * Save a step, then the next step's key and the new state.
     *
     * @since WPUF_SINCE
     *
     * @param WP_REST_Request $request Request
     *
     * @return \WP_REST_Response|WP_Error
     */
    public function save_step( $request ) {
        $values = $request->get_param( 'values' );
        $result = $this->wizard()->run_step( $request['step'], is_array( $values ) ? $values : [] );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        $result['state'] = $this->wizard()->get_state();

        return rest_ensure_response( $result );
    }

    /**
     * Remember the step the admin opened.
     *
     * @since WPUF_SINCE
     *
     * @param WP_REST_Request $request Request
     *
     * @return \WP_REST_Response
     */
    public function visit_step( $request ) {
        $this->wizard()->visit( $request['step'] );

        return rest_ensure_response( $this->wizard()->get_state() );
    }

    /**
     * The admin's wizard on admin requests, else one without admin hooks
     * (REST requests do not load Admin).
     *
     * @return Onboarding
     */
    private function wizard() {
        if ( null === $this->wizard ) {
            $admin = function_exists( 'wpuf' ) ? wpuf()->admin : null;

            $this->wizard = is_object( $admin ) && $admin->onboarding instanceof Onboarding ? $admin->onboarding : new Onboarding( false );
        }

        return $this->wizard;
    }
}
