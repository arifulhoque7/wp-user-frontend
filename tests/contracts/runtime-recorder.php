<?php
/**
 * Plugin Name: WPUF contract runtime recorder (tests only)
 * Description: Records per admin screen the WPUF hooks fired (with argument count), script/style handles and localized globals with their keys. Copy into wp-content/mu-plugins on a TEST site; enable with `wp option update wpuf_contract_record <label>`.
 *
 * Output: wp-content/uploads/wpuf-contracts/<label>/<screen>.json
 *
 * @package WP_User_Frontend
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$wpuf_contract_label = get_option( 'wpuf_contract_record' );

if ( ! $wpuf_contract_label || ! is_admin() || wp_doing_ajax() ) {
    return;
}

$GLOBALS['wpuf_contract_hooks'] = [];

add_action(
    'all',
    function ( $name ) {
        if ( ! preg_match( '/wpuf|user_frontend|user-frontend/i', $name ) ) {
            return;
        }

        $count = func_num_args() - 1;

        if ( ! isset( $GLOBALS['wpuf_contract_hooks'][ $name ] ) ) {
            $GLOBALS['wpuf_contract_hooks'][ $name ] = [
                'args'  => $count,
                'calls' => 0,
                'kind'  => doing_filter( $name ) && ! did_action( $name ) ? 'filter' : 'action',
            ];
        }

        $GLOBALS['wpuf_contract_hooks'][ $name ]['calls']++;
        $GLOBALS['wpuf_contract_hooks'][ $name ]['args'] = max( $GLOBALS['wpuf_contract_hooks'][ $name ]['args'], $count );
    }
);

/**
 * Returns the key tree of a decoded value, two levels deep.
 *
 * @param mixed $value Value.
 * @param int   $depth Remaining depth.
 *
 * @return mixed
 */
function wpuf_contract_keys( $value, $depth = 2 ) {
    if ( ! is_array( $value ) ) {
        return gettype( $value );
    }

    if ( array_values( $value ) === $value ) {
        return 'list';
    }

    if ( $depth <= 0 ) {
        return 'map';
    }

    $out = [];

    foreach ( $value as $key => $item ) {
        $out[ $key ] = wpuf_contract_keys( $item, $depth - 1 );
    }

    ksort( $out );

    return $out;
}

/**
 * Collects the WPUF handles of a dependency registry.
 *
 * @param WP_Dependencies $deps Registry.
 *
 * @return array
 */
function wpuf_contract_handles( $deps ) {
    $out = [];

    foreach ( $deps->registered as $handle => $item ) {
        $src = is_string( $item->src ) ? $item->src : '';

        if ( ! preg_match( '/wpuf/i', $handle ) && ! preg_match( '#plugins/(wp-user-frontend|wpuf-pro)/#', $src ) ) {
            continue;
        }

        $globals = [];

        if ( ! empty( $item->extra['data'] ) && preg_match_all( '/var\s+([A-Za-z0-9_]+)\s*=\s*(.*?);\s*(?=var\s|$)/s', $item->extra['data'], $matches, PREG_SET_ORDER ) ) {
            foreach ( $matches as $match ) {
                $globals[ $match[1] ] = wpuf_contract_keys( json_decode( $match[2], true ) );
            }
        }

        $out[ $handle ] = [
            'src'      => preg_replace( '#^.*?/wp-content/plugins/#', '', $src ),
            'deps'     => array_values( $item->deps ),
            'enqueued' => in_array( $handle, $deps->done, true ) || in_array( $handle, $deps->queue, true ),
            'globals'  => $globals,
        ];
    }

    ksort( $out );

    return $out;
}

add_action(
    'shutdown',
    function () use ( $wpuf_contract_label ) {
        $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;

        if ( ! $screen || ! preg_match( '/wpuf|user-frontend|user_frontend/i', $screen->id . ' ' . $screen->post_type ) ) {
            return;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $suffix = isset( $_GET['action'] ) ? '-' . sanitize_key( wp_unslash( $_GET['action'] ) ) : '';
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $suffix .= isset( $_GET['tab'] ) ? '-' . sanitize_key( wp_unslash( $_GET['tab'] ) ) : '';
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended
        $suffix .= isset( $_GET['wpuf_settings_ui'] ) ? '-' . sanitize_key( wp_unslash( $_GET['wpuf_settings_ui'] ) ) : '';

        $hooks = $GLOBALS['wpuf_contract_hooks'];
        ksort( $hooks );

        $data = [
            'screen'  => $screen->id,
            'scripts' => wpuf_contract_handles( wp_scripts() ),
            'styles'  => wpuf_contract_handles( wp_styles() ),
            'hooks'   => $hooks,
        ];

        $dir = WP_CONTENT_DIR . '/uploads/wpuf-contracts/' . sanitize_key( $wpuf_contract_label );
        wp_mkdir_p( $dir );
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
        file_put_contents( $dir . '/' . sanitize_key( $screen->id . $suffix ) . '.json', wp_json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ) );
    },
    PHP_INT_MAX
);
