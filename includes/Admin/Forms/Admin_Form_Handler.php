<?php

namespace WeDevs\Wpuf\Admin\Forms;

use WeDevs\Wpuf\Admin\Forms;
use WeDevs\Wpuf\Platform\Stores\Stores;
use WeDevs\Wpuf\Pro\Admin\List_Table_Profile_Forms;

class Admin_Form_Handler {

    public function __construct() {
        add_action( 'wpuf_load_post_forms', [ $this, 'post_forms_actions' ] );
        add_action( 'wpuf_load_profile_forms', [ $this, 'profile_forms_actions' ] );
        add_action( 'admin_notices', [ $this, 'admin_notices' ] );
        add_action( 'removable_query_args', [ $this, 'removable_query_args' ] );
    }

    /**
     * Check current page actions
     *
     * @since 2.5
     *
     * @param int $page_id
     * @param int $bulk_action
     *
     * @return bool
     */
    public function verify_current_page_screen( $page_id, $bulk_action ) {
        if ( empty( $_GET['_wpnonce'] ) || empty( $_GET['page'] ) ) {
            return false;
        }

        if ( $_GET['page'] != $page_id ) {
            return false;
        }

        $nonce = isset( $_GET['_wpnonce'] ) ? sanitize_key( wp_unslash( $_GET['_wpnonce'] ) ) : '';

        if ( isset( $nonce ) && ! wp_verify_nonce( $nonce, $bulk_action ) ) {
            return false;
        }

        return true;
    }

    /**
     * Handle Post Forms list table action
     *
     * @since 2.5
     *
     * @return void
     */
    public function post_forms_actions() {
        // Nonce validation
        if ( ! $this->verify_current_page_screen( 'wpuf-post-forms', 'bulk-post-forms' ) ) {
            return;
        }

        // Check permission if not wpuf admin then go out from here
        if ( ! current_user_can( wpuf_admin_role() ) ) {
            wp_die( esc_html( __( 'You do not have sufficient permissions to do this action', 'wp-user-frontend' ) ) );
        }

        //        $post_forms = new Forms\Post\Templates\List_Table_Admin_Post_Forms();
        //        $action     = $post_forms->current_action();

        $action = isset( $_GET['action'] ) ? sanitize_text_field( wp_unslash( $_GET['action'] ) ) : '';

        if ( ! $action ) {
            return;
        }

        $remove_query_args = [
            '_wp_http_referer',
            '_wpnonce',
            'action',
            'id',
            'post',
            'action2',
        ];

        $add_query_args = [];

        switch ( $action ) {
            case 'post_form_search':
                $remove_query_args[] = 'post_form_search';
                $redirect = remove_query_arg( $remove_query_args, isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '' );
                break;

            case 'trash':
                if ( ! empty( $_GET['id'] ) ) {
                    $id = intval( wp_unslash( $_GET['id'] ) );
                    Stores::forms()->trash( $id );

                    $add_query_args['trashed'] = 1;
                } elseif ( ! empty( $_GET['post'] ) ) {
                    $posts = isset( $_GET['post'] ) ? array_map( 'sanitize_text_field', wp_unslash( $_GET['post'] ) ) : [];
                    foreach ( $posts as $post_id ) {
                        Stores::forms()->trash( $post_id );
                    }

                    $add_query_args['trashed'] = count( $_GET['post'] );
                }

                break;

            case 'restore':
                if ( ! empty( $_GET['id'] ) ) {
                    $id = intval( wp_unslash( $_GET['id'] ) );
                    Stores::forms()->restore( $id );

                    $add_query_args['untrashed'] = 1;
                } elseif ( ! empty( $_GET['post'] ) ) {
                    $posts = array_map( 'sanitize_text_field', wp_unslash( $_GET['post'] ) );

                    foreach ( $posts as $post_id ) {
                        Stores::forms()->restore( $post_id );

                        $add_query_args['untrashed'] = count( $posts );
                    }
                }

                break;

            case 'delete':
                if ( ! empty( $_GET['id'] ) ) {
                    $id = intval( wp_unslash( $_GET['id'] ) );
                    $this->delete_form( $id );

                    $add_query_args['deleted'] = 1;
                } elseif ( ! empty( $_GET['post'] ) ) {
                    $posts = array_map( 'sanitize_text_field', wp_unslash( $_GET['post'] ) );
                    foreach ( $posts as $post_id ) {
                        $this->delete_form( $post_id );
                    }

                    $add_query_args['deleted'] = count( $posts );
                }

                $add_query_args['post_status'] = 'trash';

                break;

            case 'duplicate':
                if ( ! empty( $_GET['id'] ) ) {
                    $id = intval( wp_unslash( $_GET['id'] ) );
                    $add_query_args['duplicated'] = wpuf_duplicate_form( $id );
                }

                break;
        }

        $request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
        $redirect = remove_query_arg( $remove_query_args, $request_uri );

        $redirect = add_query_arg( $add_query_args, $redirect );

        wp_redirect( $redirect );
        exit();
    }

    /**
     * Handle Profile Forms list table action
     *
     * @since 2.5
     *
     * @return void
     */
    public function profile_forms_actions() {
        // Nonce validation
        if ( ! $this->verify_current_page_screen( 'wpuf-profile-forms', 'bulk-profile-forms' ) ) {
            return;
        }

        // Check permission if not wpuf admin then go out from here
        if ( ! current_user_can( wpuf_admin_role() ) ) {
            wp_die( esc_html( __( 'You do not have sufficient permissions to do this action', 'wp-user-frontend' ) ) );
        }

        $profile_forms = new List_Table_Profile_Forms();
        $action        = $profile_forms->current_action();

        if ( $action ) {
            $remove_query_args = [
                '_wp_http_referer',
                '_wpnonce',
                'action',
                'id',
                'post',
                'action2',
            ];

            $add_query_args = [];

            switch ( $action ) {
                case 'profile_form_search':
                    $remove_query_args[] = 'profile_form_search';
                    $redirect = remove_query_arg( $remove_query_args, isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '' );

                    break;

                case 'trash':
                    if ( ! empty( $_GET['id'] ) ) {
                        $id = intval( wp_unslash( $_GET['id'] ) );
                        Stores::forms()->trash( $id );

                        $add_query_args['trashed'] = 1;
                    } elseif ( ! empty( $_GET['post'] ) ) {
                        $posts = array_map( 'sanitize_text_field', wp_unslash( $_GET['post'] ) );

                        foreach ( $posts as $post_id ) {
                            Stores::forms()->trash( $post_id );
                        }

                        $add_query_args['trashed'] = count( $_GET['post'] );
                    }

                    break;

                case 'restore':
                    if ( ! empty( $_GET['id'] ) ) {
                        $id = intval( wp_unslash( $_GET['id'] ) );
                        Stores::forms()->restore( $id );

                        $add_query_args['untrashed'] = 1;
                    } elseif ( ! empty( $_GET['post'] ) ) {
                        $posts = array_map( 'sanitize_text_field', wp_unslash( $_GET['post'] ) );

                        foreach ( $posts as $post_id ) {
                            Stores::forms()->restore( $post_id );

                            $add_query_args['untrashed'] = count( $_GET['post'] );
                        }
                    }

                    break;

                case 'delete':
                    if ( ! empty( $_GET['id'] ) ) {
                        $id = intval( wp_unslash( $_GET['id'] ) );

                        $this->delete_form( $id );

                        $add_query_args['deleted'] = 1;
                    } elseif ( ! empty( $_GET['post'] ) ) {
                        $posts = array_map( 'sanitize_text_field', wp_unslash( $_GET['post'] ) );

                        foreach ( $posts as $post_id ) {
                            $this->delete_form( $post_id );
                        }

                        $add_query_args['deleted'] = count( $posts );
                    }

                    $add_query_args['post_status'] = 'trash';

                    break;

                case 'duplicate':
                    if ( ! empty( $_GET['id'] ) ) {
                        $id = intval( wp_unslash( $_GET['id'] ) );
                        $add_query_args['duplicated'] = wpuf_duplicate_form( $id );
                    }

                    break;
            }

            $request_uri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';

            $redirect = remove_query_arg( $remove_query_args, $request_uri );

            $redirect = add_query_arg( $add_query_args, $redirect );

            wp_redirect( $redirect );
            exit();
        }
    }

    /**
     * Print notices for WordPress
     *
     * @since 2.5
     *
     * @param string $text
     * @param string $type
     *
     * @return void
     */
    public function display_notice( $text, $type = 'updated' ) {
        printf( '<div class="%s"><p>%s</p></div>', esc_attr( $type ), wp_kses_post( $text ) );
    }

    /**
     * Admin notices
     *
     * @since 2.5
     *
     * @return void
     */
    public function admin_notices() {
        if ( wpuf_is_admin_screen( 'wpuf-post-forms' ) ) {
            if ( ! empty( $_GET['trashed'] ) ) {
                $trashed = sanitize_text_field( wp_unslash( $_GET['trashed'] ) );
                $notice = sprintf(
                    // translators: %d is the number of forms
                    _n( '%d form moved to the trash.', '%d forms moved to the trash.', $trashed, 'wp-user-frontend' ),
                    $trashed
                );
                $this->display_notice( $notice );
            } elseif ( ! empty( $_GET['untrashed'] ) ) {
                $untrashed = isset( $_GET['untrashed'] ) ? sanitize_text_field( wp_unslash( $_GET['untrashed'] ) ) : '';

                $notice = sprintf(
                    // translators: %d is the number of forms
                    _n( '%d form restored from the trash.', '%d forms restored from the trash.', $untrashed, 'wp-user-frontend' ),
                    $untrashed
                );
                $this->display_notice( $notice );
            } elseif ( ! empty( $_GET['deleted'] ) ) {
                $deleted = sanitize_text_field( wp_unslash( $_GET['deleted'] ) );

                $notice = sprintf(
                    // translators: %d is the number of forms
                    _n( '%d form permanently deleted.', '%d forms permanently deleted.', $deleted, 'wp-user-frontend' ),
                    $deleted
                );
                $this->display_notice( $notice );
            } elseif ( ! empty( $_GET['duplicated'] ) ) {
                $duplicated = sanitize_text_field( wp_unslash( $_GET['duplicated'] ) );

                $form_url = admin_url( 'admin.php?page=wpuf-post-forms&action=edit&id=' . $duplicated );
                $notice   = sprintf(
                    // translators: %s is the form url
                    __( 'Form duplicated successfully. <a href="%s">View form.</a>', 'wp-user-frontend' ),
                    $form_url
                );
                $this->display_notice( $notice );
            }
        }

        if ( wpuf_is_admin_screen( 'wpuf-profile-forms' ) ) {
            if ( ! empty( $_GET['trashed'] ) ) {
                $trashed = sanitize_text_field( wp_unslash( $_GET['trashed'] ) );

                $notice = sprintf(
                    // translators: %s is the form url
                    _n( '%d form moved to the trash.', '%d forms moved to the trash.', $trashed, 'wp-user-frontend' ),
                    $trashed
                );
                $this->display_notice( $notice );
            } elseif ( ! empty( $_GET['untrashed'] ) ) {
                $untrashed = sanitize_text_field( wp_unslash( $_GET['untrashed'] ) );

                $notice = sprintf(
                    // translators: %d is the number of forms
                    _n( '%d form restored from the trash.', '%d forms restored from the trash.', $untrashed, 'wp-user-frontend' ),
                    $untrashed
                );
                $this->display_notice( $notice );
            } elseif ( ! empty( $_GET['deleted'] ) ) {
                $deleted = sanitize_text_field( wp_unslash( $_GET['deleted'] ) );

                $notice = sprintf(
                    // translators: %d is the number of form
                    _n( '%d form permanently deleted.', '%d forms permanently deleted.', $deleted, 'wp-user-frontend' ),
                    $deleted
                );
                $this->display_notice( $notice );
            } elseif ( ! empty( $_GET['duplicated'] ) ) {
                $duplicated = sanitize_text_field( wp_unslash( $_GET['duplicated'] ) );

                $form_url = admin_url( 'admin.php?page=wpuf-profile-forms&action=edit&id=' . $duplicated );
                $notice   = sprintf(
                    // translators: %s is the form url
                    __( 'Form duplicated successfully. <a href="%s">View form.</a>', 'wp-user-frontend' ),
                    $form_url
                );
                $this->display_notice( $notice );
            }
        }
    }

    /**
     * Add custom query args to the wp removable query args
     *
     * @since 2.5
     *
     * @param array $args
     *
     * @return array
     */
    public function removable_query_args() {
        $args[] = 'duplicated';

        return $args;
    }

    /**
     * Permanently delete a form and its field posts
     *
     * Only acts on form post types. Field posts are removed once the form is
     * gone, so a form that only moved to the trash keeps its fields.
     *
     * @since WPUF_SINCE
     *
     * @param int $form_id Form id.
     *
     * @return bool
     */
    protected function delete_form( $form_id ) {
        return Stores::forms()->delete_permanently( $form_id );
    }
}
