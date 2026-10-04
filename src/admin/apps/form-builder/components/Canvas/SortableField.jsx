import { useSortable } from '@dnd-kit/sortable';
import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store';
import { CSS } from '@dnd-kit/utilities';
import { applyFilters } from '@wordpress/hooks';
import { filterBuilderCssClasses } from '../../utils/canvasHelpers';
import FieldPreview from './FieldPreview';
import FieldActions from './FieldActions';
import ColumnField from './ColumnField';
import RepeatField from './RepeatField';

const TOP_LEVEL = { type: 'top' };

/**
 * One field on the canvas.
 *
 * `container` says which list the field lives in, so its actions edit that list:
 * `{ type: 'top' }` (default), `{ type: 'column', columnFieldId, column }` or
 * `{ type: 'repeat', repeatFieldId }`.
 */
export default function SortableField( { field, index, container = TOP_LEVEL } ) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable( { id: String( field.id ) } );

    const style = {
        transform: CSS.Transform.toString( transform ),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isColumnOrRepeat = field.input_type === 'column_field' || field.input_type === 'repeat';
    const isHidden = field.template === 'custom_hidden_field';
    // Classes that hide a field on the frontend are dropped on the stage; Pro
    // and add-ons can adjust the rest.
    const filteredCss = applyFilters( 'wpuf.formBuilder.fieldCssClasses', filterBuilderCssClasses( field.css ), field );

    const isEditing = useSelect(
        ( select ) => parseInt( select( STORE_NAME ).getEditingFieldId() ) === parseInt( field.id ),
        [ field.id ]
    );
    // Inner fields use develop's column / repeat item classes and a named hover
    // group, so hovering the parent does not reveal every inner action bar.
    const variant = 'top' === container.type ? 'top' : container.type;

    const classNames = ( 'column' === variant ? [
        'm-0! p-0! group/column-inner hover:bg-green-50 transition duration-150 wpuf-ease-out column-field-items wpuf-el rounded-t-md',
        field.name,
        field.css,
        'form-field-' + field.template,
        field.width ? 'field-size-' + field.width : '',
        isHidden ? 'hidden-field' : '',
        isEditing ? 'bg-green-50' : '',
    ] : 'repeat' === variant ? [
        'm-0! p-0! group/repeat-inner hover:bg-green-50 transition duration-150 wpuf-ease-out repeat-field-items wpuf-el rounded-t-md',
        field.name,
        'form-field-' + field.template,
        field.width ? 'field-size-' + field.width : '',
    ] : [
        'field-items',
        'wpuf-el',
        field.name,
        filteredCss,
        'form-field-' + field.template,
        field.width ? 'field-size-' + field.width : '',
        isHidden ? 'hidden-field' : '',
        'group rounded-lg hover:bg-green-50! transition duration-150 wpuf-ease-out m-0! p-0! overflow-hidden',
    ] ).filter( Boolean ).join( ' ' );

    return (
        <li
            ref={ setNodeRef }
            style={ style }
            className={ classNames }
            data-index={ index }
            data-source={ 'top' === variant ? 'stage' : variant + '-field-stage' }
        >
            { ! isColumnOrRepeat && (
                <FieldPreview field={ field } variant={ variant } />
            ) }

            { field.input_type === 'column_field' && (
                <ColumnField field={ field } />
            ) }

            { field.input_type === 'repeat' && (
                <RepeatField field={ field } />
            ) }

            <FieldActions field={ field } index={ index } container={ container } dragListeners={ listeners } dragAttributes={ attributes } variant={ variant } />
        </li>
    );
}
