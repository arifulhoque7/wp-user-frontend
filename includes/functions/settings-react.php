<?php
/**
 * Helpers that bridge the legacy settings schema to the React settings screen.
 *
 * The React screen renders whatever wpuf_settings_sections() /
 * wpuf_settings_fields() produce (already hook-filtered, so Pro and module
 * fields are included). These helpers only describe how those sections map
 * onto the redesigned tab IA and which optional modules are active — they
 * never change where or how a setting is stored.
 *
 * @package WP_User_Frontend
 * @since   WPUF_SINCE
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( 'wpuf_settings_react_ia' ) ) {
    /**
     * Information architecture map for the redesigned settings screen.
     *
     * Maps the new top-level tabs (and their sub-groups) onto the existing
     * legacy section ids. A tab may pull from more than one section. Tabs and
     * groups are presentational only; storage stays keyed by section id.
     *
     * @since WPUF_SINCE
     *
     * @return array
     */
    function wpuf_settings_react_ia() {
        // The redesigned (Figma) tabs that consolidate several legacy sections.
        $ia = [
            [
                'id'       => 'general',
                'title'    => __( 'General', 'wp-user-frontend' ),
                'icon'     => 'cog',
                'sections' => [ 'wpuf_general' ],
            ],
            [
                'id'       => 'frontend_posting',
                'title'    => __( 'Frontend Posting', 'wp-user-frontend' ),
                'icon'     => 'document',
                'sections' => [ 'wpuf_frontend_posting', 'wpuf_dashboard' ],
            ],
            [
                'id'       => 'login_registration',
                'title'    => __( 'Login & Registration', 'wp-user-frontend' ),
                'icon'     => 'login',
                // My Account + Login/Registration + Social Login as sub-tabs.
                'sections' => [ 'wpuf_my_account', 'wpuf_profile', 'wpuf_social_api' ],
                'subtabs'  => true,
            ],
            [
                'id'       => 'email',
                'title'    => __( 'Email', 'wp-user-frontend' ),
                'icon'     => 'mail',
                'sections' => [ 'wpuf_mails' ],
            ],
            [
                'id'       => 'sms',
                'title'    => __( 'SMS', 'wp-user-frontend' ),
                'icon'     => 'chat',
                'sections' => [ 'wpuf_sms' ],
                'module'   => 'sms',
            ],
            [
                'id'       => 'payments',
                'title'    => __( 'Payments', 'wp-user-frontend' ),
                'icon'     => 'credit-card',
                // Payments + Invoices + Tax as sub-tabs.
                'sections' => [ 'wpuf_payment', 'wpuf_payment_invoices', 'wpuf_payment_tax' ],
                'subtabs'  => true,
            ],
            [
                'id'       => 'advanced',
                'title'    => __( 'Advanced', 'wp-user-frontend' ),
                'icon'     => 'adjustments',
                // Privacy + Content Filtering + SEO as sub-tabs.
                'sections' => [ 'wpuf_privacy', 'wpuf_content_restriction', 'wpuf_seo_settings' ],
                'subtabs'  => true,
            ],
            [
                'id'       => 'integrations',
                'title'    => __( 'Integrations', 'wp-user-frontend' ),
                'icon'     => 'puzzle',
                // AI + n8n as sub-tabs.
                'sections' => [ 'wpuf_ai', 'n8n' ],
                'subtabs'  => true,
            ],
        ];

        // Drop sections that aren't actually registered (e.g. free-only Pro
        // preview stubs that don't exist once Pro is active, where the real
        // feature lives elsewhere). Keep only existing sections per tab, and
        // remove any tab left with no sections.
        $existing_ids = wp_list_pluck( wpuf_settings_sections(), 'id' );

        foreach ( $ia as $i => $tab ) {
            $ia[ $i ]['sections'] = array_values( array_intersect( $tab['sections'], $existing_ids ) );
        }

        $ia = array_values(
            array_filter(
                $ia,
                static function ( $tab ) {
                    return ! empty( $tab['sections'] );
                }
            )
        );

        // Append every registered section not already claimed by a tab above, so
        // Pro / module sections remain reachable — never dropped.
        $claimed = [];
        foreach ( $ia as $tab ) {
            foreach ( $tab['sections'] as $sid ) {
                $claimed[ $sid ] = true;
            }
        }

        /**
         * Sections that have their own dedicated React admin UI and should NOT
         * be surfaced as a tab on the settings screen (e.g. User Directory).
         *
         * @since WPUF_SINCE
         *
         * @param array $excluded Section ids to exclude from the settings tabs.
         */
        $excluded = apply_filters( 'wpuf_settings_react_excluded_sections', [ 'user_directory' ] );

        foreach ( wpuf_settings_sections() as $section ) {
            $sid = $section['id'];

            if ( isset( $claimed[ $sid ] ) || in_array( $sid, $excluded, true ) ) {
                continue;
            }

            $ia[] = [
                'id'       => $sid,
                'title'    => wp_strip_all_tags( $section['title'] ),
                'icon'     => ! empty( $section['icon'] ) ? $section['icon'] : 'adjustments',
                'sections' => [ $sid ],
            ];
        }

        /**
         * Filter the React settings tab IA.
         *
         * Pro and modules extend the tab map here (e.g. to register the SMS
         * tab sections or insert new tabs) without forking the React UI.
         *
         * @since WPUF_SINCE
         *
         * @param array $ia Tab definitions.
         */
        return apply_filters( 'wpuf_settings_react_ia', $ia );
    }
}

if ( ! function_exists( 'wpuf_settings_react_modules' ) ) {
    /**
     * Active optional-module flags exposed to the React settings screen.
     *
     * Lets the UI gate module-dependent tabs/fields the same way the legacy
     * screen does. The schema itself is already module-aware (inactive modules
     * register no fields), so these flags are only for presentation (e.g.
     * showing an "enable module" prompt versus the real settings).
     *
     * @since WPUF_SINCE
     *
     * @return array
     */
    function wpuf_settings_react_modules() {
        $modules = [
            'is_pro'              => class_exists( 'WP_User_Frontend_Pro' ),
            'sms'                 => false,
            'social_login'        => false,
            'content_restriction' => false,
            'geolocation'         => false,
        ];

        /**
         * Filter the active-module flags for the React settings screen.
         *
         * Pro and module bootstraps set their own flag to true here.
         *
         * @since WPUF_SINCE
         *
         * @param array $modules Module flags.
         */
        return apply_filters( 'wpuf_settings_react_modules', $modules );
    }
}


/**
 * Mask a secret for display, the way the legacy settings screen shows it:
 * the first and last `$visible` characters, asterisks in between; secrets too
 * short to keep anything hidden become all asterisks.
 *
 * @since WPUF_SINCE
 *
 * @param string $value   Stored secret.
 * @param int    $visible Characters kept at each end.
 *
 * @return string Masked value, or '' when no secret is stored.
 */
function wpuf_settings_mask_secret( $value, $visible = 2 ) {
    $value  = (string) $value;
    $length = strlen( $value );

    if ( 0 === $length ) {
        return '';
    }

    if ( $length <= $visible * 2 ) {
        return str_repeat( '*', $length );
    }

    return substr( $value, 0, $visible ) . str_repeat( '*', $length - ( $visible * 2 ) ) . substr( $value, -$visible );
}

/**
 * Whether a submitted secret is just the masked copy sent to the browser,
 * in which case the stored secret must be kept.
 *
 * @since WPUF_SINCE
 *
 * @param mixed  $incoming Submitted value.
 * @param string $stored   Stored secret.
 * @param int    $visible  Characters kept at each end by the mask.
 *
 * @return bool
 */
function wpuf_settings_is_masked_secret( $incoming, $stored, $visible = 2 ) {
    return is_string( $incoming ) && '' !== (string) $stored && wpuf_settings_mask_secret( $stored, $visible ) === $incoming;
}

/**
 * AI section: inject per-provider model lists + each provider's stored key so the
 * React AI panel can re-filter the model dropdown and swap the key field when the
 * provider changes (the legacy screen did this with jQuery).
 *
 * @since WPUF_SINCE
 *
 * @param array $data REST settings payload.
 *
 * @return array
 */
function wpuf_ai_react_inject_data( $data ) {
    if ( ! class_exists( '\WeDevs\Wpuf\AI\Config' ) ) {
        return $data;
    }

    $models      = \WeDevs\Wpuf\AI\Config::get_models();
    $by_provider = [];

    if ( is_array( $models ) ) {
        foreach ( $models as $model_id => $model ) {
            $provider = isset( $model['provider'] ) ? $model['provider'] : '';
            if ( '' === $provider ) {
                continue;
            }
            $by_provider[ $provider ][ $model_id ] = isset( $model['name'] ) ? $model['name'] : $model_id;
        }
    }

    $ai   = get_option( 'wpuf_ai', [] );
    $ai   = is_array( $ai ) ? $ai : [];
    $keys = [];
    foreach ( [ 'openai', 'anthropic', 'google' ] as $provider ) {
        // Masked like the legacy AI key field; the real key never leaves the server.
        $keys[ $provider ] = isset( $ai[ $provider . '_api_key' ] ) ? wpuf_settings_mask_secret( $ai[ $provider . '_api_key' ], 4 ) : '';
    }

    if ( ! isset( $data['extra'] ) || ! is_array( $data['extra'] ) ) {
        $data['extra'] = [];
    }

    $data['extra']['ai'] = [
        'models_by_provider' => $by_provider,
        'keys'               => $keys,
    ];

    // The raw provider keys also sit in the section values; mask them there too.
    foreach ( [ 'openai', 'anthropic', 'google' ] as $provider ) {
        if ( isset( $data['values']['wpuf_ai'][ $provider . '_api_key' ] ) ) {
            $data['values']['wpuf_ai'][ $provider . '_api_key' ] = $keys[ $provider ];
        }
    }

    return $data;
}
add_filter( 'wpuf_settings_rest_data', 'wpuf_ai_react_inject_data' );

/**
 * Persist every provider's AI key from the React panel's `extra.ai.keys` so
 * switching providers doesn't lose another provider's saved key.
 *
 * @since WPUF_SINCE
 *
 * @param array $saved    Saved section values (unused).
 * @param array $incoming Raw section payload (unused).
 * @param array $extra    Custom own-option payload.
 *
 * @return void
 */
function wpuf_ai_react_persist_keys( $saved, $incoming, $extra ) {
    if ( ! is_array( $extra ) || empty( $extra['ai']['keys'] ) || ! is_array( $extra['ai']['keys'] ) ) {
        return;
    }

    $ai = get_option( 'wpuf_ai', [] );
    $ai = is_array( $ai ) ? $ai : [];

    foreach ( [ 'openai', 'anthropic', 'google' ] as $provider ) {
        if ( ! isset( $extra['ai']['keys'][ $provider ] ) ) {
            continue;
        }

        $stored = isset( $ai[ $provider . '_api_key' ] ) ? $ai[ $provider . '_api_key' ] : '';

        // The masked copy coming back means "unchanged".
        if ( wpuf_settings_is_masked_secret( $extra['ai']['keys'][ $provider ], $stored, 4 ) ) {
            continue;
        }

        $ai[ $provider . '_api_key' ] = sanitize_text_field( wp_unslash( $extra['ai']['keys'][ $provider ] ) );
    }

    unset( $ai['api_key_current'] );

    update_option( 'wpuf_ai', $ai );
}
add_action( 'wpuf_settings_saved', 'wpuf_ai_react_persist_keys', 10, 3 );

/**
 * Profile Forms for User Roles: feed the React role→form mapping table.
 *
 * The legacy `profile_form_roles` callback stores a role→form map nested under
 * `wpuf_profile['roles']`, which the flat React save can't write. These hooks
 * inject the roles, available profile forms and current map on read, and persist
 * the edited map back to `wpuf_profile['roles']` on save (Pro only).
 *
 * @since WPUF_SINCE
 *
 * @param array $data REST settings payload.
 *
 * @return array
 */
function wpuf_profile_roles_react_inject( $data ) {
    $roles = apply_filters( 'wpuf_settings_user_roles', wpuf_get_user_roles() );

    $forms     = get_posts( [ 'numberposts' => -1, 'post_type' => 'wpuf_profile' ] );
    $form_list = [];
    foreach ( $forms as $form ) {
        $form_list[] = [ 'id' => $form->ID, 'title' => $form->post_title ];
    }

    $val = get_option( 'wpuf_profile', [] );
    $map = ( is_array( $val ) && isset( $val['roles'] ) && is_array( $val['roles'] ) ) ? $val['roles'] : [];

    if ( ! isset( $data['extra'] ) || ! is_array( $data['extra'] ) ) {
        $data['extra'] = [];
    }

    $data['extra']['profile_role_forms'] = [
        'roles' => $roles,
        'forms' => $form_list,
        'map'   => $map,
    ];

    return $data;
}
add_filter( 'wpuf_settings_rest_data', 'wpuf_profile_roles_react_inject' );

/**
 * Persist the Profile-Forms-for-Roles map edited through the React screen.
 *
 * @since WPUF_SINCE
 *
 * @param array $saved    Saved section values (unused).
 * @param array $incoming Raw section payload (unused).
 * @param array $extra    Custom own-option payload.
 *
 * @return void
 */
function wpuf_profile_roles_react_save( $saved, $incoming, $extra ) {
    if ( ! class_exists( 'WP_User_Frontend_Pro' ) ) {
        return;
    }

    if ( ! is_array( $extra ) || ! isset( $extra['profile_role_forms']['map'] ) || ! is_array( $extra['profile_role_forms']['map'] ) ) {
        return;
    }

    // The legacy form posted one select per role: the form id as a string,
    // '' for a role without a form.
    $clean = [];
    foreach ( array_keys( (array) apply_filters( 'wpuf_settings_user_roles', wpuf_get_user_roles() ) ) as $role ) {
        $clean[ $role ] = '';
    }

    foreach ( $extra['profile_role_forms']['map'] as $role => $form_id ) {
        $form_id                        = absint( $form_id );
        $clean[ sanitize_key( $role ) ] = $form_id ? (string) $form_id : '';
    }

    $val = get_option( 'wpuf_profile', [] );
    $val = is_array( $val ) ? $val : [];

    // Drop the React proxy field if the flat save wrote it, then store the map.
    unset( $val['profile_form_roles'] );
    $val['roles'] = $clean;

    update_option( 'wpuf_profile', $val );
}
add_action( 'wpuf_settings_saved', 'wpuf_profile_roles_react_save', 10, 3 );

/**
 * Whether the legacy (WeDevs_Settings_API) settings screen should render instead
 * of the React app.
 *
 * Resolution order (first match wins, design.md D12):
 *   1. `?wpuf_settings_ui=legacy|react`: per-request override that needs no DB
 *      write, so a broken React build can still be bypassed.
 *   2. `WPUF_LEGACY_SETTINGS` constant.
 *   3. The current user's choice (user meta `wpuf_settings_ui_mode`).
 *   4. The site default: `wpuf_settings_ui_mode` option ('react' | 'legacy').
 * The `wpuf_use_legacy_settings` filter gets the result of 3 / 4.
 *
 * Both screens read/write the SAME wpuf_* options, so switching never loses or
 * forks data.
 *
 * @since WPUF_SINCE
 *
 * @return bool
 */
function wpuf_settings_use_legacy() {
    if ( isset( $_GET['wpuf_settings_ui'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only view switch.
        return 'legacy' === sanitize_key( wp_unslash( $_GET['wpuf_settings_ui'] ) );
    }

    if ( defined( 'WPUF_LEGACY_SETTINGS' ) && WPUF_LEGACY_SETTINGS ) {
        return true;
    }

    /**
     * Filter whether the legacy settings screen renders.
     *
     * @since WPUF_SINCE
     *
     * @param bool $is_legacy
     */
    return (bool) apply_filters( 'wpuf_use_legacy_settings', 'legacy' === wpuf_settings_ui_mode() );
}

/**
 * The persisted settings UI mode of the current user: their own choice, else
 * the site default.
 *
 * @since WPUF_SINCE
 *
 * @return string 'react' or 'legacy'
 */
function wpuf_settings_ui_mode() {
    $user_mode = get_current_user_id() ? get_user_meta( get_current_user_id(), 'wpuf_settings_ui_mode', true ) : '';

    if ( in_array( $user_mode, [ 'react', 'legacy' ], true ) ) {
        return $user_mode;
    }

    return 'legacy' === get_option( 'wpuf_settings_ui_mode', 'react' ) ? 'legacy' : 'react';
}

/**
 * Toggle the current user's settings UI mode (nonce + capability protected),
 * then redirect back to the settings page. The site default is not changed.
 *
 * @since WPUF_SINCE
 *
 * @return void
 */
function wpuf_settings_ui_switch() {
    if ( ! isset( $_GET['wpuf_action'] ) || 'switch_settings_ui' !== sanitize_key( wp_unslash( $_GET['wpuf_action'] ) ) ) {
        return;
    }

    if ( ! current_user_can( wpuf_admin_role() ) ) {
        return;
    }

    if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'wpuf_switch_settings_ui' ) ) {
        return;
    }

    update_user_meta( get_current_user_id(), 'wpuf_settings_ui_mode', 'legacy' === wpuf_settings_ui_mode() ? 'react' : 'legacy' );

    wp_safe_redirect( admin_url( 'admin.php?page=wpuf-settings' ) );
    exit;
}
add_action( 'admin_init', 'wpuf_settings_ui_switch' );

/**
 * Nonce-protected URL that toggles the current user's settings UI mode.
 *
 * @since WPUF_SINCE
 *
 * @return string
 */
function wpuf_settings_ui_switch_url() {
    return wp_nonce_url(
        admin_url( 'admin.php?page=wpuf-settings&wpuf_action=switch_settings_ui' ),
        'wpuf_switch_settings_ui'
    );
}

/**
 * Whether to show the one-time "new settings screen" notice to the current
 * user, and remember that it was shown. Only on sites that had WPUF before
 * the React settings screen (a fresh install sets the option to 'no').
 *
 * @since WPUF_SINCE
 *
 * @return bool
 */
function wpuf_settings_new_ui_notice() {
    $user_id = get_current_user_id();

    if ( ! $user_id || 'no' === get_option( 'wpuf_settings_new_ui_notice' ) || get_user_meta( $user_id, 'wpuf_settings_new_ui_seen', true ) ) {
        return false;
    }

    update_user_meta( $user_id, 'wpuf_settings_new_ui_seen', 1 );

    return true;
}

/**
 * Settings other plugins added that only the Classic screen can show: fields
 * rendered by a PHP callback from outside WPUF (free, Pro and their modules
 * have React parts), and section hooks (`wsa_form_top_*` / `wsa_form_bottom_*`)
 * from outside WPUF that print form controls or scripts, which the React
 * screen cannot run (design.md D12, override safety).
 *
 * @since WPUF_SINCE
 *
 * @return string[] Readable names, e.g. "Field label (plugin-folder)".
 */
function wpuf_settings_classic_only_items() {
    global $wp_filter;

    $items = [];
    $roots = array_filter(
        [
            defined( 'WPUF_ROOT' ) ? trailingslashit( wp_normalize_path( WPUF_ROOT ) ) : '',
            defined( 'WPUF_PRO_ROOT' ) ? trailingslashit( wp_normalize_path( WPUF_PRO_ROOT ) ) : '',
        ]
    );

    $source = function ( $callback ) use ( $roots ) {
        try {
            if ( is_string( $callback ) && false !== strpos( $callback, '::' ) ) {
                $callback = explode( '::', $callback, 2 );
            }

            if ( is_array( $callback ) && 2 === count( $callback ) ) {
                $reflection = new ReflectionMethod( $callback[0], $callback[1] );
            } elseif ( is_string( $callback ) || $callback instanceof Closure ) {
                $reflection = new ReflectionFunction( $callback );
            } else {
                return '';
            }
        } catch ( ReflectionException $e ) {
            return '';
        }

        $file = wp_normalize_path( (string) $reflection->getFileName() );

        foreach ( $roots as $root ) {
            if ( 0 === strpos( $file, $root ) ) {
                return '';
            }
        }

        foreach ( [ WP_PLUGIN_DIR, WPMU_PLUGIN_DIR, get_theme_root() ] as $dir ) {
            $dir = trailingslashit( wp_normalize_path( $dir ) );

            if ( 0 === strpos( $file, $dir ) ) {
                return (string) strtok( substr( $file, strlen( $dir ) ), '/' );
            }
        }

        return '' === $file ? '' : basename( $file );
    };

    foreach ( wpuf_settings_fields() as $section_id => $section_fields ) {
        foreach ( (array) $section_fields as $field ) {
            if ( empty( $field['callback'] ) || ! is_callable( $field['callback'] ) ) {
                continue;
            }

            $from = $source( $field['callback'] );

            if ( '' !== $from ) {
                $label   = isset( $field['label'] ) ? wp_strip_all_tags( $field['label'] ) : '';
                $items[] = ( '' !== $label ? $label : ( isset( $field['name'] ) ? $field['name'] : $section_id ) ) . ' (' . $from . ')';
            }
        }

        foreach ( [ 'wsa_form_top_' . $section_id, 'wsa_form_bottom_' . $section_id ] as $hook ) {
            if ( empty( $wp_filter[ $hook ] ) ) {
                continue;
            }

            foreach ( $wp_filter[ $hook ]->callbacks as $callbacks ) {
                foreach ( $callbacks as $callback ) {
                    $from = $source( $callback['function'] );

                    if ( '' === $from ) {
                        continue;
                    }

                    ob_start();
                    call_user_func( $callback['function'], [ 'id' => $section_id ] );
                    $output = (string) ob_get_clean();

                    if ( preg_match( '/<(input|select|textarea|button|script|form)\b/i', $output ) ) {
                        $items[] = $section_id . ' (' . $from . ')';
                    }
                }
            }
        }
    }

    return array_values( array_unique( $items ) );
}

/**
 * Dev guard: warn (in WP_DEBUG) about settings fields the LEGACY screen can't
 * render, so the classic-fallback never silently breaks. The legacy
 * WeDevs_Settings_API renders by `callback_{type}`; a field with an unsupported
 * type and no explicit `callback` would fatal/blank the classic screen — exactly
 * the regression to avoid now that legacy is a supported fallback.
 *
 * Read-only, dev-only — never runs in production, changes no data.
 *
 * @since WPUF_SINCE
 *
 * @return void
 */
function wpuf_settings_legacy_compat_check() {
    if ( ! ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ) {
        return;
    }

    $supported = [
        'text',
        'hidden',
        'url',
        'number',
        'checkbox',
        'multicheck',
        'gateway_selector',
        'radio',
        'radio_inline',
        'select',
        'textarea',
        'html',
        'wysiwyg',
        'file',
        'password',
        'color',
        'toggle',
    ];

    foreach ( wpuf_settings_fields() as $section_id => $section_fields ) {
        if ( ! is_array( $section_fields ) ) {
            continue;
        }

        foreach ( $section_fields as $field ) {
            $type = isset( $field['type'] ) ? $field['type'] : 'text';

            if ( ! in_array( $type, $supported, true ) && empty( $field['callback'] ) ) {
                $name = isset( $field['name'] ) ? $field['name'] : '?';
                error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
                    sprintf(
                        'WPUF settings: field "%1$s" (section "%2$s") uses type "%3$s" which the legacy WeDevs_Settings_API cannot render and has no callback — the classic settings screen will break for this field. Use a supported type, add a callback, or a React render hint.',
                        $name, $section_id, $type
                    )
                );
            }
        }
    }
}
add_action( 'admin_init', 'wpuf_settings_legacy_compat_check', 99 );
