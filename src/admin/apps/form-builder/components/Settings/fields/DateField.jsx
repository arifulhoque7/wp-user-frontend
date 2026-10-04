import { useEffect, useRef } from '@wordpress/element';
import { TextInput } from '@wpuf/components';
import SettingLabel from './SettingLabel';

/**
 * Date setting (develop type="date": a text input with jQuery
 * datetimepicker, default format `Y/m/d H:i`, typing allowed) on the shared
 * TextInput (4.4e). The picker is kept so a picked date stores develop's text.
 */
export function DateInput( { id, value, onChange, className } ) {
    const wrapRef = useRef( null );
    const onChangeRef = useRef( onChange );
    onChangeRef.current = onChange;

    useEffect( () => {
        const input = wrapRef.current && wrapRef.current.querySelector( 'input' );
        const $ = window.jQuery;

        if ( ! input || ! $ || ! $.fn.datetimepicker ) {
            return;
        }

        $( input ).datetimepicker( {
            onChangeDateTime( dp, $input ) {
                onChangeRef.current( $input.val() );
            },
        } );

        return () => $( input ).datetimepicker( 'destroy' );
    }, [] );

    return (
        <div ref={ wrapRef } className={ className }>
            <TextInput id={ id } className="datepicker w-full" value={ value ?? '' } onChange={ ( next ) => onChange( next ) } />
        </div>
    );
}

export default function DateField( { field, name, value, onChange } ) {
    return (
        <>
            <SettingLabel field={ field } htmlFor={ name } />
            <DateInput id={ name } value={ value } onChange={ ( next ) => onChange( name, next ) } />
        </>
    );
}
