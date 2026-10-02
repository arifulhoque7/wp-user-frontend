<?php
/**
 * Platform container, providers and bootstrap (task 2.1)
 *
 * @package WP_User_Frontend
 */

use WeDevs\Wpuf\Builder\HookBridge;
use WeDevs\Wpuf\Platform\Bootstrap;
use WeDevs\Wpuf\Platform\Container;
use WeDevs\Wpuf\Platform\Contracts\Hookable;
use WeDevs\Wpuf\Platform\NotFoundException;
use WeDevs\Wpuf\Platform\ServiceProvider;

/**
 * Hookable test double: counts register_hooks() calls.
 */
class WPUF_Test_Hookable_Service implements Hookable {

    /**
     * Calls of register_hooks().
     *
     * @var int
     */
    public $hooked = 0;

    /**
     * Count the call.
     *
     * @return void
     */
    public function register_hooks() {
        $this->hooked++;
    }
}

/**
 * Provider test double registering the hookable double.
 */
class WPUF_Test_Provider extends ServiceProvider {

    /**
     * Register the double as a shared, tagged service.
     *
     * @return void
     */
    public function register() {
        $this->share_tagged(
            WPUF_Test_Hookable_Service::class,
            function () {
                return new WPUF_Test_Hookable_Service();
            }
        );
    }
}

/**
 * Provider test double registering nothing.
 */
class WPUF_Test_Empty_Provider extends ServiceProvider {

    /**
     * Register nothing.
     *
     * @return void
     */
    public function register() {}
}

/**
 * @covers \WeDevs\Wpuf\Platform\Container
 * @covers \WeDevs\Wpuf\Platform\ServiceProvider
 * @covers \WeDevs\Wpuf\Platform\Bootstrap
 */
class PlatformContainerTest extends WP_UnitTestCase {

    public function test_shared_service_resolves_once_and_bind_resolves_each_time() {
        $container = new Container();
        $container->share( 'shared', function () {
            return new stdClass();
        } );
        $container->bind( 'factory', function ( $c, $label = 'none' ) {
            $object        = new stdClass();
            $object->label = $label;

            return $object;
        } );

        $this->assertSame( $container->get( 'shared' ), $container->get( 'shared' ) );
        $this->assertNotSame( $container->get( 'factory' ), $container->get( 'factory' ) );
        $this->assertSame( 'x', $container->get( 'factory', 'x' )->label, 'bind passes get() arguments to the factory' );
        $this->assertTrue( $container->is_shared( 'shared' ) );
        $this->assertFalse( $container->is_shared( 'factory' ) );
    }

    public function test_unknown_service_throws() {
        $this->expectException( NotFoundException::class );
        ( new Container() )->get( 'missing' );
    }

    public function test_tags_keep_order_and_have_no_duplicates() {
        $container = new Container();
        $container->share( 'a', '__return_true' );
        $container->share( 'b', '__return_false' );
        $container->add_tag( 'b', 'role' );
        $container->add_tag( 'a', 'role' );
        $container->add_tag( 'b', 'role' );

        $this->assertSame( [ 'b', 'a' ], $container->tagged_ids( 'role' ) );
        $this->assertSame( [ false, true ], $container->tagged( 'role' ) );
        $this->assertSame( [], $container->tagged_ids( 'none' ) );
    }

    public function test_provider_tags_services_by_interface() {
        $container = new Container();
        ( new WPUF_Test_Provider( $container ) )->register();

        $this->assertSame( [ WPUF_Test_Hookable_Service::class ], $container->tagged_ids( Hookable::class ) );
    }

    public function test_bootstrap_hooks_each_service_once_and_fires_loaded_once() {
        $container = new Container();
        $bootstrap = new Bootstrap( $container );
        $fired     = did_action( 'wpuf_platform_loaded' );

        $bootstrap->boot();
        $bootstrap->boot();

        $this->assertTrue( $bootstrap->is_booted() );
        $this->assertSame( $fired + 1, did_action( 'wpuf_platform_loaded' ), 'wpuf_platform_loaded fires once' );

        $bootstrap->register_provider( new WPUF_Test_Provider( $container ) );
        // A later provider (e.g. Pro on wpuf_platform_loaded) must not hook earlier services again.
        $bootstrap->register_provider( new WPUF_Test_Empty_Provider( $container ) );

        $this->assertSame( 1, $container->get( WPUF_Test_Hookable_Service::class )->hooked, 'register_hooks() runs once per service' );
    }

    public function test_plugin_boots_the_platform_with_the_core_services() {
        $this->assertTrue( wpuf()->platform_bootstrap()->is_booted() );
        $this->assertInstanceOf( Container::class, wpuf()->platform() );
        $this->assertInstanceOf( HookBridge::class, wpuf()->platform()->get( HookBridge::class, 'post', [] ) );
    }

    public function test_legacy_accessor_keeps_its_keys_and_returns_null_for_unknown() {
        $this->assertInstanceOf( \WeDevs\Wpuf\Admin\Forms\Field_Manager::class, wpuf()->fields );
        $this->assertInstanceOf( \WeDevs\Wpuf\Admin\Subscription::class, wpuf()->subscription );
        $this->assertInstanceOf( \WeDevs\Wpuf\Integrations::class, wpuf()->integrations );
        $this->assertNull( wpuf()->no_such_service );
        $this->assertNull( wpuf()->{HookBridge::class}, 'factory-only platform services are not exposed as properties' );
    }
}
