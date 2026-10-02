import { useCallback, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { STORE_NAME } from '../../store';
import { __ } from '@wordpress/i18n';
import { createField } from '../../utils/fieldUtils';
import SortableField from './SortableField';
import HelpText from '../FieldPreview/HelpText';

/**
 * Repeat field canvas component, same layout as the Vue form-repeat_field
 * template: label, divider, inner fields (or an empty-state hint), the static
 * + / - controls and the help text.
 * inner_fields is an ARRAY (NOT object).
 */
// Field types a repeat field accepts (Vue form-repeat_field isAllowedInRepeatField).
const ALLOWED_IN_REPEAT = [
    'text_field',
    'textarea_field',
    'dropdown_field',
    'multiple_select',
    'radio_field',
    'checkbox_field',
    'website_url',
    'date_field',
    'phone_field',
    'numeric_text_field',
    'email_address',
];

export default function RepeatField( { field } ) {
    const { editingFieldId, fieldSettings, formFields } = useSelect( ( select ) => {
        const store = select( STORE_NAME );
        return {
            editingFieldId: store.getEditingFieldId(),
            fieldSettings: store.getFieldSettings(),
            formFields: store.getFormFields(),
        };
    }, [] );

    const { moveRepeatField, addRepeatField } = useDispatch( STORE_NAME );
    const [ isDragOver, setIsDragOver ] = useState( false );

    const sensors = useSensors(
        useSensor( PointerSensor, { activationConstraint: { distance: 5 } } )
    );

    const innerFields = Array.isArray( field.inner_fields ) ? field.inner_fields : [];
    const fieldIds = innerFields.map( ( f ) => String( f.id ) );
    const isEditing = parseInt( editingFieldId ) === parseInt( field.id );

    const handleDragEnd = useCallback( ( event ) => {
        const { active, over } = event;

        if ( ! over || active.id === over.id ) {
            return;
        }

        const fromIndex = innerFields.findIndex( ( f ) => String( f.id ) === active.id );
        const toIndex = innerFields.findIndex( ( f ) => String( f.id ) === over.id );

        if ( fromIndex !== -1 && toIndex !== -1 ) {
            moveRepeatField( field.id, fromIndex, toIndex );
        }
    }, [ field.id, innerFields, moveRepeatField ] );

    // Palette items are dragged with the native HTML5 API (FieldItem sets
    // `wpuf/field-template`), as for column fields.
    const handleNativeDrop = useCallback( ( e ) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver( false );

        const template = e.dataTransfer.getData( 'wpuf/field-template' );

        if ( ! template ) {
            return;
        }

        if ( ! ALLOWED_IN_REPEAT.includes( template ) ) {
            if ( typeof window.Swal !== 'undefined' ) {
                window.Swal.fire( {
                    title: '<span class="wpuf-text-primary">Oops...</span>',
                    html: '<p class="wpuf-text-gray-500 wpuf-text-xl wpuf-m-0 wpuf-p-0">' + __( 'This field type is not supported in repeat field', 'wp-user-frontend' ) + '</p>',
                    imageUrl: ( ( window.wpuf_form_builder || {} ).asset_url || '' ) + '/images/oops.svg',
                    showCloseButton: true,
                    padding: '1rem',
                    width: '35rem',
                    customClass: {
                        confirmButton: '!wpuf-flex focus:!wpuf-shadow-none !wpuf-bg-primary',
                        closeButton: 'wpuf-absolute',
                    },
                } );
            }
            return;
        }

        const newField = createField( template, fieldSettings, formFields, { innerField: true } );

        if ( newField ) {
            addRepeatField( field.id, innerFields.length, newField );
        }
    }, [ field.id, innerFields.length, fieldSettings, formFields, addRepeatField ] );

    const handleNativeDragOver = useCallback( ( e ) => {
        if ( e.dataTransfer.types.includes( 'wpuf/field-template' ) ) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            setIsDragOver( true );
        }
    }, [] );

    return (
        <div
            className={ `wpuf-p-4 wpuf-border wpuf-border-dashed wpuf-rounded-lg group-hover:wpuf-border-primary ${ isEditing ? 'wpuf-bg-green-50 wpuf-border-primary' : 'wpuf-border-transparent' }` }
        >
            <DndContext
                sensors={ sensors }
                collisionDetection={ closestCenter }
                onDragEnd={ handleDragEnd }
            >
                <SortableContext items={ fieldIds } strategy={ verticalListSortingStrategy }>
                    <div className="wpuf-fields wpuf-repeat-field-builder-container">
                        <label htmlFor={ field.name } className="wpuf-option-field-title wpuf-font-sm wpuf-text-gray-700 wpuf-font-medium">
                            { field.label }
                        </label>
                        <hr className="wpuf-mt-4" />
                        <ul
                            className={ `wpuf-repeat-fields-sortable-list wpuf-min-h-16 wpuf-list-none wpuf-p-0 wpuf-m-0 wpuf-transition-colors ${ isDragOver ? 'wpuf-bg-green-50' : '' }` }
                            onDrop={ handleNativeDrop }
                            onDragOver={ handleNativeDragOver }
                            onDragLeave={ () => setIsDragOver( false ) }
                        >
                            { innerFields.length === 0 && (
                                <div className="wpuf-flex wpuf-flex-col wpuf-items-center wpuf-justify-center wpuf-py-12 wpuf-px-4 wpuf-text-center">
                                    <svg className="wpuf-w-12 wpuf-h-12 wpuf-text-gray-300 wpuf-mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                    </svg>
                                    <h3 className="wpuf-text-sm wpuf-font-medium wpuf-text-gray-900 wpuf-mb-2">
                                        { __( 'No fields added yet', 'wp-user-frontend' ) }
                                    </h3>
                                    <p className="wpuf-text-xs wpuf-text-gray-500 wpuf-max-w-sm">
                                        { __( 'Drag and drop fields from the sidebar to build your repeatable section.', 'wp-user-frontend' ) }
                                    </p>
                                </div>
                            ) }
                            { innerFields.map( ( innerField, idx ) => (
                                <SortableField
                                    key={ innerField.id }
                                    field={ innerField }
                                    index={ idx }
                                    container={ { type: 'repeat', repeatFieldId: field.id } }
                                />
                            ) ) }
                        </ul>

                        { /* Static + and - icons, as develop (no interactivity in the builder). */ }
                        <div className="wpuf-repeat-controls wpuf-p-4">
                            <button type="button" className="wpuf-border wpuf-border-gray-100 wpuf-bg-white wpuf-px-[8px] wpuf-py-[2px] wpuf-rounded-[3px]">+</button>
                            <button type="button" className="wpuf-border wpuf-border-gray-100 wpuf-bg-white wpuf-px-[8px] wpuf-py-[2px] wpuf-rounded-[3px]">-</button>
                        </div>

                        <HelpText text={ field.help } />
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
