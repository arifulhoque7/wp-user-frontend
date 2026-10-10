/**
 * The row of one form field: the classic DOM contract
 * (`li.wpuf-el.<name>.field-size-<size>[data-label] > .wpuf-label + .wpuf-fields`,
 * `.wpuf-help`, `.required`), so CSS and scripts written for the PHP markup
 * keep matching. Errors render inline with role="alert".
 *
 * @since WPUF_SINCE
 */
import { cx } from './primitives';

/**
 * @param {Object}  props
 * @param {Object}  props.field    The field settings from the schema.
 * @param {string}  [props.id]     Control id the label points to.
 * @param {string}  [props.error]  Validation message.
 * @param {boolean} [props.noLabel] Fields that render their own label (checkbox groups keep the label).
 * @param {string}  [props.className]
 */
export default function Field( { field, id, error, children, noLabel = false, className = '', ...rest } ) {
    const required = field.required && 'no' !== field.required && 'false' !== field.required;
    const size = field.width ? `field-size-${ field.width }` : 'field-size-large';

    return (
        <li
            className={ cx( 'wpuf-el', field.name, size, field.css, error && 'has-error', className ) }
            data-label={ field.label }
            data-field-type={ field.template }
            { ...rest }
        >
            { ! noLabel && (
                <div className="wpuf-label">
                    <label htmlFor={ id }>
                        { field.label }
                        { required && <span className="required"> *</span> }
                    </label>
                </div>
            ) }
            <div className="wpuf-fields">
                { children }
                { field.help && <span className="wpuf-help">{ field.help }</span> }
                { error && (
                    <span className="wpuf-error-msg" role="alert" aria-live="assertive">
                        { error }
                    </span>
                ) }
            </div>
        </li>
    );
}
