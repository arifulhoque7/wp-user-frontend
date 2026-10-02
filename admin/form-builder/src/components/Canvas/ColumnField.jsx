import { useState, useCallback, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { STORE_NAME } from '../../store';
import { createField, isFieldSingleInstance, containsField } from '../../utils/fieldUtils';
import SortableField from './SortableField';

const RESTRICTED_IN_COLUMN = [ 'column_field', 'custom_hidden_field', 'step_start' ];

const COLUMN_DROP_PREFIX = 'column-drop:';

/**
 * One column's sortable list; the list itself is a drop target so a field can
 * be moved into an empty column.
 */
function ColumnDropList( { columnKey, items, children } ) {
    const { setNodeRef } = useDroppable( { id: COLUMN_DROP_PREFIX + columnKey } );

    return (
        <SortableContext items={ items } strategy={ verticalListSortingStrategy }>
            <ul ref={ setNodeRef } className="wpuf-column-fields-sortable-list wpuf-min-h-16 wpuf-list-none !wpuf-m-0 !wpuf-p-0">
                { children }
            </ul>
        </SortableContext>
    );
}

/**
 * Column field canvas component.
 * inner_fields is an OBJECT: { 'column-1': [], 'column-2': [], 'column-3': [] }
 *
 * Supports drag-and-drop from the sidebar panel via HTML5 native drag API,
 * mirroring Vue's jQuery UI draggable + connectToSortable behavior.
 */
export default function ColumnField( { field } ) {
    const { editingFieldId, fieldSettings, formFields } = useSelect( ( select ) => {
        const store = select( STORE_NAME );
        return {
            editingFieldId: store.getEditingFieldId(),
            fieldSettings: store.getFieldSettings(),
            formFields: store.getFormFields(),
        };
    }, [] );

    const { moveColumnField, addColumnField } = useDispatch( STORE_NAME );

    const [ dragOverColumn, setDragOverColumn ] = useState( null );

    const sensors = useSensors(
        useSensor( PointerSensor, { activationConstraint: { distance: 5 } } )
    );

    const columns = field.inner_fields || {};
    const numColumns = parseInt( field.columns ) || 3;

    const columnKeys = useMemo( () => {
        const keys = [];
        for ( let i = 1; i <= numColumns; i++ ) {
            keys.push( 'column-' + i );
        }
        return keys;
    }, [ numColumns ] );

    // One drag context for the whole column field, so an inner field can be
    // moved inside its column or into another one (develop connected the lists).
    const handleDragEnd = useCallback( ( event ) => {
        const { active, over } = event;

        if ( ! over || active.id === over.id ) {
            return;
        }

        const columnOf = ( id ) => Object.keys( columns ).find(
            ( key ) => ( columns[ key ] || [] ).some( ( f ) => String( f.id ) === id )
        );
        const fromColumn = columnOf( active.id );

        if ( ! fromColumn ) {
            return;
        }

        const fromIndex = columns[ fromColumn ].findIndex( ( f ) => String( f.id ) === active.id );
        const overIsColumn = String( over.id ).startsWith( COLUMN_DROP_PREFIX );
        const toColumn = overIsColumn ? String( over.id ).slice( COLUMN_DROP_PREFIX.length ) : columnOf( over.id );

        if ( ! toColumn ) {
            return;
        }

        const target = columns[ toColumn ] || [];
        // Dropped on the cell itself: to the end of that column.
        const toIndex = overIsColumn ? target.length - ( fromColumn === toColumn ? 1 : 0 ) : target.findIndex( ( f ) => String( f.id ) === over.id );

        if ( fromColumn === toColumn && fromIndex === toIndex ) {
            return;
        }

        moveColumnField( field.id, fromColumn, fromIndex, toColumn, toIndex );
    }, [ field.id, columns, moveColumnField ] );

    const data = window.wpuf_form_builder || {};
    const singleObjects = data.wpuf_single_objects || [];

    const handleNativeDrop = useCallback( ( columnKey, e ) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverColumn( null );

        const template = e.dataTransfer.getData( 'wpuf/field-template' );

        if ( ! template ) {
            return;
        }

        // Vue: isAllowedInColumnField check
        if ( RESTRICTED_IN_COLUMN.includes( template ) ) {
            if ( typeof window.Swal !== 'undefined' ) {
                window.Swal.fire( {
                    title: '<span class="wpuf-text-primary">Oops...</span>',
                    html: '<p class="wpuf-text-gray-500 wpuf-text-xl wpuf-m-0 wpuf-p-0">' + __( 'You cannot add this field as inner column field', 'wp-user-frontend' ) + '</p>',
                    imageUrl: ( data.asset_url || '' ) + '/images/oops.svg',
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

        // Vue: isSingleInstance + containsField check
        if ( isFieldSingleInstance( template, singleObjects ) && containsField( formFields, template ) ) {
            if ( typeof window.Swal !== 'undefined' ) {
                window.Swal.fire( {
                    title: '<span class="wpuf-text-primary">Oops...</span>',
                    html: '<p class="wpuf-text-gray-500 wpuf-text-xl wpuf-m-0 wpuf-p-0">' + __( 'You already have this field in the form', 'wp-user-frontend' ) + '</p>',
                    imageUrl: ( data.asset_url || '' ) + '/images/oops.svg',
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

        if ( ! newField ) {
            return;
        }

        const colFields = columns[ columnKey ] || [];
        addColumnField( field.id, columnKey, colFields.length, newField );
    }, [ field.id, columns, fieldSettings, formFields, singleObjects, addColumnField, data.asset_url ] );

    const handleNativeDragOver = useCallback( ( columnKey, e ) => {
        const hasFieldData = e.dataTransfer.types.includes( 'wpuf/field-template' );

        if ( hasFieldData ) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            setDragOverColumn( columnKey );
        }
    }, [] );

    const handleNativeDragLeave = useCallback( () => {
        setDragOverColumn( null );
    }, [] );

    return (
        <DndContext sensors={ sensors } collisionDetection={ closestCenter } onDragEnd={ handleDragEnd }>
            <div
                className={ `has-columns-${ numColumns } wpuf-field-columns wpuf-flex md:wpuf-flex-row wpuf-gap-4 wpuf-p-4 wpuf-w-full wpuf-justify-between wpuf-rounded-t-md !wpuf-border-t !wpuf-border-r !wpuf-border-l !wpuf-border-dashed !wpuf-border-transparent group-hover:!wpuf-border-green-400 group-hover:wpuf-cursor-pointer` }
            >
                { columnKeys.map( ( columnKey ) => {
                    const colFields = columns[ columnKey ] || [];
                    const colFieldIds = colFields.map( ( f ) => String( f.id ) );
                    const isDragOver = dragOverColumn === columnKey;

                    return (
                        <div
                            key={ columnKey }
                            style={ { paddingRight: ( field.column_space || 0 ) + 'px' } }
                            className="wpuf-flex-1 wpuf-min-w-0 wpuf-min-h-full wpuf-column-inner-fields"
                        >
                            <div
                                data-column={ columnKey }
                                className={ `wpuf-border wpuf-border-dashed wpuf-border-green-400 wpuf-bg-green-50 wpuf-shadow-sm wpuf-rounded-md wpuf-p-1 wpuf-transition-colors ${ isDragOver ? 'wpuf-bg-green-100 wpuf-border-primary' : '' }` }
                                onDrop={ ( e ) => handleNativeDrop( columnKey, e ) }
                                onDragOver={ ( e ) => handleNativeDragOver( columnKey, e ) }
                                onDragLeave={ handleNativeDragLeave }
                            >
                                <ColumnDropList columnKey={ columnKey } items={ colFieldIds }>
                                    { colFields.map( ( innerField, idx ) => (
                                        <SortableField
                                            key={ innerField.id }
                                            field={ innerField }
                                            index={ idx }
                                            container={ { type: 'column', columnFieldId: field.id, column: columnKey } }
                                        />
                                    ) ) }
                                </ColumnDropList>
                            </div>
                        </div>
                    );
                } ) }
            </div>
        </DndContext>
    );
}
