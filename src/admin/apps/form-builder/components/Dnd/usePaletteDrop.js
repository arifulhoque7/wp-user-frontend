/**
 * Add a palette field where it was dropped (design.md D16), with develop's
 * checks and refusal messages: stage (useAddField: single instance, custom
 * field tooltip), column cell (column / hidden / step fields refused, single
 * instance), repeat (allowed types only).
 *
 * @since WPUF_SINCE
 */
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../store';
import useAddField from '../../hooks/useAddField';
import { createField, isFieldSingleInstance, containsField } from '../../utils/fieldUtils';
import { canDrop, parseContainer } from '../../utils/dndTree';

/**
 * Develop's "Oops..." alert.
 *
 * @param {string} message Message.
 */
export function showOops( message ) {
    if ( typeof window.Swal === 'undefined' ) {
        return;
    }

    window.Swal.fire( {
        title: '<span class="text-primary">Oops...</span>',
        html: '<p class="text-gray-500 text-xl m-0 p-0">' + message + '</p>',
        imageUrl: ( ( window.wpuf_form_builder || {} ).asset_url || '' ) + '/images/oops.svg',
        showCloseButton: true,
        padding: '1rem',
        width: '35rem',
        customClass: {
            confirmButton: 'flex! focus:shadow-none! bg-primary!',
            closeButton: 'absolute',
        },
    } );
}

/**
 * @return {Function} `( template, { container, index } ) => void`
 */
export default function usePaletteDrop() {
    const { fieldSettings, formFields } = useSelect( ( select ) => {
        const store = select( STORE_NAME );

        return {
            fieldSettings: store.getFieldSettings(),
            formFields: store.getFormFields(),
        };
    }, [] );

    const { addColumnField, addRepeatField } = useDispatch( STORE_NAME );
    const addToStage = useAddField();

    return useCallback( ( template, target ) => {
        const list = parseContainer( target.container );

        if ( 'top' === list.type ) {
            addToStage( template, target.index );
            return;
        }

        if ( ! canDrop( { kind: 'palette', template }, target.container ) ) {
            showOops( 'column' === list.type
                ? __( 'You cannot add this field as inner column field', 'wp-user-frontend' )
                : __( 'This field type is not supported in repeat field', 'wp-user-frontend' ) );
            return;
        }

        if ( 'column' === list.type ) {
            const singleObjects = ( window.wpuf_form_builder || {} ).wpuf_single_objects || [];

            if ( isFieldSingleInstance( template, singleObjects ) && containsField( formFields, template ) ) {
                showOops( __( 'You already have this field in the form', 'wp-user-frontend' ) );
                return;
            }
        }

        const field = createField( template, fieldSettings, formFields, { innerField: true } );

        if ( ! field ) {
            return;
        }

        if ( 'column' === list.type ) {
            addColumnField( parseInt( list.fieldId, 10 ), list.column, target.index, field );
        } else {
            addRepeatField( parseInt( list.fieldId, 10 ), target.index, field );
        }
    }, [ fieldSettings, formFields, addColumnField, addRepeatField, addToStage ] );
}
