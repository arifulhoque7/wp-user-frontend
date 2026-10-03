import { Fragment, useMemo, useCallback, useState, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { STORE_NAME } from '../../store';
import { filterCanvasRender } from '../../extensions/hooks';
import useAddField from '../../hooks/useAddField';
import SortableField from './SortableField';
import EmptyState from './EmptyState';
import HiddenFieldsList from './HiddenFieldsList';

export default function BuilderCanvas() {
    const { formFields, settings } = useSelect( ( select ) => {
        const store = select( STORE_NAME );
        return {
            formFields: store.getFormFields(),
            settings: store.getSettings(),
        };
    }, [] );

    const { moveField } = useDispatch( STORE_NAME );

    const sensors = useSensors(
        useSensor( PointerSensor, {
            activationConstraint: { distance: 5 },
        } ),
        useSensor( KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        } )
    );

    const fieldIds = useMemo( () => {
        return formFields.map( ( field ) => String( field.id ) );
    }, [ formFields ] );

    const labelType = settings.label_position || 'above';

    const handleDragEnd = useCallback( ( event ) => {
        const { active, over } = event;

        if ( ! over || active.id === over.id ) {
            return;
        }

        const fromIndex = formFields.findIndex( ( f ) => String( f.id ) === active.id );
        const toIndex = formFields.findIndex( ( f ) => String( f.id ) === over.id );

        if ( fromIndex !== -1 && toIndex !== -1 ) {
            moveField( fromIndex, toIndex );
        }
    }, [ formFields, moveField ] );

    // Apply Pro canvas render filter
    const canvasClass = filterCanvasRender( '' );

    // Palette fields dragged onto the stage are added at the drop position, as
    // develop's sortable stage did; `dropIndex` places the drop zone marker.
    const addFieldFromTemplate = useAddField();
    const listRef = useRef( null );
    const [ dropIndex, setDropIndex ] = useState( null );

    const indexAt = useCallback( ( clientY ) => {
        const rows = listRef.current
            ? Array.from( listRef.current.children ).filter( ( row ) => row.matches( 'li[data-index]' ) && row.offsetParent )
            : [];

        for ( const row of rows ) {
            const box = row.getBoundingClientRect();

            if ( clientY < box.top + ( box.height / 2 ) ) {
                return parseInt( row.dataset.index, 10 );
            }
        }

        return formFields.length;
    }, [ formFields.length ] );

    const handleNativeDragOver = useCallback( ( e ) => {
        if ( ! e.dataTransfer.types.includes( 'wpuf/field-template' ) ) {
            return;
        }

        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        // Over a column or repeat field the inner drop zone takes the field.
        setDropIndex( e.target.closest( '.wpuf-column-inner-fields, .wpuf-repeat-fields-sortable-list' ) ? null : indexAt( e.clientY ) );
    }, [ indexAt ] );

    const handleNativeDragLeave = useCallback( ( e ) => {
        if ( ! e.currentTarget.contains( e.relatedTarget ) ) {
            setDropIndex( null );
        }
    }, [] );

    const handleNativeDrop = useCallback( ( e ) => {
        const template = e.dataTransfer.getData( 'wpuf/field-template' );

        setDropIndex( null );

        if ( ! template ) {
            return;
        }

        e.preventDefault();
        addFieldFromTemplate( template, indexAt( e.clientY ) );
    }, [ addFieldFromTemplate, indexAt ] );

    const dropHandlers = {
        onDragOver: handleNativeDragOver,
        onDragLeave: handleNativeDragLeave,
        onDrop: handleNativeDrop,
    };

    if ( ! formFields.length ) {
        return (
            <div id="form-preview-stage" { ...dropHandlers }>
                <EmptyState />
            </div>
        );
    }

    return (
        <DndContext
            sensors={ sensors }
            collisionDetection={ closestCenter }
            onDragEnd={ handleDragEnd }
        >
            <SortableContext items={ fieldIds } strategy={ verticalListSortingStrategy }>
                <div id="form-preview-stage" className="h-[70vh]" { ...dropHandlers }>
                    <ul ref={ listRef } className={ `wpuf-form sortable-list py-8 form-label-${ labelType } ${ canvasClass }` }>
                        { formFields.map( ( field, index ) => (
                            <Fragment key={ field.id }>
                                { dropIndex === index && <li className="form-preview-stage-dropzone" /> }
                                <SortableField
                                    field={ field }
                                    index={ index }
                                />
                            </Fragment>
                        ) ) }
                        { dropIndex === formFields.length && <li className="form-preview-stage-dropzone" /> }
                    </ul>
                    <HiddenFieldsList />
                </div>
            </SortableContext>
        </DndContext>
    );
}
