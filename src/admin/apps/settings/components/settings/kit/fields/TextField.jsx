import { TextInput } from '@wpuf/components';
import { CONTROL_SIZE } from '../controlSize';
import SettingLabel, { LongHelp } from './SettingLabel';
import { Notice } from '@wpuf/components';

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
                <Notice tone="warning" className="mt-3">{ field.notice.text }</Notice>
            ) }
            <LongHelp html={ field.long_help } />
        </>
    );
}
