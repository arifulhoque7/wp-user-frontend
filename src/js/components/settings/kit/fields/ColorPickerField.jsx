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
        <div className="wpuf-flex wpuf-items-center wpuf-justify-between wpuf-w-2/5">
            <div className="wpuf-flex wpuf-items-center">
                { field.label && (
                    <label htmlFor={ name } className="wpuf-text-sm wpuf-text-gray-700 wpuf-my-2">
                        { field.label }
                    </label>
                ) }
                { field.help_text && <HelpTextIcon text={ field.help_text } /> }
            </div>
            <div className="wpuf-relative wpuf-ml-2 wpuf-flex wpuf-gap-2.5">
                <div className="wpuf-flex wpuf-justify-center wpuf-items-center wpuf-space-x-1 wpuf-px-2 wpuf-py-1.5 wpuf-rounded-md wpuf-bg-white wpuf-border wpuf-cursor-pointer wpuf-relative">
                    <div className="wpuf-w-6 wpuf-h-6 wpuf-overflow-hidden wpuf-border wpuf-border-gray-200 wpuf-rounded-full wpuf-flex wpuf-justify-center wpuf-items-center">
                        <input
                            type="color"
                            id={ name }
                            value={ currentValue }
                            onChange={ handleChange }
                            className="wpuf-w-8 wpuf-h-12 !wpuf-border-gray-50 !wpuf--m-4 hover:!wpuf-cursor-pointer"
                            style={ { background: fallback || '' } }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
