<?php
/**
 * The JSON schema of a post form for the React renderer
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Frontend\Forms;

use WeDevs\Wpuf\Admin\Forms\Form;
use WeDevs\Wpuf\Admin\Subscription;
use WeDevs\Wpuf\Frontend\Frontend_Form;
use WeDevs\Wpuf\Platform\Stores\Stores;
use WeDevs\Wpuf\Traits\FieldableTrait;
use WP_Error;

/**
 * Everything `Frontend_Render_Form::render_form()` and the two shortcodes
 * decide at render time, as data: the fields (visibility applied, values in
 * edit mode), the settings the renderer needs, the gates (can the visitor
 * post, can they edit this post), the nonces, the libraries the fields need,
 * and the markup the printing hooks produce (`slots`), captured in the order
 * and with the arguments the classic renderer fires them.
 *
 * @since WPUF_SINCE
 */
class Form_Schema {

    use FieldableTrait;

    /**
     * Settings of the form (the trait reads them).
     *
     * @var array
     */
    public $form_settings = [];

    /**
     * Fields of the form (the trait reads them).
     *
     * @var array
     */
    private $form_fields = [];

    /**
     * Settings the renderer needs. Notification bodies, recipients and the
     * rest of the builder's admin-only data stay server-side.
     *
     * @since WPUF_SINCE
     */
    const SETTINGS = [
        'post_type',
        'post_status',
        'edit_post_status',
        'redirect_to',
        'page_id',
        'url',
        'message',
        'edit_redirect_to',
        'edit_page_id',
        'edit_url',
        'update_message',
        'submit_text',
        'update_text',
        'draft_post',
        'form_layout',
        'label_position',
        'use_theme_css',
        'show_form_title',
        'form_description',
        'enable_multistep',
        'multistep_progressbar_type',
        'post_permission',
        'guest_details',
        'guest_email_verify',
        'name_label',
        'email_label',
        'message_restrict',
        'roles',
        'comment_status',
        'default_cat',
        'post_format',
        'limit_entries',
        'limit_number',
        'limit_message',
        'schedule_form',
        'schedule_start',
        'schedule_end',
        'form_pending_message',
        'form_expired_message',
        'lock_edit_post',
        'payment_options',
        'enable_pay_per_post',
        'pay_per_post_cost',
        'force_pack_purchase',
        'fallback_ppp_enable',
        'fallback_ppp_cost',
    ];

    /**
     * Field templates that need a library on the page.
     *
     * @since WPUF_SINCE
     */
    const NEEDS = [
        'image_upload'        => 'uploads',
        'featured_image'      => 'uploads',
        'file_upload'         => 'uploads',
        'profile_photo'       => 'uploads',
        'cover_photo'         => 'uploads',
        'avatar'              => 'uploads',
        'post_content'        => 'editor',
        'google_map'          => 'maps',
        'recaptcha'           => 'recaptcha',
        'cloudflare_turnstile' => 'turnstile',
        'date_field'          => 'dates',
        'time_field'          => 'dates',
        'phone_field'         => 'phone',
        'country_list_field'  => 'address',
        'address_field'       => 'address',
    ];

    /**
     * The schema of a form, for a new post or for editing one.
     *
     * @since WPUF_SINCE
     *
     * @param int   $form_id Form id
     * @param int   $post_id Post being edited (0 for a new post)
     * @param array $atts    Shortcode attributes (`page_id` of the page that renders the form)
     *
     * @return array|WP_Error
     */
    public function build( $form_id, $post_id = 0, array $atts = [] ) {
        $form_id = (int) $form_id;
        $post_id = (int) $post_id;

        if ( $post_id ) {
            $edit = $this->edit_gate( $post_id );

            if ( is_wp_error( $edit ) ) {
                return $edit;
            }

            $form_id = $edit;
        }

        if ( ! $form_id || 'wpuf_forms' !== get_post_type( $form_id ) ) {
            return new WP_Error( 'wpuf_form_not_found', __( 'Your selected form is no longer available.', 'wp-user-frontend' ), [ 'status' => 404 ] );
        }

        if ( 'publish' !== get_post_status( $form_id ) ) {
            return new WP_Error( 'wpuf_form_not_published', __( "Please make sure you've published your form.", 'wp-user-frontend' ), [ 'status' => 404 ] );
        }

        add_filter( 'wpuf_form_fields', [ $this, 'add_field_settings' ] );

        $form                = new Form( $form_id );
        $this->form_settings = (array) $form->get_settings();
        $this->form_fields   = (array) $form->get_fields();
        $settings            = $this->form_settings;
        $page_id             = isset( $atts['page_id'] ) ? (int) $atts['page_id'] : (int) get_the_ID();

        $state = $post_id ? $this->edit_state( $post_id ) : $this->create_state( $form, $form_id );

        $fields = apply_filters( 'wpuf_render_fields', $this->form_fields, $form_id );
        $fields = $this->describe_fields( (array) $fields, $post_id );

        $schema = [
            'id'       => $form_id,
            'title'    => get_the_title( $form_id ),
            'mode'     => $post_id ? 'edit' : 'create',
            'post_id'  => $post_id,
            'page_id'  => $page_id,
            'post'     => $post_id ? $this->post_facts( $post_id ) : null,
            'state'    => $state,
            'settings' => $this->settings_subset( $settings, $form_id ),
            'layout'   => [
                'layout'         => 'wpuf_profile' === $form->data->post_type ? ( isset( $settings['profile_form_layout'] ) ? $settings['profile_form_layout'] : 'layout1' ) : ( ! empty( $settings['form_layout'] ) ? $settings['form_layout'] : 'layout1' ),
                'label_position' => isset( $settings['label_position'] ) ? $settings['label_position'] : 'left',
                'use_theme_css'  => ! empty( $settings['use_theme_css'] ) && 'on' === $settings['use_theme_css'],
                'show_title'     => isset( $settings['show_form_title'] ) && wpuf_is_checkbox_or_toggle_on( $settings['show_form_title'] ),
                'description'    => isset( $settings['form_description'] ) ? wp_kses_post( $settings['form_description'] ) : '',
                'submit_text'    => isset( $settings['submit_text'] ) ? $settings['submit_text'] : __( 'Submit', 'wp-user-frontend' ),
                'update_text'    => isset( $settings['update_text'] ) ? $settings['update_text'] : __( 'Update', 'wp-user-frontend' ),
                'draft'          => isset( $settings['draft_post'] ) && wpuf_is_checkbox_or_toggle_on( $settings['draft_post'] ),
                'multistep'      => isset( $settings['enable_multistep'] ) && wpuf_is_checkbox_or_toggle_on( $settings['enable_multistep'] ),
                'progress'       => isset( $settings['multistep_progressbar_type'] ) ? $settings['multistep_progressbar_type'] : 'progressive',
            ],
            'guest'    => $this->guest_facts( $settings ),
            'featured' => $this->featured_facts( $settings, $post_id ),
            'fields'   => $fields,
            'needs'    => $this->needs( $fields ),
            'nonces'   => [
                'submit' => wp_create_nonce( 'wpuf_form_add' ),
                'upload' => wp_create_nonce( 'wpuf-upload-nonce' ),
                'delete' => wp_create_nonce( 'wpuf_nonce' ),
            ],
            'slots'    => $state['open'] ? $this->slots( $form, $form_id, $post_id, $settings ) : [],
        ];

        /**
         * Filters the schema the React post form renders from.
         *
         * @since WPUF_SINCE
         *
         * @param array $schema  Schema
         * @param int   $form_id Form id
         * @param int   $post_id Post id (0 for a new post)
         */
        return apply_filters( 'wpuf_frontend_form_schema', $schema, $form_id, $post_id );
    }

    /**
     * Which form edits a post, after the edit checks of `edit_post_shortcode`.
     *
     * @since WPUF_SINCE
     *
     * @param int $post_id Post id
     *
     * @return int|WP_Error Form id
     */
    private function edit_gate( $post_id ) {
        $can_edit = wpuf_user_can_edit_post( $post_id );

        if ( is_wp_error( $can_edit ) ) {
            $can_edit->add_data( [ 'status' => is_user_logged_in() ? 403 : 401 ] );

            return $can_edit;
        }

        $form_id = (int) get_post_meta( $post_id, Frontend_Form::$config_id, true );

        if ( ! $form_id ) {
            $form_id = (int) wpuf_get_option( 'default_post_form', 'wpuf_frontend_posting' );
        }

        if ( ! $form_id ) {
            return new WP_Error( 'wpuf_form_unknown', __( "I don't know how to edit this post, I don't have the form ID", 'wp-user-frontend' ), [ 'status' => 404 ] );
        }

        return $form_id;
    }

    /**
     * The gate of a new submission (`is_submission_open`, the login and role
     * checks of `render_form`), as `open` + the message to show instead.
     *
     * @since WPUF_SINCE
     *
     * @param Form $form    Form
     * @param int  $form_id Form id
     *
     * @return array open, message, reason
     */
    private function create_state( Form $form, $form_id ) {
        $settings = $this->form_settings;

        [ $user_can_post, $info ] = $form->is_submission_open( $form, $settings );
        $info                     = apply_filters( 'wpuf_addpost_notice', $info, $form_id, $settings );
        $user_can_post            = apply_filters( 'wpuf_can_post', $user_can_post, $form_id, $settings );

        if ( 'yes' !== $user_can_post ) {
            return [
                'open'    => false,
                'reason'  => 'closed',
                'message' => wp_kses_post( (string) $info ),
            ];
        }

        if ( ! is_user_logged_in() && ! empty( $settings['post_permission'] ) && 'guest_post' !== $settings['post_permission'] ) {
            $login    = wpuf()->frontend->simple_login->get_login_url();
            $register = wpuf()->frontend->simple_login->get_registration_url();
            $message  = str_replace(
                [ '{login}', '{register}' ],
                [ "<a href='" . esc_url( $login ) . "'>Login</a>", "<a href='" . esc_url( $register ) . "'>Register</a>" ],
                isset( $settings['message_restrict'] ) ? $settings['message_restrict'] : ''
            );

            return [
                'open'    => false,
                'reason'  => 'login',
                'message' => wp_kses_post( $message ),
            ];
        }

        if ( ! empty( $settings['post_permission'] ) && 'role_base' === $settings['post_permission'] && ! empty( $settings['roles'] ) && ! wpuf_user_has_roles( $settings['roles'] ) ) {
            return [
                'open'    => false,
                'reason'  => 'role',
                'message' => __( 'You do not have sufficient permissions to access this form.', 'wp-user-frontend' ),
            ];
        }

        return [
            'open'    => true,
            'reason'  => '',
            'message' => '',
        ];
    }

    /**
     * The gate of an edit (locks and the dashboard settings of `edit_post_shortcode`).
     *
     * @since WPUF_SINCE
     *
     * @param int $post_id Post id
     *
     * @return array
     */
    private function edit_state( $post_id ) {
        $closed = function ( $reason, $message ) {
            return [
                'open'    => false,
                'reason'  => $reason,
                'message' => wp_kses_post( $message ),
            ];
        };

        if ( 'yes' === Stores::submissions()->lock( $post_id ) ) {
            return $closed( 'locked', apply_filters( 'wpuf_edit_post_lock_user_notice', __( 'Your edit access for this post has been locked by an administrator.', 'wp-user-frontend' ) ) );
        }

        $lock_time = Stores::submissions()->lock_time( $post_id );

        if ( ! empty( $lock_time ) && $lock_time < time() ) {
            return $closed( 'expired', apply_filters( 'wpuf_edit_post_lock_expire_notice', __( 'Your allocated time for editing this post has been expired.', 'wp-user-frontend' ) ) );
        }

        $user = wpuf_get_user();

        if ( $user->edit_post_locked() ) {
            $reason = $user->edit_post_lock_reason();

            return $closed( 'user_locked', $reason ? $reason : apply_filters( 'wpuf_user_edit_post_lock_notice', __( 'Your post edit access has been locked by an administrator.', 'wp-user-frontend' ) ) );
        }

        if ( 'yes' !== wpuf_get_option( 'enable_post_edit', 'wpuf_dashboard', 'yes' ) ) {
            return $closed( 'disabled', __( 'Post Editing is disabled', 'wp-user-frontend' ) );
        }

        $status = get_post_status( $post_id );

        if ( 'pending' === $status && 'on' === wpuf_get_option( 'disable_pending_edit', 'wpuf_dashboard', 'on' ) ) {
            return $closed( 'pending', __( "You can't edit a post while in pending mode.", 'wp-user-frontend' ) );
        }

        if ( 'publish' === $status && 'off' !== wpuf_get_option( 'disable_publish_edit', 'wpuf_dashboard', 'off' ) ) {
            return $closed( 'published', __( "You're not allowed to edit this post.", 'wp-user-frontend' ) );
        }

        return [
            'open'    => true,
            'reason'  => '',
            'message' => '',
        ];
    }

    /**
     * The facts of the post being edited that the submit needs back.
     *
     * @since WPUF_SINCE
     *
     * @param int $post_id Post id
     *
     * @return array
     */
    private function post_facts( $post_id ) {
        $post = get_post( $post_id );

        return [
            'id'             => (int) $post->ID,
            'status'         => (string) $post->post_status,
            'date'           => (string) $post->post_date,
            'comment_status' => (string) $post->comment_status,
            'author'         => (int) $post->post_author,
            'permalink'      => (string) get_permalink( $post ),
            'thumbnail_id'   => (int) get_post_thumbnail_id( $post ),
        ];
    }

    /**
     * The settings subset the renderer gets.
     *
     * @since WPUF_SINCE
     *
     * @param array $settings All settings
     * @param int   $form_id  Form id
     *
     * @return array
     */
    private function settings_subset( array $settings, $form_id ) {
        $subset = [];

        foreach ( self::SETTINGS as $key ) {
            if ( array_key_exists( $key, $settings ) ) {
                $subset[ $key ] = $settings[ $key ];
            }
        }

        /**
         * Filters the form settings the React renderer receives.
         *
         * @since WPUF_SINCE
         *
         * @param array $subset   Settings sent to the client
         * @param array $settings All stored settings
         * @param int   $form_id  Form id
         */
        return apply_filters( 'wpuf_frontend_form_schema_settings', $subset, $settings, $form_id );
    }

    /**
     * Guest posting facts (`guest_fields()` of the classic renderer).
     *
     * @since WPUF_SINCE
     *
     * @param array $settings Settings
     *
     * @return array
     */
    private function guest_facts( array $settings ) {
        $guest   = ! empty( $settings['post_permission'] ) && 'guest_post' === $settings['post_permission'];
        $details = $guest && ! empty( $settings['guest_details'] ) && wpuf_is_checkbox_or_toggle_on( $settings['guest_details'] );

        return [
            'enabled'     => $guest,
            'fields'      => $details && ! is_user_logged_in(),
            'name_label'  => isset( $settings['name_label'] ) ? $settings['name_label'] : __( 'Name', 'wp-user-frontend' ),
            'email_label' => isset( $settings['email_label'] ) ? $settings['email_label'] : __( 'Email', 'wp-user-frontend' ),
            'verify'      => $guest && isset( $settings['guest_email_verify'] ) && wpuf_is_checkbox_or_toggle_on( $settings['guest_email_verify'] ),
        ];
    }

    /**
     * The "Featured" checkbox facts (`render_featured_field()`).
     *
     * @since WPUF_SINCE
     *
     * @param array $settings Settings
     * @param int   $post_id  Post id
     *
     * @return array
     */
    private function featured_facts( array $settings, $post_id ) {
        $user_sub    = Subscription::get_user_pack( get_current_user_id() );
        $remaining   = ! empty( $user_sub['total_feature_item'] ) ? (int) $user_sub['total_feature_item'] : 0;
        $is_featured = $post_id && in_array( (int) $post_id, (array) get_option( 'sticky_posts' ), true );

        return [
            'enabled'   => $remaining > 0 || $is_featured,
            'checked'   => (bool) $is_featured,
            'remaining' => $remaining,
            'post_type' => ! empty( $settings['post_type'] ) ? $settings['post_type'] : 'post',
        ];
    }

    /**
     * The fields as the renderer sees them: visibility applied, unknown
     * templates dropped, values filled in edit mode, column fields recursed.
     *
     * @since WPUF_SINCE
     *
     * @param array $fields  Fields
     * @param int   $post_id Post id (0 for a new post)
     *
     * @return array
     */
    private function describe_fields( array $fields, $post_id ) {
        $manager = wpuf()->fields;
        $out     = [];

        foreach ( $fields as $field ) {
            if ( empty( $field['template'] ) ) {
                continue;
            }

            $object = $manager->field_exists( $field['template'] );

            if ( ! $object || ! $manager->check_field_visibility( $field ) ) {
                continue;
            }

            if ( 'column_field' === $field['template'] && ! empty( $field['inner_fields'] ) && is_array( $field['inner_fields'] ) ) {
                foreach ( $field['inner_fields'] as $column => $column_fields ) {
                    $field['inner_fields'][ $column ] = $this->describe_fields( (array) $column_fields, $post_id );
                }
            }

            if ( $post_id ) {
                $field['value'] = $this->value_of( $object, $field, $post_id );
            }

            if ( 'taxonomy' === $field['template'] ) {
                $field['choices'] = $this->term_choices( $field );
            }

            if ( $post_id && in_array( $field['template'], [ 'image_upload', 'featured_image', 'file_upload' ], true ) ) {
                $field['attachments'] = $this->attachment_facts( $field['value'] );
            }

            $field['kind'] = $field['template'];

            $out[] = $field;
        }

        return $out;
    }

    /**
     * The terms a taxonomy field offers (what the classic field prints
     * through wp_dropdown_categories / the checklist), the field's own
     * exclusions applied.
     *
     * @since WPUF_SINCE
     *
     * @param array $field Field settings
     *
     * @return array [ [ 'id', 'name', 'parent' ], ... ]
     */
    private function term_choices( array $field ) {
        $taxonomy = isset( $field['name'] ) ? $field['name'] : '';

        if ( ! $taxonomy || ! taxonomy_exists( $taxonomy ) ) {
            return [];
        }

        $args = [
            'taxonomy'   => $taxonomy,
            'hide_empty' => false,
            'orderby'    => ! empty( $field['orderby'] ) ? $field['orderby'] : 'name',
            'order'      => ! empty( $field['order'] ) && 'DESC' === strtoupper( $field['order'] ) ? 'DESC' : 'ASC',
        ];

        $exclude = ! empty( $field['exclude'] ) ? array_filter( array_map( 'intval', (array) $field['exclude'] ) ) : [];

        if ( $exclude ) {
            if ( ! empty( $field['exclude_type'] ) && 'child_of' === $field['exclude_type'] ) {
                $args['child_of'] = reset( $exclude );
            } elseif ( ! empty( $field['exclude_type'] ) && 'include' === $field['exclude_type'] ) {
                $args['include'] = $exclude;
            } else {
                $args['exclude'] = $exclude;
            }
        }

        /** This filter is documented in includes/Fields/Form_Field_Post_Taxonomy.php */
        $args  = apply_filters( 'wpuf_taxonomy_checklist_args', $args );
        $terms = get_terms( $args );
        $out   = [];

        foreach ( is_wp_error( $terms ) ? [] : $terms as $term ) {
            $out[] = [
                'id'     => (int) $term->term_id,
                'name'   => (string) $term->name,
                'parent' => (int) $term->parent,
            ];
        }

        return $out;
    }

    /**
     * The stored attachments of an upload field, for the previews in edit mode.
     *
     * @since WPUF_SINCE
     *
     * @param mixed $value Attachment id(s)
     *
     * @return array
     */
    private function attachment_facts( $value ) {
        $ids = array_filter( array_map( 'intval', is_array( $value ) ? $value : explode( ',', (string) $value ) ) );
        $out = [];

        foreach ( $ids as $id ) {
            if ( 'attachment' !== get_post_type( $id ) ) {
                continue;
            }

            $thumb = wp_get_attachment_image_src( $id, 'thumbnail' );

            $out[] = [
                'id'    => $id,
                'url'   => (string) wp_get_attachment_url( $id ),
                'thumb' => $thumb ? $thumb[0] : '',
                'title' => get_the_title( $id ),
                'mime'  => (string) get_post_mime_type( $id ),
            ];
        }

        return $out;
    }

    /**
     * The stored value of a field for the post being edited.
     *
     * @since WPUF_SINCE
     *
     * @param object $object  Field object
     * @param array  $field   Field settings
     * @param int    $post_id Post id
     *
     * @return mixed
     */
    private function value_of( $object, array $field, $post_id ) {
        $post = get_post( $post_id );
        $name = isset( $field['name'] ) ? $field['name'] : '';

        switch ( $field['template'] ) {
            case 'post_title':
                return $post ? $post->post_title : '';
            case 'post_content':
                return $post ? $post->post_content : '';
            case 'post_excerpt':
                return $post ? $post->post_excerpt : '';
            case 'post_tags':
                return implode( ', ', wp_get_post_tags( $post_id, [ 'fields' => 'names' ] ) );
            case 'featured_image':
                return (int) get_post_thumbnail_id( $post_id );
            case 'taxonomy':
                $terms = $name ? wp_get_object_terms( $post_id, $name, [ 'fields' => 'ids' ] ) : [];

                return is_wp_error( $terms ) ? [] : array_map( 'intval', $terms );
        }

        if ( $name && method_exists( $object, 'is_meta' ) && $object->is_meta( $field ) ) {
            return $object->get_meta( $post_id, $name, 'post' );
        }

        return null;
    }

    /**
     * Which libraries the fields need, with the keys the client must have.
     *
     * @since WPUF_SINCE
     *
     * @param array $fields Described fields
     *
     * @return array
     */
    private function needs( array $fields ) {
        $needs = [];

        $walk = function ( array $list ) use ( &$walk, &$needs ) {
            foreach ( $list as $field ) {
                if ( isset( self::NEEDS[ $field['template'] ] ) ) {
                    $needs[ self::NEEDS[ $field['template'] ] ] = true;
                }

                if ( 'textarea_field' === $field['template'] && ! empty( $field['rich'] ) && 'no' !== $field['rich'] ) {
                    $needs['editor'] = true;
                }

                if ( 'recaptcha' === $field['template'] ) {
                    $needs['recaptcha_type'] = isset( $field['recaptcha_type'] ) ? $field['recaptcha_type'] : '';
                }

                if ( 'column_field' === $field['template'] && ! empty( $field['inner_fields'] ) ) {
                    foreach ( (array) $field['inner_fields'] as $column_fields ) {
                        $walk( (array) $column_fields );
                    }
                }
            }
        };

        $walk( $fields );

        if ( ! empty( $needs['recaptcha'] ) ) {
            $needs['recaptcha_key'] = (string) wpuf_get_option( 'recaptcha_public', 'wpuf_general' );
        }

        if ( ! empty( $needs['turnstile'] ) ) {
            $needs['turnstile_key'] = (string) wpuf_get_option( 'turnstile_site_key', 'wpuf_general' );
        }

        if ( ! empty( $needs['maps'] ) ) {
            $needs['maps_key'] = (string) wpuf_get_option( 'gmap_api_key', 'wpuf_general' );
        }

        return $needs;
    }

    /**
     * The markup the printing hooks produce, in the order the classic
     * renderer fires them and with the same arguments.
     *
     * @since WPUF_SINCE
     *
     * @param Form  $form     Form
     * @param int   $form_id  Form id
     * @param int   $post_id  Post id (0 for a new post)
     * @param array $settings Settings
     *
     * @return array slot => html
     */
    private function slots( Form $form, $form_id, $post_id, array $settings ) {
        $capture = function ( callable $fire ) {
            ob_start();

            try {
                $fire();
            } finally {
                $html = ob_get_clean();
            }

            return (string) $html;
        };

        $fields = $this->form_fields;

        $slots = [
            'before_form' => $capture(
                function () use ( $form_id ) {
                    do_action( 'wpuf_before_form_render', $form_id );
                }
            ),
            'fields_top'  => $capture(
                function () use ( $form, $fields ) {
                    do_action( 'wpuf_form_fields_top', $form, $fields );
                }
            ),
            'form_top'    => $capture(
                function () use ( $form_id, $post_id, $settings ) {
                    if ( ! $post_id ) {
                        do_action( 'wpuf_add_post_form_top', $form_id, $settings );
                    } else {
                        do_action( 'wpuf_edit_post_form_top', $form_id, $post_id, $settings );
                    }
                }
            ),
            'submit'      => $capture(
                function () use ( $form_id, $settings ) {
                    do_action( 'wpuf_submit_btn', $form_id, $settings );
                }
            ),
            'form_bottom' => $capture(
                function () use ( $form_id, $post_id, $settings ) {
                    if ( ! $post_id ) {
                        do_action( 'wpuf_add_post_form_bottom', $form_id, $settings );
                    } else {
                        do_action( 'wpuf_edit_post_form_bottom', $form_id, $post_id, $settings );
                    }
                }
            ),
            'after_form'  => $capture(
                function () use ( $form_id ) {
                    do_action( 'wpuf_after_form_render', $form_id );
                }
            ),
        ];

        return array_filter( $slots, 'strlen' );
    }
}
