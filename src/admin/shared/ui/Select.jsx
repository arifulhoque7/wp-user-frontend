/**
 * Single select. Shows the stored value when it is an option, else the
 * placeholder ("- Select -" by default); the stored value is never rewritten
 * by rendering. onChange gets the option value (string).
 */
import { Select as PuiSelect, SelectContent, SelectItem, SelectTrigger, SelectValue, cn } from '@wedevs/plugin-ui';
import { __ } from '@wordpress/i18n';

import { normalizeOptions, selectShownValue } from './values';

/**
 * @param {Object}       props
 * @param {*}            [props.value]       Stored value.
 * @param {Array|Object} props.options       [{ value, label, disabled }] or { value: label }.
 * @param {Function}     [props.onChange]    ( value: string ) => void
 * @param {string}       [props.placeholder] Shown when no option matches.
 * @param {boolean}      [props.disabled]    Disabled.
 * @param {string}       [props.id]          Trigger id (for <label for>).
 */
export default function Select( { value, options, onChange, placeholder, disabled, id, className, ...props } ) {
    const items = normalizeOptions( options );
    const shown = selectShownValue( value, items );
    const labelOf = ( val ) => items.find( ( item ) => item.value === val )?.label ?? '';

    return (
        <PuiSelect value={ shown } onValueChange={ ( next ) => onChange?.( next ) } disabled={ disabled } { ...props }>
            <SelectTrigger
                id={ id }
                className={ cn( 'w-full h-[38px] data-[size=default]:h-[38px] ps-3 pe-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-md shadow-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 data-[placeholder]:text-gray-400', className ) }
            >
                <SelectValue placeholder={ placeholder ?? __( '- Select -', 'wp-user-frontend' ) }>
                    { ( val ) => ( null === val || undefined === val ? placeholder ?? __( '- Select -', 'wp-user-frontend' ) : labelOf( val ) ) }
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                { items.map( ( item ) => (
                    <SelectItem key={ item.value } value={ item.value } disabled={ item.disabled }>
                        { item.label }
                    </SelectItem>
                ) ) }
            </SelectContent>
        </PuiSelect>
    );
}
