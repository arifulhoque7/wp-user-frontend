/**
 * SearchBar component — search input with a leading icon (FlyHR list-card toolbar).
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';
import { TextInput } from '@wpuf/components';

const SearchBar = ( { value, onChange } ) => {
    return (
        <div className="wpuf-form-search-box relative">
            <svg className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <TextInput
                value={ value }
                onChange={ onChange }
                placeholder={ __( 'Search Forms', 'wp-user-frontend' ) }
                aria-label={ __( 'Search Forms', 'wp-user-frontend' ) }
                className="h-9 w-60 ps-9"
            />
        </div>
    );
};

export default SearchBar;
