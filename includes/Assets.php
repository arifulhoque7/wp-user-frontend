<?php

namespace WeDevs\Wpuf;

/**
 * The assets handler for WPUF. All the styles and scripts should register from here first.
 * Then we will enqueue them from the related pages.
 *
 * @since 4.0.0
 */
class Assets {

    /**
     * Suffix for the scripts. add `.min` if we are in production
     *
     * @since 4.0.0
     *
     * @var string
     */
    protected $suffix;
    protected $scheme;

    /**
     * The css dependencies list for form builder
     *
     * @since 4.0.0
     *
     * @var array|mixed|null
     */
    public $form_builder_css_deps = [];

    public function __construct() {
        $this->suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';
        $this->scheme = is_ssl() ? 'https' : 'http';
        $this->form_builder_css_deps = apply_filters(
            'wpuf_form_builder_css_deps',
            [
                'wpuf-frontend-forms',
                'wpuf-font-awesome',
                'wpuf-sweetalert2',
                'wpuf-selectize',
                'wpuf-toastr',
                'wpuf-tooltip',
                'buttons',
            ]
        );
        add_action( 'init', [ $this, 'register_all_scripts' ] );
        add_filter( 'style_loader_src', [ $this, 'use_react_forms_styles' ], 10, 2 );
        add_filter( 'admin_body_class', [ $this, 'react_forms_body_class' ] );
    }

    /**
     * Whether this is a React forms list or builder page (post forms, and the
     * registration forms page Pro adds).
     *
     * @since WPUF_SINCE
     *
     * @return bool
     */
    protected function is_react_forms_page() {
        global $plugin_page;

        return is_admin() && in_array( $plugin_page, [ 'wpuf-post-forms', 'wpuf-profile-forms' ], true );
    }

    /**
     * On the React forms lists and builders, serve the Tailwind 4 sheet
     * (assets/css/admin/forms-react.css) once, in the place the old sheets had
     * in the cascade: on the builders through admin/form-builder.css (head), on
     * the lists through forms-list.min.css (enqueued while rendering, printed
     * after Pro's styles), with the other handle printing nothing. Done when the
     * tag is printed, so every handle Free and Pro enqueue keeps working. The
     * classic post edit screen keeps the old sheet.
     *
     * @since WPUF_SINCE
     *
     * @param string $src    Stylesheet URL
     * @param string $handle Style handle
     *
     * @return string|false
     */
    public function use_react_forms_styles( $src, $handle = '' ) {
        if ( ! in_array( $handle, [ 'wpuf-admin-form-builder', 'wpuf-forms-list' ], true ) || ! $this->is_react_forms_page() ) {
            return $src;
        }

        $action  = isset( $_GET['action'] ) ? sanitize_key( wp_unslash( $_GET['action'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only view switch.
        $builder = in_array( $action, [ 'edit', 'add-new' ], true );
        $serves  = $builder ? 'wpuf-admin-form-builder' : 'wpuf-forms-list';

        if ( $handle !== $serves ) {
            return false;
        }

        return add_query_arg( 'ver', WPUF_VERSION, WPUF_ASSET_URI . '/css/admin/forms-react.css' );
    }

    /**
     * The Tailwind 4 sheet scopes its utilities to this body class.
     *
     * @since WPUF_SINCE
     *
     * @param string $classes Admin body classes
     *
     * @return string
     */
    public function react_forms_body_class( $classes ) {
        if ( ! $this->is_react_forms_page() ) {
            return $classes;
        }

        return trim( $classes . ' wpuf-admin-react' );
    }

    /**
     * Register all the css and js from here
     *
     * @since 4.0.0
     *
     * @return void
     */
    public function register_all_scripts() {
        $styles  = $this->get_styles();
        $scripts = $this->get_scripts();
        do_action( 'wpuf_before_register_scripts', $scripts, $styles );
        $this->register_styles( $styles );
        $this->register_scripts( $scripts );

        // The shared admin components (window.wpuf.components) print their own
        // strings, so they load translations like the screens do.
        wp_set_script_translations( 'wpuf-admin-ui', 'wp-user-frontend' );

        do_action( 'wpuf_after_register_scripts', $scripts, $styles );
    }

    /**
     * Register the CSS from here. Need to define the JS first from get_styles()
     *
     * @since 4.0.0
     *
     * @return void
     */
    public function register_styles( $styles ) {
        foreach ( $styles as $handle => $style ) {
            $deps    = ! empty( $style['deps'] ) ? $style['deps'] : [];
            $version = ! empty( $style['version'] ) ? $style['version'] : WPUF_VERSION;
            $media   = ! empty( $style['media'] ) ? $style['media'] : 'all';

            wp_register_style( 'wpuf-' . $handle, $this->existing_src( $style['src'] ), $deps, $version, $media );

            if ( ! empty( $style['rtl'] ) ) {
                wp_style_add_data( 'wpuf-' . $handle, 'rtl', 'replace' );
            }
        }
    }

    /**
     * Register the JS from here. Need to define the JS first from get_scripts()
     *
     * @since 4.0.0
     *
     * @return void
     */
    public function register_scripts( $scripts ) {
        foreach ( $scripts as $handle => $script ) {
            $deps      = ! empty( $script['deps'] ) ? $script['deps'] : [];
            $in_footer = ! empty( $script['in_footer'] ) ? $script['in_footer'] : true;
            $version   = ! empty( $script['version'] ) ? $script['version'] : WPUF_VERSION;

            wp_register_script( 'wpuf-' . $handle, $this->existing_src( $script['src'] ), $deps, $version, $in_footer );
        }

        // The Vue builder mixins are gone. Scripts that still extend them (e.g. the
        // pro QR-code module) get empty mixins so their old registration is a no-op.
        wp_add_inline_script(
            'wpuf-form-builder-mixins',
            'window.wpuf_mixins = window.wpuf_mixins || {};'
            . '["form_field_mixin","option_field_mixin","add_form_field","global_mixin"].forEach(function(k){ window.wpuf_mixins[k] = window.wpuf_mixins[k] || {}; });',
            'after'
        );
    }

    /**
     * Source URL for a handle, or false when it points to a plugin file that is
     * not on disk (e.g. a removed legacy build). The handle is then registered
     * without a file: dependents and localized data keep working and the
     * browser does not load an HTML 404 page as a script or stylesheet.
     *
     * @since WPUF_SINCE
     *
     * @param string|false $src Source URL.
     *
     * @return string|false
     */
    protected function existing_src( $src ) {
        if ( ! is_string( $src ) || 0 !== strpos( $src, WP_PLUGIN_URL ) ) {
            return $src;
        }

        $path = WP_PLUGIN_DIR . strtok( substr( $src, strlen( WP_PLUGIN_URL ) ), '?' );

        return file_exists( $path ) ? $src : false;
    }

    /**
     * Returns the list of styles
     *
     * @since 4.0.0
     *
     * @return mixed|null
     */
    public function get_styles() {
        $styles = [
            'frontend-forms'      => [
                'src' => WPUF_ASSET_URI . '/css/frontend-forms.css',
            ],
            'settings-react'      => [
                'src' => WPUF_ASSET_URI . '/css/settings-react.css',
            ],
            'subscriptions-react' => [
                'src'     => WPUF_ASSET_URI . '/css/subscriptions.css',
                'version' => $this->react_asset( 'subscriptions', [] )['version'],
                // subscriptions-rtl.css (built by tools/admin-css) on RTL sites.
                'rtl'     => true,
            ],
            'elementor-frontend-forms'      => [
                'src' => WPUF_ASSET_URI . '/css/elementor-frontend-forms.css',
            ],
            'elementor-subscription-plans'      => [
                'src' => WPUF_ASSET_URI . '/css/elementor-subscription-plans.css',
            ],
            'frontend-subscriptions' => [
                'src' => WPUF_ASSET_URI . '/css/frontend-subscriptions.min.css',
            ],
            'layout1'             => [
                'src' => WPUF_ASSET_URI . '/css/frontend-form/layout1.css',
            ],
            'layout2'             => [
                'src' => WPUF_ASSET_URI . '/css/frontend-form/layout2.css',
            ],
            'layout3'             => [
                'src' => WPUF_ASSET_URI . '/css/frontend-form/layout3.css',
            ],
            'layout4'             => [
                'src' => WPUF_ASSET_URI . '/css/frontend-form/layout4.css',
            ],
            'layout5'             => [
                'src' => WPUF_ASSET_URI . '/css/frontend-form/layout5.css',
            ],
            'jquery-ui'           => [
                'src'     => WPUF_ASSET_URI . '/css/jquery-ui-1.9.1.custom.css',
                'version' => '1.9.1',
            ],
            'sweetalert2'        => [
                'src'     => WPUF_ASSET_URI . '/vendor/sweetalert2/sweetalert2.css',
                'version' => '11.4.8',
            ],
            'font-awesome'        => [
                'src'     => WPUF_ASSET_URI . '/vendor/font-awesome/css/all.min.css',
                'version' => '7.0.1',
            ],
            'selectize'           => [
                'src'     => WPUF_ASSET_URI . '/vendor/selectize/css/selectize.default.css',
                'version' => '0.12.4',
            ],
            'toastr'              => [
                'src'     => WPUF_ASSET_URI . '/vendor/toastr/toastr.min.css',
                'version' => '2.1.3',
            ],
            'tooltip'             => [
                'src'     => WPUF_ASSET_URI . '/vendor/tooltip/tooltip.css',
                'version' => '3.3.7',
            ],
            'form-builder'        => [
                'src'  => WPUF_ASSET_URI . '/css/wpuf-form-builder.css',
                'deps' => $this->form_builder_css_deps,
            ],
            'admin-form-builder'  => [
                'src'  => WPUF_ASSET_URI . '/css/admin/form-builder.css',
                'deps' => $this->form_builder_css_deps,
            ],
            'ai-form-builder'     => [
                'src'  => WPUF_ASSET_URI . '/css/ai-form-builder.css',
            ],
            'admin'               => [
                'src' => WPUF_ASSET_URI . '/css/admin.css',
            ],
            'admin-subscriptions' => [
                'src' => WPUF_ASSET_URI . '/css/admin/subscriptions.min.css',
            ],
            'registration-forms'  => [
                'src' => WPUF_ASSET_URI . '/css/registration-forms.css',
            ],
            'module'              => [
                'src' => WPUF_ASSET_URI . '/css/admin/wpuf-module.css',
            ],
            'swiffy-slider'       => [
                'src'     => WPUF_ASSET_URI . '/vendor/swiffy-slider/swiffy-slider.min.css',
                'version' => '1.6.0',
            ],
            'setup'               => [
                'src'  => WPUF_ASSET_URI . '/css/admin/wpuf-setup.css',
                'deps' => [ 'dashicons', 'install' ],
            ],
            'onboarding'          => [
                'src' => WPUF_ASSET_URI . '/css/admin/wpuf-onboarding.css',
            ],
            'forms-list'           => [
                'src' => WPUF_ASSET_URI . '/css/forms-list.min.css',
            ],
            'account'              => [
                'src' => WPUF_ASSET_URI . '/css/frontend/account.css',
            ],
        ];

        return apply_filters( 'wpuf_styles_to_register', $styles );
    }

    /**
     * Dependencies and version of a React bundle from its generated
     * `assets/js/{name}.min.asset.php`, or the fallbacks when it is missing.
     *
     * @since WPUF_SINCE
     *
     * @param string $name         Bundle name
     * @param array  $dependencies Fallback dependencies
     *
     * @return array { dependencies, version }
     */
    protected function react_asset( $name, $dependencies ) {
        $file = WPUF_ROOT . '/assets/js/' . $name . '.min.asset.php';

        return file_exists( $file )
            ? require $file
            : [
                'dependencies' => $dependencies,
                'version'      => WPUF_VERSION,
            ];
    }

    /**
     * Returns the list of JS
     *
     * @since 4.0.0
     *
     * @return mixed|null
     */
    public function get_scripts() {
        $this->scheme         = is_ssl() ? 'https' : 'http';
        $api_key              = wpuf_get_option( 'gmap_api_key', 'wpuf_general' );

        $forms_list_asset_file = WPUF_ROOT . '/assets/js/forms-list-react.min.asset.php';
        $forms_list_asset      = file_exists( $forms_list_asset_file ) ? require $forms_list_asset_file : [ 'dependencies' => [], 'version' => WPUF_VERSION ];
        // The other React admin apps are registered here too (task 2.5b), so every
        // screen enqueues by handle and Pro can depend on them.
        $settings_asset      = $this->react_asset( 'settings-react', [ 'wp-element', 'wp-data', 'wp-api-fetch', 'wp-i18n', 'wp-hooks', 'wp-components' ] );
        $subscriptions_asset = $this->react_asset( 'subscriptions', [ 'wp-element', 'wp-data', 'wp-api-fetch', 'wp-i18n', 'wp-hooks', 'wp-components', 'wp-primitives' ] );
        $form_builder_asset  = $this->react_asset( 'form-builder', [] );
        // The shared React admin layer (design.md D24): screens and Pro get
        // these as dependencies through the `@wpuf/*` / plugin-ui externals.
        $admin_runtime_asset = $this->react_asset( 'admin-runtime', [ 'wp-api-fetch', 'wp-element', 'wp-hooks', 'wp-url' ] );
        $admin_ui_asset      = $this->react_asset( 'admin-ui', [ 'react', 'react-dom', 'react-jsx-runtime', 'wp-components', 'wp-element', 'wp-i18n', 'wp-plugins' ] );
        $form_builder_js_deps = apply_filters(
            'wpuf_form_builder_js_deps',
            [
                'jquery',
                'jquery-ui-sortable',
                'jquery-ui-draggable',
                'jquery-ui-droppable',
                'jquery-ui-resizable',
                'underscore',
                'wpuf-vue',
                'wpuf-vuex',
                'wpuf-sweetalert2',
                'wpuf-jquery-scrollTo',
                'wpuf-selectize',
                'wpuf-toastr',
                'wpuf-clipboard',
                'wpuf-tooltip',
            ]
        );
        $scripts = [
            'onboarding'           => [
                'src'       => WPUF_ASSET_URI . '/js/wpuf-onboarding.js',
                'in_footer' => true,
            ],
            'vue'                      => [
                'src'       => WPUF_ASSET_URI . '/vendor/vue/vue' . $this->suffix . '.js',
                'in_footer' => true,
                'version'   => '2.2.4',
            ],
            'vue-3'                    => [
                'src'       => WPUF_ASSET_URI . '/vendor/vue-3/vue.esm-browser.js',
                'in_footer' => true,
                'version'   => '3.4.19',
            ],
            'vuex'                     => [
                'src'       => WPUF_ASSET_URI . '/vendor/vuex/vuex' . $this->suffix . '.js',
                'in_footer' => true,
                'version'   => '2.2.1',
            ],
            'sweetalert2'              => [
                'src'       => WPUF_ASSET_URI . '/vendor/sweetalert2/sweetalert2.js',
                'in_footer' => true,
                'version'   => '11.4.8',
                'deps'      => [ 'jquery' ],
            ],
            'jquery-scrollTo'          => [
                'src'       => WPUF_ASSET_URI . '/vendor/jquery.scrollTo/jquery.scrollTo' . $this->suffix . '.js',
                'in_footer' => true,
                'deps'      => [ 'jquery' ],
                'version'   => '11.4.19',
            ],
            'selectize'                => [
                'src'       => WPUF_ASSET_URI . '/vendor/selectize/js/standalone/selectize' . $this->suffix . '.js',
                'in_footer' => true,
                'deps'      => [ 'jquery' ],
                'version'   => '0.12.4',
            ],
            'toastr'                   => [
                'src'       => WPUF_ASSET_URI . '/vendor/toastr/toastr' . $this->suffix . '.js',
                'in_footer' => true,
                'version'   => '2.1.3',
            ],
            'clipboard'                => [
                'src'       => WPUF_ASSET_URI . '/vendor/clipboard/clipboard' . $this->suffix . '.js',
                'in_footer' => true,
                'version'   => '1.6.0',
            ],
            'tooltip'                  => [
                'src'       => WPUF_ASSET_URI . '/vendor/tooltip/tooltip' . $this->suffix . '.js',
                'in_footer' => true,
                'version'   => '3.3.7',
            ],
            'form-builder-mixins'      => [
                'src'       => WPUF_ASSET_URI . '/js/wpuf-form-builder-mixins.js',
                'deps'      => $form_builder_js_deps,
                'in_footer' => true,
            ],
            'form-builder-components'  => [
                'src'       => WPUF_ASSET_URI . '/js/wpuf-form-builder-components.js',
                'deps'      => [ 'wpuf-form-builder-mixins' ],
                'in_footer' => true,
            ],
            'form-builder'             => [
                'src'       => WPUF_ASSET_URI . '/js/wpuf-form-builder.js',
                'deps'      => [ 'wpuf-form-builder-components' ],
                'in_footer' => true,
            ],
            'admin'                    => [
                'src'  => WPUF_ASSET_URI . '/js/wpuf-admin.js',
                'deps' => [ 'jquery' ],
            ],
            'subscriptions'            => [
                'src'       => WPUF_ASSET_URI . '/js/subscriptions-old.js',
                'deps'      => [ 'jquery' ],
                'in_footer' => true,
            ],
            // Alias of the React subscriptions script: data localized or inline
            // scripts added on this old handle still print on the page.
            'admin-subscriptions'      => [
                'src'       => false,
                'deps'      => [ 'wpuf-admin-subscriptions-react' ],
                'in_footer' => true,
            ],
            'ai-form-builder'          => [
                'src'       => WPUF_ASSET_URI . '/js/ai-form-builder.min.js',
                'in_footer' => true,
            ],
            'timepicker'               => [
                'src'       => WPUF_ASSET_URI . '/js/jquery-ui-timepicker-addon.js',
                'deps'      => [ 'jquery-ui-datepicker' ],
                'version'   => '1.2',
            ],
            'form-builder-wpuf-forms'  => [
                'src'       => WPUF_ASSET_URI . '/js/wpuf-form-builder-wpuf-forms.js',
                'deps'      => [ 'jquery', 'underscore', 'wpuf-vue', 'wpuf-vuex' ],
                'in_footer' => true,
            ],
            'registration-forms'       => [
                'src'       => WPUF_ASSET_URI . '/js/registration-forms.js',
                'deps'      => [ 'jquery' ],
                'in_footer' => true,
            ],
            'module'                   => [
                'src'       => WPUF_ASSET_URI . '/js/admin/wpuf-module.js',
                'deps'      => [ 'wpuf-swiffy-slider', 'wpuf-swiffy-slider-extensions' ],
                'in_footer' => true,
            ],
            'swiffy-slider'            => [
                'src'       => WPUF_ASSET_URI . '/vendor/swiffy-slider/swiffy-slider.min.js',
                'deps'      => [ 'jquery' ],
                'version'   => '1.6.0',
                'in_footer' => true,
            ],
            'swiffy-slider-extensions' => [
                'src'       => WPUF_ASSET_URI . '/vendor/swiffy-slider/swiffy-slider-extensions.min.js',
                'deps'      => [ 'jquery' ],
                'version'   => '1.6.0',
                'in_footer' => true,
            ],
            'admin-shortcode'          => [
                'src'  => WPUF_ASSET_URI . '/js/admin-shortcode.js',
                'deps' => [ 'jquery' ],
            ],
            'billing-address'          => [
                'src'  => WPUF_ASSET_URI . '/js/billing-address.js',
                'deps' => [ 'jquery' ],
            ],
            'metabox-tabs'             => [
                'src'  => WPUF_ASSET_URI . '/js/metabox-tabs.js',
                'deps' => [ 'jquery' ],
            ],
            'admin-tools'              => [
                'src'  => WPUF_ASSET_URI . '/js/wpuf-admin-tools.js',
                'deps' => [ 'jquery', 'wpuf-vue' ],
            ],
            'settings'                 => [
                'src' => WPUF_ASSET_URI . '/js/admin/settings.js',
            ],
            'ajax-script'              => [
                'src'  => WPUF_ASSET_URI . '/js/billing-address.js',
                'deps' => [ 'jquery' ],
            ],
            'jquery-blockui'           => [
                'src'     => WPUF_ASSET_URI . '/js/jquery-blockui/jquery.blockUI.min.js',
                'deps'    => [ 'jquery' ],
                'version' => '2.70',
            ],
            'selectWoo'                => [
                'src'     => WPUF_ASSET_URI . '/js/selectWoo/selectWoo.full.min.js',
                'deps'    => [ 'jquery' ],
                'version' => '1.0.1',
            ],
            'enhanced-select'          => [
                'src'  => WPUF_ASSET_URI . '/js/admin/wpuf-enhanced-select' . $this->suffix . '.js',
                'deps' => [ 'jquery', 'wpuf-selectWoo' ],
            ],
            'setup'                    => [
                'src'  => WPUF_ASSET_URI . '/js/admin/wpuf-setup' . $this->suffix . '.js',
                'deps' => [ 'jquery', 'wpuf-enhanced-select', 'wpuf-jquery-blockui' ],
            ],
            'frontend-form'            => [
                'src'  => WPUF_ASSET_URI . '/js/frontend-form' . $this->suffix . '.js',
                'deps' => [ 'jquery' ],
            ],
            'account'                  => [
                'src'       => WPUF_ASSET_URI . '/js/account' . $this->suffix . '.js',
                'deps'      => [ 'jquery' ],
                'in_footer' => true,
            ],
            'upload'                   => [
                'src'  => WPUF_ASSET_URI . '/js/upload' . $this->suffix . '.js',
                'deps' => [ 'jquery', 'plupload-handlers', 'jquery-ui-sortable' ],
            ],
            'ajax_login'               => [
                'src'  => WPUF_ASSET_URI . '/js/wpuf-login-widget.js',
                'deps' => [ 'jquery' ],
            ],
            'headway'                  => [
                'src'  => '//cdn.headwayapp.co/widget.js',
            ],
            'turnstile'                  => [
                'src'  => 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback',
            ],
            'headway-script'         => [
                'src' => WPUF_ASSET_URI . '/vendor/headway.js',
                'deps' => [ 'jquery' ],
            ],
            'forms-list'         => [
                'src'       => WPUF_ASSET_URI . '/js/forms-list.min.js',
                'in_footer' => true,
            ],
            'forms-list-react'   => [
                'src'       => WPUF_ASSET_URI . '/js/forms-list-react.min.js',
                'deps'      => $forms_list_asset['dependencies'],
                'version'   => $forms_list_asset['version'],
                'in_footer' => true,
            ],
            'settings-react'     => [
                'src'       => WPUF_ASSET_URI . '/js/settings-react.min.js',
                'deps'      => $settings_asset['dependencies'],
                'version'   => $settings_asset['version'],
                'in_footer' => true,
            ],
            'admin-subscriptions-react' => [
                'src'       => WPUF_ASSET_URI . '/js/subscriptions.min.js',
                'deps'      => $subscriptions_asset['dependencies'],
                'version'   => $subscriptions_asset['version'],
                'in_footer' => true,
            ],
            'admin-runtime'      => [
                'src'       => WPUF_ASSET_URI . '/js/admin-runtime.min.js',
                'deps'      => $admin_runtime_asset['dependencies'],
                'version'   => $admin_runtime_asset['version'],
                'in_footer' => true,
            ],
            // @wedevs/plugin-ui, loaded once; the page also needs the wp-components style.
            'admin-ui'           => [
                'src'       => WPUF_ASSET_URI . '/js/admin-ui.min.js',
                'deps'      => array_values( array_unique( array_merge( [ 'wpuf-admin-runtime' ], $admin_ui_asset['dependencies'] ) ) ),
                'version'   => $admin_ui_asset['version'],
                'in_footer' => true,
            ],
            'form-builder-react' => [
                'src'       => WPUF_ASSET_URI . '/js/form-builder.min.js',
                'deps'      => $form_builder_asset['dependencies'],
                'version'   => $form_builder_asset['version'],
                'in_footer' => true,
            ],
            'frontend-subscriptions' => [
                'src'       => WPUF_ASSET_URI . '/js/frontend-subscriptions.min.js',
                'in_footer' => true,
            ],
            'elementor-subscription-plans' => [
                'src'       => WPUF_ASSET_URI . '/js/elementor-subscription-plans.js',
                'in_footer' => true,
            ],
        ];

        if ( ! empty( $api_key ) ) {
            $scripts['google-maps'] = [
                'src' => $this->scheme . '://maps.google.com/maps/api/js?libraries=places&key=' . $api_key,
            ];
        }

        return apply_filters( 'wpuf_scripts_to_register', $scripts );
    }
}
