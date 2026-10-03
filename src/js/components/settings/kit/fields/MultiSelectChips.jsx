import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import HelpTextIcon from './HelpTextIcon';

/**
 * Multi-select with a dropdown + searchable list + removable chips.
 * Ported from the User Directory free module (src/js/user-directory/components/
 * common/MultiSelect.js) so settings multi-selects match that design.
 *
 * Emits an ARRAY of the selected option keys; the server stores it in the
 * legacy shape (a list for `wpuf_settings_multiselect`, `{ key: key }` for
 * multicheck).
 */
export default function MultiSelectChips( { field, name, value, onChange } ) {
    const options = field.options || {};
    // Multicheck stores `{ key: key }`, and `''` once everything is unchecked;
    // only a value that was never saved falls back to the default.
    let selected = [];
    if ( Array.isArray( value ) ) {
        selected = value;
    } else if ( value && typeof value === 'object' ) {
        selected = Object.values( value );
    } else if ( value === undefined ) {
        selected = field.default || [];
    }

    const [ isOpen, setIsOpen ] = useState( false );
    const [ searchTerm, setSearchTerm ] = useState( '' );
    const dropdownRef = useRef( null );
    const searchInputRef = useRef( null );

    const displayText = ( key ) => {
        const opt = options[ key ];
        if ( typeof opt === 'string' ) {
            return opt;
        }
        if ( opt && typeof opt === 'object' ) {
            return opt.label || opt.name || key;
        }
        return key;
    };

    useEffect( () => {
        const handleClick = ( e ) => {
            if ( dropdownRef.current && ! dropdownRef.current.contains( e.target ) ) {
                setIsOpen( false );
                setSearchTerm( '' );
            }
        };
        document.addEventListener( 'mousedown', handleClick );
        return () => document.removeEventListener( 'mousedown', handleClick );
    }, [] );

    useEffect( () => {
        if ( isOpen && searchInputRef.current ) {
            setTimeout( () => searchInputRef.current && searchInputRef.current.focus(), 100 );
        }
    }, [ isOpen ] );

    const emit = ( next ) => onChange( name, next );

    const handleSelect = ( key ) => {
        if ( ! selected.includes( key ) ) {
            emit( [ ...selected, key ] );
        }
        setIsOpen( false );
        setSearchTerm( '' );
    };

    const handleRemove = ( key ) => emit( selected.filter( ( k ) => k !== key ) );

    const available = Object.keys( options )
        .filter( ( key ) => ! selected.includes( key ) )
        .filter( ( key ) =>
            ! searchTerm.trim() || displayText( key ).toLowerCase().includes( searchTerm.toLowerCase() )
        );

    // Trigger label: placeholder when empty, "N selected" past this many, else
    // the comma-joined names.
    const MAX_NAMES_IN_SUMMARY = 3;
    let summary;
    if ( selected.length === 0 ) {
        summary = field.placeholder || __( 'Select…', 'wp-user-frontend' );
    } else if ( selected.length > MAX_NAMES_IN_SUMMARY ) {
        summary = `${ selected.length } ${ __( 'selected', 'wp-user-frontend' ) }`;
    } else {
        summary = selected.map( displayText ).join( ', ' );
    }

    return (
        <>
            <div className="flex items-center">
                { field.label && (
                    <label className="text-sm text-gray-700 my-2">{ field.label }</label>
                ) }
                { field.help_text && <HelpTextIcon text={ field.help_text } /> }
            </div>

            <div className="relative mt-1" ref={ dropdownRef }>
                <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={ isOpen }
                    onClick={ () => setIsOpen( ( o ) => ! o ) }
                    className="flex h-[42px] w-full items-center justify-between rounded-[6px] border border-slate-300! bg-white px-[13px] py-[9px] text-left focus:ring-transparent"
                >
                    <span className={ `truncate text-base ${ selected.length === 0 ? 'text-gray-400' : 'text-gray-700' }` }>
                        { summary }
                    </span>
                    <svg className="ml-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                { isOpen && (
                    <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg" role="listbox">
                        <li className="sticky top-0 border-b border-gray-200 bg-white p-2">
                            <input
                                ref={ searchInputRef }
                                type="text"
                                value={ searchTerm }
                                onChange={ ( e ) => setSearchTerm( e.target.value ) }
                                onKeyDown={ ( e ) => {
                                    if ( e.key === 'Escape' ) {
                                        setIsOpen( false );
                                        setSearchTerm( '' );
                                    } else if ( e.key === 'Enter' && available.length > 0 ) {
                                        e.preventDefault();
                                        handleSelect( available[ 0 ] );
                                    }
                                } }
                                placeholder={ __( 'Search options…', 'wp-user-frontend' ) }
                                className="wpuf-ms-search w-full px-3 py-2 text-sm border border-gray-300 rounded-[4px] focus:outline-hidden focus:border-transparent"
                            />
                        </li>
                        { available.length === 0 && (
                            <li className="mb-0! p-3 text-sm text-gray-400">
                                { searchTerm.trim()
                                    ? __( 'No matching options', 'wp-user-frontend' )
                                    : __( 'No more options', 'wp-user-frontend' ) }
                            </li>
                        ) }
                        { available.map( ( key ) => (
                            <li
                                key={ key }
                                role="option"
                                aria-selected={ false }
                                tabIndex={ 0 }
                                onClick={ () => handleSelect( key ) }
                                onKeyDown={ ( e ) => {
                                    if ( e.key === 'Enter' || e.key === ' ' ) {
                                        handleSelect( key );
                                    }
                                } }
                                className="mb-0! cursor-pointer p-3 text-base hover:bg-gray-100"
                            >
                                { displayText( key ) }
                            </li>
                        ) ) }
                    </ul>
                ) }

                <div className="mt-3 flex flex-wrap gap-2">
                    { selected.map( ( key ) => (
                        <div
                            key={ key }
                            className="group/item flex items-center rounded-[5px] border border-gray-200 bg-gray-50 px-3 py-1 text-base shadow-xs transition-colors hover:border-emerald-600 hover:bg-emerald-50"
                        >
                            <span className="text-gray-800">{ displayText( key ) }</span>
                            <button
                                type="button"
                                aria-label={ __( 'Remove', 'wp-user-frontend' ) }
                                onClick={ () => handleRemove( key ) }
                                className="ml-1 flex h-4 w-4 items-center justify-center text-emerald-600 hover:bg-emerald-100"
                            >
                                ×
                            </button>
                        </div>
                    ) ) }
                </div>
            </div>
        </>
    );
}
