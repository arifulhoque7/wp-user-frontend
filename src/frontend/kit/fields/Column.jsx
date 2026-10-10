/**
 * The column field: inner fields laid out in N columns (the classic
 * `wpuf-column-field-inner-columns` markup), each column rendered through
 * the same field dispatch as the top level.
 *
 * @since WPUF_SINCE
 */
import { cx } from '../components/primitives';

/**
 * @param {Object}   props
 * @param {Object}   props.field       The column field.
 * @param {Function} props.renderField Renders one inner field (given by FormRenderer).
 */
export default function ColumnField( { field, renderField } ) {
    const columns = Object.entries( field.inner_fields || {} );
    const count = Number( field.columns ) || columns.length || 1;
    const padding = field.column_padding ? `${ field.column_padding }px` : undefined;

    return (
        <li className={ cx( 'wpuf-el', 'wpuf-column-field', field.name, field.css ) } data-label={ field.label }>
            <div className={ `wpuf-column-field-inner-columns wpuf-columns-${ count }` } style={ { gap: field.column_space ? `${ field.column_space }px` : undefined } }>
                { columns.map( ( [ key, fields ] ) => (
                    <div key={ key } className={ `wpuf-column ${ key }` } style={ { padding } }>
                        <ul className="wpuf-form wpuf-column-inner">
                            { ( fields || [] ).map( ( inner ) => renderField( inner ) ) }
                        </ul>
                    </div>
                ) ) }
            </div>
        </li>
    );
}
