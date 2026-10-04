import { useCallback } from '@wordpress/element';
import HelpTextIcon from './HelpTextIcon';

/**
 * Checkbox field — matches Vue wpuf_render_settings_field() for type="checkbox".
 * Vue renders: checkbox input BEFORE label, both in a flex row.
 */
export default function CheckboxField( { field, name, value, onChange } ) {
    const isChecked = value === 'yes' || value === true || value === 'on';

    const handleChange = useCallback( ( e ) => {
        onChange( name, e.target.checked ? 'on' : 'off' );
    }, [ name, onChange ] );

    return (
        <div className="flex items-center">
            <input
                type="checkbox"
                id={ name }
                checked={ isChecked }
                onChange={ handleChange }
                className="mr-2! h-4 w-4 rounded-sm border-gray-300! checked:border-primary! checked:bg-primary! focus:ring-transparent!"
            />
            { field.label && (
                <label htmlFor={ name } className="text-sm text-gray-700 my-2">
                    { field.label }
                </label>
            ) }
            { field.help_text && <HelpTextIcon text={ field.help_text } /> }
        </div>
    );
}
