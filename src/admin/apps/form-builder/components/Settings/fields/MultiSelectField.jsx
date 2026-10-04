import { MultiSelect } from '@wpuf/components';
import SettingLabel from './SettingLabel';

/**
 * Multi-select setting (develop type="multi-select", selectize) on the shared
 * MultiSelect (4.4e). Options in `always_selected` stay in the stored list.
 */
export default function MultiSelectField( { field, name, value, onChange } ) {
    const alwaysSelected = field.always_selected || [];
    const current = Array.isArray( value ) ? value : ( value ? [ value ] : [] );

    return (
        <>
            <SettingLabel field={ field } htmlFor={ name } />
            <MultiSelect
                id={ name }
                className="w-full"
                options={ field.options || {} }
                value={ current }
                onChange={ ( next ) => onChange( name, [ ...new Set( [ ...alwaysSelected, ...next ] ) ] ) }
            />
        </>
    );
}
