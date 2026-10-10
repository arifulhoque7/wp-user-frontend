<?php
/**
 * The upload REST routes and the rate limiter behind the guest routes.
 *
 * @package WP_User_Frontend
 */

use WeDevs\Wpuf\Platform\REST\Rate_Limit;

class UploadsRestTest extends WP_UnitTestCase {

    public function set_up() {
        parent::set_up();

        global $wp_rest_server;
        $wp_rest_server = new WP_REST_Server();

        do_action( 'rest_api_init' );
    }

    private function request( $method, $path, array $params = [] ) {
        $request = new WP_REST_Request( $method, $path );

        foreach ( $params as $key => $value ) {
            $request->set_param( $key, $value );
        }

        return rest_do_request( $request );
    }

    public function test_routes_are_registered() {
        $routes = rest_get_server()->get_routes();

        $this->assertArrayHasKey( '/wpuf/v1/uploads', $routes );
        $this->assertArrayHasKey( '/wpuf/v1/uploads/(?P<id>\d+)', $routes );
    }

    public function test_upload_needs_the_upload_nonce_and_a_form_the_visitor_may_use() {
        $form_id = wpuf_create_sample_form( 'Upload Form', 'wpuf_forms' );

        wp_set_current_user( 0 );
        $this->assertSame( 403, $this->request( 'POST', '/wpuf/v1/uploads', [ 'form_id' => $form_id, 'wpuf_nonce' => 'nope' ] )->get_status() );
        $this->assertSame( 401, $this->request( 'POST', '/wpuf/v1/uploads', [ 'form_id' => $form_id, 'wpuf_nonce' => wp_create_nonce( 'wpuf-upload-nonce' ) ] )->get_status(), 'a login-only form refuses visitors' );

        wp_set_current_user( self::factory()->user->create( [ 'role' => 'subscriber' ] ) );
        $response = $this->request( 'POST', '/wpuf/v1/uploads', [ 'form_id' => $form_id, 'wpuf_nonce' => wp_create_nonce( 'wpuf-upload-nonce' ) ] );

        $this->assertSame( 400, $response->get_status(), 'allowed, but no file in the request' );
        $this->assertSame( 'wpuf_upload_no_file', $response->get_data()['code'] );
    }

    public function test_delete_needs_ownership() {
        $owner = self::factory()->user->create( [ 'role' => 'subscriber' ] );
        $other = self::factory()->user->create( [ 'role' => 'subscriber' ] );
        $file  = DIR_TESTDATA . '/images/canola.jpg';

        wp_set_current_user( $owner );
        $attachment = self::factory()->attachment->create_upload_object( $file );
        wp_update_post(
            [
                'ID'          => $attachment,
                'post_author' => $owner,
            ]
        );

        wp_set_current_user( 0 );
        $this->assertSame( 401, $this->request( 'DELETE', '/wpuf/v1/uploads/' . $attachment )->get_status() );

        wp_set_current_user( $other );
        $this->assertSame( 403, $this->request( 'DELETE', '/wpuf/v1/uploads/' . $attachment )->get_status() );
        $this->assertNotNull( get_post( $attachment ) );

        wp_set_current_user( $owner );
        $this->assertSame( 200, $this->request( 'DELETE', '/wpuf/v1/uploads/' . $attachment )->get_status() );
        $this->assertNull( get_post( $attachment ) );
        $this->assertSame( 404, $this->request( 'DELETE', '/wpuf/v1/uploads/' . $attachment )->get_status() );
    }

    public function test_rate_limit_counts_hits_per_key_inside_the_window() {
        wp_set_current_user( 0 );
        $_SERVER['REMOTE_ADDR'] = '203.0.113.9';
        $limiter                = new Rate_Limit();

        $this->assertTrue( $limiter->allow( 'probe', 2, 60 ) );
        $this->assertTrue( $limiter->allow( 'probe', 2, 60 ) );
        $this->assertFalse( $limiter->allow( 'probe', 2, 60 ), 'third hit inside the window is refused' );
        $this->assertTrue( $limiter->allow( 'other', 2, 60 ), 'keys are independent' );

        $_SERVER['REMOTE_ADDR'] = '203.0.113.10';
        $this->assertTrue( $limiter->allow( 'probe', 2, 60 ), 'another client has its own window' );

        add_filter( 'wpuf_rate_limit', '__return_zero' );
        $this->assertTrue( $limiter->allow( 'probe', 2, 60 ), 'a zero limit disables the check' );
        remove_filter( 'wpuf_rate_limit', '__return_zero' );

        wp_set_current_user( self::factory()->user->create() );
        $this->assertSame( 'user:' . get_current_user_id(), $limiter->actor() );
    }
}
