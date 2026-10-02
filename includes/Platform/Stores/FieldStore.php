<?php
/**
 * Form field store
 *
 * @package WP_User_Frontend
 * @since WPUF_SINCE
 */

namespace WeDevs\Wpuf\Platform\Stores;

/**
 * The one writer of form fields: `wpuf_input` child posts of a form, one per
 * top-level field (column and repeat inner fields live inside their parent's
 * content), ordered by `menu_order`.
 *
 * @since WPUF_SINCE
 */
class FieldStore {

    /**
     * Fields of a form, as wpuf_get_form_fields() reads them.
     *
     * @since WPUF_SINCE
     *
     * @param int $form_id Form id
     *
     * @return array
     */
    public function read( $form_id ) {
        return wpuf_get_form_fields( $form_id );
    }

    /**
     * Insert or update one field post.
     *
     * @since WPUF_SINCE
     *
     * @param int   $form_id  Form id
     * @param array $field    Field settings
     * @param int   $field_id Existing field post id (0 inserts)
     * @param int   $order    Position
     * @param bool  $unslash  Unslash before storing (builder and API input);
     *                        form templates store their fields as given
     *
     * @return int|\WP_Error Field post id
     */
    public function write( $form_id, $field, $field_id = 0, $order = 0, $unslash = true ) {
        $args = [
            'post_type'    => 'wpuf_input',
            'post_parent'  => $form_id,
            'post_status'  => 'publish',
            'post_content' => maybe_serialize( $unslash ? wp_unslash( $field ) : $field ),
            'menu_order'   => $order,
        ];

        if ( $field_id ) {
            $args['ID'] = $field_id;

            return wp_update_post( $args );
        }

        return wp_insert_post( $args );
    }

    /**
     * Save a form's fields as the builder sends them: new fields (`is_new`) are
     * inserted, the others updated in place, and stored fields left out of the
     * save are deleted, except custom taxonomy fields the builder hides while
     * Pro is inactive.
     *
     * @since WPUF_SINCE
     *
     * @param int   $form_id Form id
     * @param array $fields  Fields in order
     *
     * @return array Saved fields, with their post id and `is_new` false
     */
    public function save( $form_id, $fields ) {
        $saved    = [];
        $kept_ids = [];
        $existing = get_children(
            [
                'post_parent' => $form_id,
                'post_status' => 'publish',
                'post_type'   => 'wpuf_input',
                'numberposts' => '-1',
                'orderby'     => 'menu_order',
                'order'       => 'ASC',
                'fields'      => 'ids',
            ]
        );

        foreach ( (array) $fields as $order => $field ) {
            if ( ! empty( $field['is_new'] ) ) {
                unset( $field['is_new'], $field['id'] );
                $field_id = 0;
            } else {
                $field_id = isset( $field['id'] ) ? $field['id'] : 0;
            }

            $field_id   = $this->write( $form_id, $field, $field_id, $order );
            $kept_ids[] = $field_id;

            $field['id']     = $field_id;
            $field['is_new'] = false;
            $saved[]         = $field;
        }

        $to_delete = array_diff( $existing, $kept_ids );
        $to_delete = array_diff( $to_delete, $this->hidden_pro_taxonomy_ids( $to_delete ) );

        foreach ( $to_delete as $field_id ) {
            wp_delete_post( $field_id, true );
        }

        return $saved;
    }

    /**
     * Copy every field of one form to another, in order.
     *
     * @since WPUF_SINCE
     *
     * @param int $from_form_id Source form id
     * @param int $to_form_id   Target form id
     *
     * @return void
     */
    public function copy( $from_form_id, $to_form_id ) {
        foreach ( $this->read( $from_form_id ) as $field ) {
            $this->write( $to_form_id, $field );
        }
    }

    /**
     * Delete every field post of a form (any status).
     *
     * @since WPUF_SINCE
     *
     * @param int $form_id Form id
     *
     * @return void
     */
    public function delete_all( $form_id ) {
        $field_ids = get_children(
            [
                'post_parent' => $form_id,
                'post_type'   => 'wpuf_input',
                'post_status' => 'any',
                'numberposts' => -1,
                'fields'      => 'ids',
            ]
        );

        foreach ( $field_ids as $field_id ) {
            wp_delete_post( $field_id, true );
        }
    }

    /**
     * Field post ids holding a custom taxonomy field the builder hides while Pro
     * is inactive (its absence from a save is not a removal, task 1.11).
     *
     * @since WPUF_SINCE
     *
     * @param int[] $field_ids Field post ids
     *
     * @return int[]
     */
    public function hidden_pro_taxonomy_ids( $field_ids ) {
        if ( empty( $field_ids ) || wpuf_is_pro_active() ) {
            return [];
        }

        $free_taxonomies = wpuf_get_free_taxonomies();
        $hidden          = [];

        foreach ( $field_ids as $field_id ) {
            $field = maybe_unserialize( get_post_field( 'post_content', $field_id ) );

            if (
                is_array( $field )
                && isset( $field['input_type'], $field['name'] )
                && 'taxonomy' === $field['input_type']
                && ! in_array( $field['name'], $free_taxonomies, true )
            ) {
                $hidden[] = $field_id;
            }
        }

        return $hidden;
    }
}
