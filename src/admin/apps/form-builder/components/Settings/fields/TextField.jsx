import { TextInput } from '@wpuf/components';
import SettingLabel from './SettingLabel';

/**
 * Text setting (develop type="text") on the shared TextInput (4.4e). Shows the
 * value SettingsSection resolved (stored, else the field's default).
 */
export default function TextField( { field, name, value, onChange } ) {
    return (
        <>
            <SettingLabel field={ field } htmlFor={ name } />
            <TextInput
                id={ name }
                className="w-full"
                value={ value ?? '' }
                onChange={ ( next ) => onChange( name, next ) }
                placeholder={ field.placeholder || '' }
            />
            { field.notice && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4">
                    <p className="m-0">{ field.notice.text }</p>
                </div>
            ) }
        </>
    );
}
