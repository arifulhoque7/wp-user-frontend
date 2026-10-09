<?php
/**
 * Onboarding: recommended plugins
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Onboarding;

use WeDevs\Wpuf\Admin\Onboarding;

/**
 * The wizard's plugin step: the recommended plugins and gateway cards, what is
 * still missing, installing and activating a plugin within the request's time
 * budget, and the Pro user directory module switch.
 *
 * @since WPUF_SINCE Moved out of Admin\Onboarding, which delegates to it.
 */
class Plugin_Installer {

    /**
     * Step 6: companion plugins
     *
     * Plugins are installed over ajax from the step itself, so nothing is
     * saved here beyond marking the step as visited.
     *
     * @since WPUF_SINCE
     *
     * @param string[] $picked Slugs the admin picked.
     *
     * @return void
     */
    public function save( $picked ) {
        $plugins = $this->get_recommended_plugins();
        $errors  = [];

        if ( ! $picked || ! current_user_can( 'install_plugins' ) ) {
            delete_option( Onboarding::PLUGIN_ERRORS_OPTION );

            return;
        }

        // Four plugins downloaded one after another in a single request is the
        // slowest thing the wizard does, and on a host with a short
        // max_execution_time it is what times out. Ask for room, then keep an eye
        // on the clock and stop cleanly rather than being killed mid-install.
        wp_raise_memory_limit( 'admin' );

        $budget = $this->get_install_time_budget();
        $started = microtime( true );

        foreach ( $picked as $slug ) {
            if ( ! isset( $plugins[ $slug ] ) ) {
                continue;
            }

            // Stop while there is still time to render a page. Whatever is left is
            // reported rather than silently dropped, and the step reappears with
            // those plugins still on it, so a second click finishes the job.
            if ( $budget > 0 && ( microtime( true ) - $started ) > $budget ) {
                $errors[ $plugins[ $slug ]['name'] ] = __( 'Not installed yet: the wizard ran out of time on this request. Select it again to finish.', 'wp-user-frontend' );

                continue;
            }

            // Each plugin gets its own slice of the clock where the host allows it.
            if ( function_exists( 'set_time_limit' ) ) {
                // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- disabled on some hosts.
                @set_time_limit( 120 );
            }

            $result = $this->install_and_activate( $slug );

            if ( is_wp_error( $result ) ) {
                $errors[ $plugins[ $slug ]['name'] ] = $result->get_error_message();
            }
        }

        if ( $errors ) {
            update_option( Onboarding::PLUGIN_ERRORS_OPTION, $errors );
        } else {
            delete_option( Onboarding::PLUGIN_ERRORS_OPTION );
        }
    }

    /**
     * How long this request may spend installing before it stops
     *
     * Leaves roughly a quarter of the host's execution time to render the next
     * screen, so a run that cannot finish reports what is left instead of dying
     * half way. Returns 0 when the host sets no limit, in which case there is
     * nothing to budget against.
     *
     * @since WPUF_SINCE
     *
     * @return float seconds, 0 when the host imposes no limit
     */
    protected function get_install_time_budget() {
        $limit = (int) ini_get( 'max_execution_time' );

        if ( $limit <= 0 ) {
            return 0;
        }

        return max( 5, $limit * 0.75 );
    }

    /**
     * The gateways offered on the settings step, with what each one still needs
     *
     * Built from the same source the settings screen renders, then annotated so a
     * card can say whether it is ready to take money or still wants credentials.
     * Bank transfer is the only one that works on the spot, which is why it is the
     * default; the rest send the admin to Settings afterwards.
     *
     * Stripe is added back when nothing registered it. Without this the card
     * simply vanishes on a Pro site whose Stripe module is switched off, which
     * reads as "we do not support Stripe" rather than "turn the module on".
     *
     * @since WPUF_SINCE
     *
     * @return array gateway id => card data
     */
    public function get_gateway_cards() {
        $gateways = wpuf_get_gateways( 'gateway_selector' );
        $gateways = is_array( $gateways ) ? $gateways : [];

        if ( ! isset( $gateways['stripe'] ) ) {
            $gateways['stripe'] = [
                'admin_label'    => __( 'Credit Card', 'wp-user-frontend' ),
                'icon'           => '',
                'is_pro_preview' => ! wpuf_is_pro_active(),
            ];

            // Pro is here, so the gateway is available; its module is just off.
            if ( wpuf_is_pro_active() ) {
                $gateways['stripe']['needs_module'] = true;
            }
        }

        // Anything that cannot take a payment until the admin enters credentials.
        $needs_credentials = [ 'paypal', 'stripe' ];

        foreach ( $gateways as $id => $gateway ) {
            $is_pro_preview = ! empty( $gateway['is_pro_preview'] );

            $gateways[ $id ]['is_pro_preview'] = $is_pro_preview;
            // A gateway whose module is off cannot take keys yet; its card says so.
            $gateways[ $id ]['needs_setup'] = ! $is_pro_preview && empty( $gateway['needs_module'] ) && in_array( $id, $needs_credentials, true );

            if ( ! empty( $gateway['needs_module'] ) ) {
                $gateways[ $id ]['hint'] = __( 'Turn the Stripe module on in Modules, then add your keys.', 'wp-user-frontend' );
            } elseif ( $is_pro_preview ) {
                $gateways[ $id ]['hint'] = __( 'Comes with Pro.', 'wp-user-frontend' );
            } elseif ( $gateways[ $id ]['needs_setup'] ) {
                $gateways[ $id ]['hint'] = __( 'Needs your API keys in Settings.', 'wp-user-frontend' );
            } else {
                $gateways[ $id ]['hint'] = __( 'Works right away.', 'wp-user-frontend' );
            }
        }

        /**
         * Filter the gateway cards shown on the onboarding settings step
         *
         * @since WPUF_SINCE
         *
         * @param array $gateways Gateway id => card data.
         */
        $gateways = apply_filters( 'wpuf_onboarding_gateway_cards', $gateways );

        return is_array( $gateways ) ? $gateways : [];
    }

    /**
     * The recommended plugins that are not running yet
     *
     * A plugin that is later deactivated or deleted comes back on the list,
     * and with it the step.
     *
     * @since WPUF_SINCE
     *
     * @return array slug => plugin
     */
    public function get_pending_plugins() {
        if ( ! function_exists( 'is_plugin_active' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $pending = [];

        foreach ( $this->get_recommended_plugins() as $slug => $plugin ) {
            $file = $this->get_installed_file( $plugin['file'] );

            if ( $file && is_plugin_active( $file ) ) {
                continue;
            }

            $plugin['installed'] = (bool) $file;

            $pending[ $slug ] = $plugin;
        }

        return $pending;
    }

    /**
     * Install a recommended plugin from wordpress.org and switch it on
     *
     * @since WPUF_SINCE
     *
     * @param string $slug
     *
     * @return true|\WP_Error
     */
    public function install_and_activate( $slug ) {
        $plugins = $this->get_recommended_plugins();

        if ( ! isset( $plugins[ $slug ] ) ) {
            return new \WP_Error( 'unknown_plugin', __( 'Unknown plugin.', 'wp-user-frontend' ) );
        }

        $basename = $plugins[ $slug ]['file'];

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

        if ( ! $this->is_plugin_installed( $basename ) ) {
            $api = plugins_api(
                'plugin_information', [
                    'slug'   => $slug,
                    'fields' => [ 'sections' => false ],
                ]
            );

            if ( is_wp_error( $api ) ) {
                return $api;
            }

            $upgrader = new \Plugin_Upgrader( new \Automatic_Upgrader_Skin() );
            $result   = $upgrader->install( $api->download_link );

            if ( is_wp_error( $result ) ) {
                return $result;
            }

            if ( ! $result ) {
                return new \WP_Error( 'install_failed', __( 'Could not install the plugin.', 'wp-user-frontend' ) );
            }
        }

        $installed_file = $this->get_installed_file( $basename );

        if ( ! $installed_file ) {
            return new \WP_Error( 'not_found', __( 'The plugin was not found after installing.', 'wp-user-frontend' ) );
        }

        $activated = activate_plugin( $installed_file );

        if ( is_wp_error( $activated ) ) {
            return $activated;
        }

        $this->clear_activation_redirects();

        return true;
    }

    /**
     * Drop the "just activated" redirects the companion plugins set for themselves
     *
     * Activating a plugin from inside the wizard makes that plugin queue its own
     * welcome or setup redirect, which fires on the next admin screen and throws the
     * admin out of onboarding half way through. Clearing the flags keeps the admin
     * in the wizard; the plugin's own setup screens stay reachable from its menu.
     *
     * Best effort by design. Deleting a transient that was never set is a no-op, and
     * the list is filterable so a plugin using a key not covered here can add it
     * rather than needing a change in this file.
     *
     * @since WPUF_SINCE
     *
     * @return void
     */
    protected function clear_activation_redirects() {
        $default_transients = [
            // WPUF's own, so finishing an install here does not bounce the admin
            // into the legacy setup wizard.
            'wpuf_activation_redirect',
            'wpuf_onboarding_redirect',
            // The companion plugins offered by this step.
            'wemail_activation_redirect',
            'erp_activation_redirect',
            '_erp_setup_page_redirect',
            'wedocs_activation_redirect',
            'pm_activation_redirect',
            'cpm_activation_redirect',
        ];

        /**
         * Filter the activation redirect flags cleared after a companion plugin installs
         *
         * @since WPUF_SINCE
         *
         * @param array $transients Transient names to delete.
         */
        $transients = apply_filters( 'wpuf_onboarding_activation_redirects', $default_transients );
        $transients = ! empty( $transients ) && is_array( $transients ) ? $transients : $default_transients;

        foreach ( $transients as $transient ) {
            if ( is_string( $transient ) && '' !== $transient ) {
                delete_transient( $transient );
            }
        }
    }

    /**
     * The companion plugins offered in the wizard
     *
     * @since WPUF_SINCE
     *
     * @return array
     */
    public function get_recommended_plugins() {
        $plugins = [
            'wemail'              => [
                'logo' => 'onboarding/wemail.svg',
                'name' => __( 'weMail', 'wp-user-frontend' ),
                'file' => 'wemail/wemail.php',
                'desc' => __( 'Welcome mails, newsletters and campaigns to the people who sign up.', 'wp-user-frontend' ),
            ],
            'erp'                 => [
                'logo' => 'onboarding/erp.svg',
                'name' => __( 'WP ERP', 'wp-user-frontend' ),
                'file' => 'erp/wp-erp.php',
                'desc' => __( 'Turn your members into CRM contacts, with every interaction on one profile.', 'wp-user-frontend' ),
            ],
            'wedocs'              => [
                'logo' => 'onboarding/wedocs.svg',
                'name' => __( 'weDocs', 'wp-user-frontend' ),
                'file' => 'wedocs/wedocs.php',
                'desc' => __( 'A docs area members can read instead of opening a ticket.', 'wp-user-frontend' ),
            ],
            'wedevs-project-manager' => [
                'logo' => 'onboarding/wedevs-project-manager.svg',
                'name' => __( 'WP Project Manager', 'wp-user-frontend' ),
                'file' => 'wedevs-project-manager/cpm.php',
                'desc' => __( 'Run projects and tasks with the members who sign up.', 'wp-user-frontend' ),
            ],
        ];

        /**
         * Filter the plugins recommended during onboarding
         *
         * @since WPUF_SINCE
         *
         * @param array $plugins
         */
        return apply_filters( 'wpuf_onboarding_recommended_plugins', $plugins );
    }

    /**
     * Whether a plugin is present on the site
     *
     * @since WPUF_SINCE
     *
     * @param string $basename
     *
     * @return bool
     */
    public function is_plugin_installed( $basename ) {
        return (bool) $this->get_installed_file( $basename );
    }

    /**
     * The installed plugin file for a basename
     *
     * Plugins are matched by their folder, so a main file we did not guess
     * exactly still resolves to what is really on disk.
     *
     * @since WPUF_SINCE
     *
     * @param string $basename
     *
     * @return string empty when the plugin is not installed
     */
    public function get_installed_file( $basename ) {
        if ( ! function_exists( 'get_plugins' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $installed = get_plugins();

        if ( array_key_exists( $basename, $installed ) ) {
            return $basename;
        }

        $folder = dirname( $basename );

        foreach ( array_keys( $installed ) as $file ) {
            if ( dirname( $file ) === $folder ) {
                return $file;
            }
        }

        return '';
    }

    /**
     * Turn the Pro user directory module on or off
     *
     * @since WPUF_SINCE
     *
     * @param bool $enable
     *
     * @return void
     */
    public function toggle_pro_directory_module( $enable ) {
        $module = 'user-directory/userlisting.php';

        if ( ! function_exists( 'wpuf_pro_activate_module' ) ) {
            return;
        }

        if ( ! $enable ) {
            wpuf_pro_deactivate_module( $module );

            return;
        }

        if ( function_exists( 'wpuf_pro_is_module_allowed' ) && ! wpuf_pro_is_module_allowed( $module ) ) {
            return;
        }

        wpuf_pro_activate_module( $module );
    }

    /**
     * Whether the user directory is available on this site
     *
     * @since WPUF_SINCE
     *
     * @return bool
     */
    public function is_directory_active() {
        if ( function_exists( 'wpuf_pro_is_module_active' ) && wpuf_pro_is_module_active( 'user-directory/userlisting.php' ) ) {
            return true;
        }

        return function_exists( 'wpuf_free_is_module_active' ) && wpuf_free_is_module_active( 'user_directory' );
    }
}
