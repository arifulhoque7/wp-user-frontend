import { TextInput } from '@wpuf/components';
import SettingHelpText from './SettingHelpText';

/**
 * Text meta input for field settings (Vue field-text-meta), on the shared
 * TextInput wrapper (4.4c).
 *
 * Meta keys are read-only for saved fields (is_read_only or not is_new).
 */
export default function TextMetaInput( { optionField, field, value, onChange } ) {
    const isReadOnly = !! optionField.is_read_only || ! field.is_new;

    return (
        <div className="panel-field-opt panel-field-opt-text panel-field-opt-text-meta">
            <div className="flex">
                <label
                    htmlFor={ optionField.name }
                    className="wpuf-option-field-title wpuf-font-sm text-gray-700 font-medium"
                >
                    { optionField.title }
                </label>
                <SettingHelpText text={ optionField.help_text } />
            </div>
            <div className="mt-2">
                <TextInput
                    id={ optionField.name }
                    value={ value ?? '' }
                    // Meta keys must be valid identifiers: lowercase, no spaces or
                    // special characters (mirrors the auto-generated key). Prevents
                    // invalid keys like "radio button" that break the field wrapper
                    // CSS class and the input id / label "for" association.
                    onChange={ ( next ) => onChange( next.replace( /\W/g, '_' ).toLowerCase() ) }
                    readOnly={ isReadOnly }
                    className="w-full"
                />
            </div>
        </div>
    );
}
