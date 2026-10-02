import { useCallback } from '@wordpress/element';
import { SETTING_CLASS_NAMES } from '../SettingsField';
import HelpTextIcon from './HelpTextIcon';

/**
 * Checkbox field — matches Vue wpuf_render_settings_field() for type="checkbox".
 * Vue renders: checkbox input BEFORE label, both in a flex row.
 */
export default function CheckboxField( { field, name, value, onChange } ) {
    const isChecked = value === true || [ 'on', 'yes', 'true', '1' ].includes( value );

    // Develop's settings checkbox has no hidden input: unchecked leaves the key out.
    const handleChange = useCallback( ( e ) => {
        onChange( name, e.target.checked ? 'on' : undefined );
    }, [ name, onChange ] );

    return (
        <div className="wpuf-flex wpuf-items-center">
            <input
                type="checkbox"
                id={ name }
                checked={ isChecked }
                onChange={ handleChange }
                className={ SETTING_CLASS_NAMES.checkbox + ' !wpuf-mr-2' }
            />
            { field.label && (
                <label htmlFor={ name } className="wpuf-text-sm wpuf-text-gray-700 wpuf-my-2">
                    { field.label }
                </label>
            ) }
            { field.help_text && <HelpTextIcon text={ field.help_text } /> }
        </div>
    );
}
