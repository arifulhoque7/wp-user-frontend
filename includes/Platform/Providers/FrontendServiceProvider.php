<?php
/**
 * The frontend layer's services, shared in the container
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Providers;

use WeDevs\Wpuf\Platform\ServiceProvider;

/**
 * Registers the classes `Frontend` and `Ajax` used to build with `new` as shared
 * services: one instance of each per request, so the AJAX layer reuses the
 * frontend's objects instead of building (and hooking) a second copy.
 *
 * SERVICES keys are the `wpuf()->frontend->{key}` names in the order `Frontend`
 * builds them. HANDLERS are the classes `Ajax` (and the payment page) build
 * with no container key.
 *
 * @since WPUF_SINCE
 */
class FrontendServiceProvider extends ServiceProvider {

    /**
     * Frontend container key => class.
     *
     * @since WPUF_SINCE
     */
    const SERVICES = [
        'frontend_form'      => \WeDevs\Wpuf\Frontend\Frontend_Form::class,
        'registration'       => \WeDevs\Wpuf\Frontend\Registration::class,
        'simple_login'       => \WeDevs\Wpuf\Free\Simple_Login::class,
        'frontend_account'   => \WeDevs\Wpuf\Frontend\Frontend_Account::class,
        'frontend_dashboard' => \WeDevs\Wpuf\Frontend\Frontend_Dashboard::class,
        'shortcode'          => \WeDevs\Wpuf\Frontend\Shortcode::class,
        'payment'            => \WeDevs\Wpuf\Frontend\Payment::class,
        'form_preview'       => \WeDevs\Wpuf\Frontend\Form_Preview::class,
    ];

    /**
     * Handler classes with no container key.
     *
     * @since WPUF_SINCE
     */
    const HANDLERS = [
        \WeDevs\Wpuf\Ajax\Frontend_Form_Ajax::class,
        \WeDevs\Wpuf\Ajax\Upload_Ajax::class,
        \WeDevs\Wpuf\Ajax\Admin_Form_Builder_Ajax::class,
        \WeDevs\Wpuf\Ajax\Address_Form_Ajax::class,
        \WeDevs\Wpuf\Integrations\WPUF_ACF_Compatibility::class,
        \WeDevs\Wpuf\Widgets\Login_Widget::class,
    ];

    /**
     * Register each frontend class as a shared service.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function register() {
        foreach ( array_merge( array_values( self::SERVICES ), self::HANDLERS ) as $class ) {
            if ( $this->container->has( $class ) ) {
                continue;
            }

            $this->share_tagged(
                $class,
                function () use ( $class ) {
                    return new $class();
                }
            );
        }
    }

    /**
     * The class behind a frontend container key.
     *
     * @since WPUF_SINCE
     *
     * @param string $key Frontend key (`frontend_form`, `payment`, ...)
     *
     * @return string|null
     */
    public static function class_of( $key ) {
        return isset( self::SERVICES[ $key ] ) ? self::SERVICES[ $key ] : null;
    }
}
