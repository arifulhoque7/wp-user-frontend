import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import HelpTextIcon from './HelpTextIcon';
import { STORE_NAME } from '../../../../stores-react/settings/constants';

/**
 * Color picker field — matches Vue wpuf_render_settings_field() for type="color-picker".
 */
export default function ColorPickerField( { field, name, sectionId, value, onChange } ) {
    // A field may preview a default that depends on another setting (pro login
    // colors follow the chosen layout). Display only: nothing is stored.
    const previewKey = useSelect(
        ( select ) => ( field.preview_by ? select( STORE_NAME ).getValue( sectionId, field.preview_by ) : null ),
        [ field.preview_by, sectionId ]
    );
    const preview = field.preview && typeof field.preview === 'object'
        ? field.preview[ previewKey || Object.keys( field.preview )[ 0 ] ] || ''
        : '';

    const handleChange = useCallback( ( e ) => {
        onChange( name, e.target.value );
    }, [ name, onChange ] );

    const fallback = preview || field.default;
    const currentValue = value || fallback || '#000000';

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
                <div className="flex justify-center items-center [&>:not([hidden])~:not([hidden])]:ml-1 px-2 py-1.5 rounded-md bg-white border cursor-pointer relative">
                    <div className="w-6 h-6 overflow-hidden border border-gray-200 rounded-full flex justify-center items-center">
                        <input
                            type="color"
                            id={ name }
                            value={ currentValue }
                            onChange={ handleChange }
                            className="w-8 h-12 border-gray-50! -m-4! hover:cursor-pointer!"
                            style={ { background: fallback || '' } }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
