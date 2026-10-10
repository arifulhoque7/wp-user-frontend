/**
 * Client-side validation from the schema: required, type (email, url,
 * number), content restriction (characters or words, min or max), file
 * counts. Messages are the ones the classic form shows; the server
 * validates everything again (frontend-react-architecture.md 5.3).
 *
 * @since WPUF_SINCE
 */
import { __, sprintf } from '@wordpress/i18n';

const on = ( value ) => 'yes' === value || 'on' === value || true === value || 'true' === value;

const isEmpty = ( value ) => {
    if ( Array.isArray( value ) ) {
        return 0 === value.filter( ( v ) => '' !== v && null !== v && undefined !== v ).length;
    }

    return null === value || undefined === value || '' === String( value ).trim();
};

const words = ( text ) => String( text || '' ).trim().split( /\s+/ ).filter( Boolean ).length;
const chars = ( text ) => String( text || '' ).trim().length;

/** Templates whose value is a list of attachment ids. */
export const UPLOAD_TEMPLATES = [ 'image_upload', 'featured_image', 'file_upload', 'profile_photo', 'cover_photo', 'avatar' ];

/** Templates that never carry a value. */
export const PASSIVE_TEMPLATES = [ 'section_break', 'custom_html', 'column_field', 'step_start', 'action_hook', 'shortcode', 'toc' ];

/**
 * @param {Object} field Field settings.
 * @param {*}      value Current value.
 * @return {string} An error message, or ''.
 */
export function validateField( field, value ) {
    if ( PASSIVE_TEMPLATES.includes( field.template ) ) {
        return '';
    }

    const required = on( field.required );

    if ( required && isEmpty( value ) ) {
        return __( 'This field is required.', 'wp-user-frontend' );
    }

    if ( isEmpty( value ) ) {
        return '';
    }

    const text = Array.isArray( value ) ? value.join( ' ' ) : String( value );

    if ( 'email_address' === field.template && ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( text.trim() ) ) {
        return __( 'Please enter a valid email address.', 'wp-user-frontend' );
    }

    if ( 'website_url' === field.template && ! /^(https?:\/\/)?[^\s/$.?#].[^\s]*$/i.test( text.trim() ) ) {
        return __( 'Please enter a valid URL.', 'wp-user-frontend' );
    }

    if ( 'numeric_text_field' === field.template ) {
        const number = Number( text );

        if ( Number.isNaN( number ) ) {
            return __( 'Please enter a number.', 'wp-user-frontend' );
        }

        if ( '' !== field.min_value_field && undefined !== field.min_value_field && number < Number( field.min_value_field ) ) {
            /* translators: %s: minimum */
            return sprintf( __( 'The value must be at least %s.', 'wp-user-frontend' ), field.min_value_field );
        }

        if ( '' !== field.max_value_field && undefined !== field.max_value_field && number > Number( field.max_value_field ) ) {
            /* translators: %s: maximum */
            return sprintf( __( 'The value must be at most %s.', 'wp-user-frontend' ), field.max_value_field );
        }
    }

    const limit = Number( field.content_restriction );

    if ( limit > 0 ) {
        const by = 'word' === field.restriction_type ? 'word' : 'character';
        const count = 'word' === by ? words( text ) : chars( text );
        const to = 'min' === field.restriction_to ? 'min' : 'max';

        if ( 'min' === to && count < limit ) {
            return 'word' === by
                /* translators: 1: number, 2: field label */
                ? sprintf( __( 'Minimum %1$d word is required for %2$s', 'wp-user-frontend' ), limit, field.label )
                /* translators: 1: number, 2: field label */
                : sprintf( __( 'Minimum %1$d character is required for %2$s', 'wp-user-frontend' ), limit, field.label );
        }

        if ( 'max' === to && count > limit ) {
            return 'word' === by
                /* translators: 1: number, 2: field label */
                ? sprintf( __( 'Maximum %1$d word is allowed for %2$s', 'wp-user-frontend' ), limit, field.label )
                /* translators: 1: number, 2: field label */
                : sprintf( __( 'Maximum %1$d character is allowed for %2$s', 'wp-user-frontend' ), limit, field.label );
        }
    }

    if ( UPLOAD_TEMPLATES.includes( field.template ) && Array.isArray( value ) ) {
        const max = Number( field.count || field.max_files || 0 );

        if ( max > 0 && value.length > max ) {
            /* translators: %d: number of files */
            return sprintf( __( 'You can upload at most %d files.', 'wp-user-frontend' ), max );
        }
    }

    return '';
}

/**
 * Validate every visible field.
 *
 * @param {Array}       fields  Fields (flat, visible ones).
 * @param {Object}      values  name => value
 * @return {Object} name => message
 */
export function validateAll( fields, values ) {
    const errors = {};

    fields.forEach( ( field ) => {
        const error = validateField( field, values[ field.name ] );

        if ( error ) {
            errors[ field.name ] = error;
        }
    } );

    return errors;
}
