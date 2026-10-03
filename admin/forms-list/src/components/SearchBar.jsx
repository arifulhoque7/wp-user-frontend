/**
 * SearchBar component — controlled text input with search icon.
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';

const SearchBar = ( { value, onChange } ) => {
    return (
        <div className="wpuf-form-search-box">
            <div className="relative">
                <input
                    type="text"
                    value={ value }
                    onChange={ ( e ) => onChange( e.target.value ) }
                    placeholder={ __( 'Search Forms', 'wp-user-frontend' ) }
                    className="block min-w-full m-0! leading-none! py-[10px]! px-[14px]! text-gray-700 shadow-xs! placeholder:text-gray-400 border border-gray-300! rounded-[6px]! max-w-full focus:ring-transparent!"
                />
                <span className="absolute top-0 right-0 p-[10px]">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                    </svg>
                </span>
            </div>
        </div>
    );
};

export default SearchBar;
