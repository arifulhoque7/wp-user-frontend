import { useCallback } from '@wordpress/element';
import { SETTING_CLASS_NAMES } from '../SettingsField';
import HelpTextIcon from './HelpTextIcon';

/**
 * Textarea field for form settings.
 * Matches Vue wpuf_render_settings_field() for type="textarea".
 */
export default function TextareaField( { field, name, value, onChange } ) {
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
            <textarea
                id={ name }
                value={ value !== undefined && value !== null ? value : ( field.default || field.value || '' ) }
                onChange={ handleChange }
                rows={ field.rows || 6 }
                className={ SETTING_CLASS_NAMES.textarea }
                placeholder={ field.placeholder || '' }
            />
            { field.long_help && (
                <div
                    className="text-sm mt-4 wpuf-long-help"
                    dangerouslySetInnerHTML={ { __html: field.long_help } }
                />
            ) }
        </>
    );
}
