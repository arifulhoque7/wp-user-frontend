/**
 * Multiple select with search; value and onChange use a list of strings
 * (falsy stored value -> []).
 */
import { SmartMultiSelect, cn } from '@wedevs/plugin-ui';
import { __ } from '@wordpress/i18n';

import { normalizeOptions, toList } from './values';

/**
 * @param {Object}       props
 * @param {*}            [props.value]       Stored list.
 * @param {Array|Object} props.options       Options.
 * @param {Function}     [props.onChange]    ( values: string[] ) => void
 * @param {string}       [props.placeholder] Shown when nothing is selected.
 */
export default function MultiSelect( { value, options, onChange, placeholder, className, ...props } ) {
    return (
        <SmartMultiSelect
            options={ normalizeOptions( options ) }
            value={ toList( value ) }
            onValueChange={ ( next ) => onChange?.( toList( next ) ) }
            placeholder={ placeholder ?? __( '- Select -', 'wp-user-frontend' ) }
            searchPlaceholder={ __( 'Search', 'wp-user-frontend' ) }
            className={ cn( 'min-h-[38px] text-sm bg-white border border-gray-300 rounded-md shadow-none', className ) }
            { ...props }
        />
    );
}
