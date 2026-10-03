import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function FieldSearch( { onSearch } ) {
    const [ value, setValue ] = useState( '' );

    const handleChange = useCallback( ( e ) => {
        const val = e.target.value;
        setValue( val );
        onSearch( val );
    }, [ onSearch ] );

    const handleClear = useCallback( () => {
        setValue( '' );
        onSearch( '' );
    }, [ onSearch ] );

    return (
        <div className="flex rounded-lg bg-white outline-solid wpuf--outline-1 -outline-offset-1 outline-gray-300 border border-gray-200 shadow-sm mb-8">
            <input
                type="text"
                name="search"
                value={ value }
                onChange={ handleChange }
                className="border-none! rounded-md! block min-w-0 grow px-4! py-1.5! text-base! text-gray-900 placeholder:text-gray-400 ring-transparent! shadow-sm focus:shadow-none!"
                placeholder={ __( 'Search Field', 'wp-user-frontend' ) }
            />
            <div className="flex py-1.5 pr-1.5">
                <span className="inline-flex items-center rounded-sm px-1 font-sans text-xs text-gray-400">
                    { ! value ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    ) : (
                        <svg
                            onClick={ handleClear }
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="size-5 hover:cursor-pointer wpuf-transition-all"
                            role="button"
                            tabIndex={ 0 }
                            onKeyDown={ ( e ) => e.key === 'Enter' && handleClear() }
                        >
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                    ) }
                </span>
            </div>
        </div>
    );
}
