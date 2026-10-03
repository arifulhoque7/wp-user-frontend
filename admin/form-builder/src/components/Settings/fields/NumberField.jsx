import { useCallback } from '@wordpress/element';
import { SETTING_CLASS_NAMES } from '../SettingsField';
import HelpTextIcon from './HelpTextIcon';

/**
 * Number input field for form settings.
 * Matches Vue wpuf_render_settings_field() for type="number".
 */
export default function NumberField( { field, name, value, onChange } ) {
    const handleChange = useCallback( ( e ) => {
        onChange( name, e.target.value );
    }, [ name, onChange ] );

    return (
        <>
            <div className="flex items-center">
                { field.label && (
                    <label htmlFor={ name } className="text-sm text-gray-700 my-2">
                        { field.label }
                    </label>
                ) }
                { field.help_text && <HelpTextIcon text={ field.help_text } /> }
            </div>
            <input
                type="number"
                id={ name }
                value={ value !== undefined && value !== null ? value : ( field.default || '' ) }
                onChange={ handleChange }
                className={ SETTING_CLASS_NAMES.number }
                min={ field.min }
                max={ field.max }
                step={ field.step || 1 }
            />
        </>
    );
}
