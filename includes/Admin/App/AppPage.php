<?php
/**
 * The single React admin app page
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Admin\App;

use WeDevs\Wpuf\Admin\BootPayload;
use WeDevs\Wpuf\Admin\Screens\Registry;

/**
 * One admin page (the WPUF top-level page) with one React mount: the React
 * screens (forms lists, builders, subscriptions, settings, AI form builder)
 * open there as hash routes, like FlyHR, so moving between them does not
 * reload the page.
 *
 * The screens' old pages stay registered (slugs, capabilities, hook suffixes):
 * their load step runs as before and then redirects to the app route
 * (Screens\Registry::load()). A screen that is not in the app yet keeps its
 * page; the app opens it with a normal page load.
 *
 * @since WPUF_SINCE
 */
class AppPage {

    /**
     * Page slug: the WPUF top-level menu page.
     */
    const SLUG = 'wp-user-frontend';

    /**
     * Script handle of the app shell.
     */
    const HANDLE = 'wpuf-admin-app';

    /**
     * Screen registry.
     *
     * @var Registry
     */
    private $screens;

    /**
     * Boot payload.
     *
     * @var BootPayload
     */
    private $boot;

    /**
     * Constructor.
     *
     * @param Registry    $screens Screen registry
     * @param BootPayload $boot    Boot payload
     */
    public function __construct( Registry $screens, BootPayload $boot ) {
        $this->screens = $screens;
        $this->boot    = $boot;
    }

    /**
     * Hooks of the app page (called from Menu::admin_menu when the app is on).
     *
     * @since WPUF_SINCE
     *
     * @param string $hook_suffix Hook suffix of the app page
     *
     * @return void
     */
    public function register( $hook_suffix ) {
        add_action( 'load-' . $hook_suffix, [ $this, 'load' ] );
        add_action( 'admin_head', [ $this, 'point_menu_rows_at_app' ] );
    }

    /**
     * Routes of the app: every screen's routes, in app or page mode.
     *
     * @since WPUF_SINCE
     *
     * @return array[]
     */
    public function routes() {
        $routes = [];

        foreach ( $this->screens->all() as $screen ) {
            foreach ( $screen->app_routes() as $route ) {
                $routes[] = array_merge(
                    [
                        'notices' => false,
                        'menu'    => $screen->slug(),
                    ],
                    $route,
                    [
                        'screen' => $screen->slug(),
                        'mode'   => ! empty( $route['in_app'] ) ? 'app' : 'page',
                        'page'   => isset( $route['page'] ) ? admin_url( $route['page'] ) : admin_url( 'admin.php?page=' . $screen->slug() ),
                    ]
                );
            }
        }

        /**
         * Filters the routes of the admin app.
         *
         * @since WPUF_SINCE
         *
         * @param array[] $routes Routes.
         */
        return (array) apply_filters( 'wpuf_admin_app_routes', $routes );
    }

    /**
     * Load step of the app page: load every screen that runs in the app, the
     * way its own page loads it, then the shell.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function load() {
        $globals = [];

        foreach ( $this->screens->all() as $screen ) {
            if ( ! $screen->in_app() || ! current_user_can( $screen->capability() ) ) {
                continue;
            }

            $notices = $this->notice_callbacks();
            $screen->load_in_app();
            // A screen's load step may remove admin notices for its own page
            // (wpuf_remove_admin_notices); other routes still show them.
            $this->restore_notice_callbacks( $notices );

            // Per screen: the post and registration lists use the same global names.
            $globals[ $screen->slug() ] = (array) $screen->app_globals();
        }

        wp_enqueue_script( self::HANDLE );
        wp_set_script_translations( self::HANDLE, 'wp-user-frontend', WPUF_ROOT . '/languages' );

        $this->boot->attach_app(
            self::HANDLE,
            [
                'routes'       => $this->routes(),
                'initialRoute' => $this->initial_route(),
                'globals'      => $globals,
                'pageUrl'      => admin_url( 'admin.php?page=' . self::SLUG ),
            ]
        );

        add_filter( 'admin_body_class', [ $this, 'body_class' ] );
        add_filter( 'admin_footer_text', '__return_empty_string', 99 );
        add_filter( 'update_footer', '__return_empty_string', 99 );
        add_action( 'admin_notices', [ $this, 'start_notices' ], PHP_INT_MIN );
        add_action( 'all_admin_notices', [ $this, 'end_notices' ], PHP_INT_MAX );
    }

    /**
     * Render the app mount.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function render() {
        echo '<div class="wpuf-admin-app-wrap">';
        echo '<div class="wpuf-admin-notices" id="wpuf-admin-app-notices" hidden>' . $this->notices . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- other plugins' notice markup, printed as WordPress would.
        echo '<div id="wpuf-admin-app" class="wpuf-admin-app"></div>';
        echo '</div>';
    }

    /**
     * Notices printed while the app page loads; the app shows them on routes
     * that show notices.
     *
     * @var string
     */
    private $notices = '';

    /**
     * Start capturing admin notices.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function start_notices() {
        ob_start();
    }

    /**
     * Stop capturing admin notices.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function end_notices() {
        $this->notices = (string) ob_get_clean();
    }

    /**
     * Body classes of the app page.
     *
     * @since WPUF_SINCE
     *
     * @param string $classes Admin body classes
     *
     * @return string
     */
    public function body_class( $classes ) {
        return trim( $classes . ' wpuf-admin-react wpuf-admin-app' );
    }

    /**
     * Point the WPUF submenu rows of screens in the app at their app route, so
     * a click is a hash change, not a page load. Registration is untouched
     * (slugs, capabilities, hook suffixes); only the printed link changes.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    public function point_menu_rows_at_app() {
        global $submenu;

        if ( empty( $submenu[ self::SLUG ] ) ) {
            return;
        }

        $links = [];

        foreach ( $this->routes() as $route ) {
            if ( 'app' === $route['mode'] && ! empty( $route['menuLink'] ) && ! isset( $links[ $route['menu'] ] ) ) {
                $links[ $route['menu'] ] = 'admin.php?page=' . self::SLUG . '#' . $route['path'];
            }
        }

        foreach ( $submenu[ self::SLUG ] as $index => $row ) {
            if ( isset( $links[ $row[2] ] ) ) {
                $submenu[ self::SLUG ][ $index ][2] = $links[ $row[2] ]; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
            }
        }
    }

    /**
     * The route the server asked for (old page redirects), else ''.
     *
     * @return string
     */
    private function initial_route() {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only route selection.
        $route = isset( $_GET['wpuf_route'] ) ? sanitize_text_field( wp_unslash( $_GET['wpuf_route'] ) ) : '';

        return 0 === strpos( $route, '/' ) ? $route : '';
    }

    /**
     * The admin notice hooks' callbacks.
     *
     * @return array
     */
    private function notice_callbacks() {
        global $wp_filter;

        $saved = [];

        foreach ( [ 'admin_notices', 'all_admin_notices', 'network_admin_notices', 'user_admin_notices', 'in_admin_header' ] as $hook ) {
            $saved[ $hook ] = isset( $wp_filter[ $hook ] ) ? clone $wp_filter[ $hook ] : null;
        }

        return $saved;
    }

    /**
     * Undo what a screen's load step did to the notice hooks for its own page:
     * callbacks it removed from the notice hooks come back (other routes show
     * notices; notices it added stay), and `in_admin_header` is put back as it
     * was (e.g. `wpuf_remove_admin_notices` added for that screen's page).
     *
     * @param array $saved Callbacks from notice_callbacks()
     *
     * @return void
     */
    private function restore_notice_callbacks( array $saved ) {
        global $wp_filter;

        foreach ( $saved as $hook => $before ) {
            if ( 'in_admin_header' === $hook ) {
                if ( null === $before ) {
                    unset( $wp_filter[ $hook ] );
                } else {
                    $wp_filter[ $hook ] = $before; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
                }

                continue;
            }

            if ( null === $before ) {
                continue;
            }

            foreach ( $before->callbacks as $priority => $callbacks ) {
                foreach ( $callbacks as $id => $callback ) {
                    if ( ! isset( $wp_filter[ $hook ]->callbacks[ $priority ][ $id ] ) ) {
                        add_action( $hook, $callback['function'], $priority, $callback['accepted_args'] );
                    }
                }
            }
        }
    }
}
