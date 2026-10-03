import { useCallback } from '@wordpress/element';
import HelpTextIcon from './HelpTextIcon';

/**
 * Color picker field — matches Vue wpuf_render_settings_field() for type="color-picker".
 */
export default function ColorPickerField( { field, name, value, onChange } ) {
    const handleChange = useCallback( ( e ) => {
        onChange( name, e.target.value );
    }, [ name, onChange ] );

    const currentValue = value || field.default || '#000000';

    return (
        <div className="flex items-center justify-between w-2/5">
            <div className="flex items-center">
                { field.label && (
                    <label htmlFor={ name } className="text-sm text-gray-700 my-2">
                        { field.label }
                    </label>
                ) }
                { field.help_text && <HelpTextIcon text={ field.help_text } /> }
            </div>
            <div className="relative ml-2 flex gap-2.5">
                <div className="flex justify-center items-center [&>:not([hidden])~:not([hidden])]:ml-1 [&>:not([hidden])~:not([hidden])]:mr-0 px-2 py-1.5 rounded-md bg-white border cursor-pointer relative">
                    <div className="w-6 h-6 overflow-hidden border border-gray-200 rounded-full flex justify-center items-center">
                        <input
                            type="color"
                            id={ name }
                            value={ currentValue }
                            onChange={ handleChange }
                            className="w-8 h-12 border-gray-50! -m-4! hover:cursor-pointer!"
                            style={ { background: field.default || '' } }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
