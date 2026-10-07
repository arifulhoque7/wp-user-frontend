<?php
/**
 * AI service provider
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Providers;

use WeDevs\Wpuf\Admin\BootPayload;
use WeDevs\Wpuf\Admin\Forms\AI_Form_Handler;
use WeDevs\Wpuf\Admin\Screens\AiFormBuilder;
use WeDevs\Wpuf\AI\FormGenerator;
use WeDevs\Wpuf\AI\RestController;
use WeDevs\Wpuf\Platform\Contracts\RestRoute;
use WeDevs\Wpuf\Platform\ServiceProvider;

/**
 * AI form builder services: the form generator, the frozen
 * `wpuf/v1/ai-form-builder/*` controller (registered once, by REST\Manager),
 * the page handler (Pro's registration list opens the builder through it)
 * and the React screen.
 *
 * The generator and controller are the objects `wpuf()->ai_manager` built
 * (its getters keep returning them); the controller hooks its AJAX action in
 * its constructor, so it must exist once.
 *
 * @since WPUF_SINCE
 */
class AiServiceProvider extends ServiceProvider {

    /**
     * Register the services.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function register() {
        $this->share_tagged(
            FormGenerator::class,
            function () {
                $manager = wpuf()->ai_manager;

                return is_object( $manager ) ? $manager->get_form_generator() : new FormGenerator();
            }
        );

        // Frozen routes: same paths, arguments, permissions and responses.
        $this->share_tagged(
            RestController::class,
            function () {
                $manager = wpuf()->ai_manager;

                return is_object( $manager ) ? $manager->get_rest_controller() : new RestController();
            }
        );
        $this->container->add_tag( RestController::class, RestRoute::class );

        // The admin_action handler Admin built (wpuf()->admin->ai_form_handler).
        $this->share_tagged(
            AI_Form_Handler::class,
            function () {
                $admin   = wpuf()->admin;
                $handler = is_object( $admin ) ? $admin->ai_form_handler : null;

                return $handler instanceof AI_Form_Handler ? $handler : new AI_Form_Handler();
            }
        );

        $this->share_tagged(
            AiFormBuilder::class,
            function ( $container ) {
                return new AiFormBuilder( $container->get( BootPayload::class ) );
            }
        );
    }
}
