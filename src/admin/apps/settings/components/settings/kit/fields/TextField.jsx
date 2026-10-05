import { TextInput } from '@wpuf/components';
import { CONTROL_SIZE } from '../controlSize';
import SettingLabel, { LongHelp } from './SettingLabel';

/**
 * Text setting (legacy text / email / url / password and text-like callbacks)
 * on the shared TextInput (4.6a). Shows the stored value, else the default;
 * stores the string as typed.
 */
export default function TextField( { field, name, value, onChange } ) {
    return (
        <>
            <SettingLabel field={ field } htmlFor={ name } />
            <TextInput
                id={ name }
                className={ CONTROL_SIZE }
                value={ value || field.default || '' }
                onChange={ ( next ) => onChange( name, next ) }
                placeholder={ field.placeholder || '' }
            />
            { field.notice && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4">
                    <p className="m-0">{ field.notice.text }</p>
                </div>
            ) }
            <LongHelp html={ field.long_help } />
        </>
    );
}
