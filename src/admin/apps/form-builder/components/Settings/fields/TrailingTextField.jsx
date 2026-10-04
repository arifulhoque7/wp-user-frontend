import { useCallback } from '@wordpress/element';
import { SETTING_CLASS_NAMES } from '../SettingsField';
import HelpTextIcon from './HelpTextIcon';

/**
 * Input with trailing text — matches Vue wpuf_render_settings_field() for type="trailing-text".
 */
export default function TrailingTextField( { field, name, value, onChange } ) {
    const inputType = field.trailing_type || 'text';

    const handleChange = useCallback( ( e ) => {
        onChange( name, e.target.value );
    }, [ name, onChange ] );

    const inputClasses = SETTING_CLASS_NAMES[ inputType ] || SETTING_CLASS_NAMES.text;

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
            <div className="relative">
                <input
                    type={ inputType }
                    id={ name }
                    value={ value || field.default || '' }
                    onChange={ handleChange }
                    className={ inputClasses }
                />
                { field.trailing_text && (
                    <span className="absolute top-0 -right-px h-full bg-gray-50 rounded-r-md text-gray-700 border border-gray-300 text-base py-1.75 px-3.75">
                        { field.trailing_text }
                    </span>
                ) }
            </div>
        </>
    );
}
