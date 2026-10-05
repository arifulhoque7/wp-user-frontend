import { Toggle } from '@wpuf/components';
import SettingLabel from './SettingLabel';

const isOn = ( value ) => true === value || 'yes' === value || 'on' === value;

/**
 * Toggle setting on the shared Toggle (4.6a): label left, switch right in a
 * 2/5 row; stores 'on' / 'off'.
 */
export default function ToggleField( { field, name, value, onChange } ) {
    return (
        <div className="flex items-center justify-between w-2/5">
            <SettingLabel field={ field } htmlFor={ name } />
            <Toggle
                id={ name }
                className="ml-2"
                value={ isOn( value ) ? 'on' : 'off' }
                checkedValue="on"
                uncheckedValue="off"
                onChange={ ( next ) => onChange( name, next ) }
            />
        </div>
    );
}
