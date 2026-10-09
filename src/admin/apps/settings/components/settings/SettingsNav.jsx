/**
 * SettingsNav — left vertical tab navigation + search, driven by the IA map.
 */
import { __ } from '@wordpress/i18n';
import NavIcon from './nav-icons';

export default function SettingsNav( { ia, activeTab, onSelect, search, onSearch } ) {
    return (
        <div className="sticky top-10 w-60 shrink-0 rounded-[10px] border border-gray-200 bg-white p-2 shadow-sm">
            <div className="relative mb-2">
                <input
                    type="text"
                    value={ search }
                    placeholder={ __( 'Search settings…', 'wp-user-frontend' ) }
                    onChange={ ( e ) => onSearch( e.target.value ) }
                    className="block min-w-full m-0 leading-none text-gray-700 placeholder:text-gray-400 max-w-full focus:ring-transparent h-9! min-h-9!"
                    style={ {
                        width: '100%',
                        height: '36px',
                        borderRadius: '6px',
                        borderWidth: '1px',
                        paddingTop: '6px',
                        paddingRight: '38px',
                        paddingBottom: '6px',
                        paddingLeft: '10px',
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E5E7EB',
                        borderStyle: 'solid',
                        opacity: 1,
                        boxSizing: 'border-box',
                        fontSize: '13px',
                    } }
                />
                { search ? (
                    <button
                        type="button"
                        onClick={ () => onSearch( '' ) }
                        aria-label={ __( 'Clear search', 'wp-user-frontend' ) }
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                ) : (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </span>
                ) }
            </div>
            <nav className="[&>:not([hidden])~:not([hidden])]:mt-0.5 [&>:not([hidden])~:not([hidden])]:mb-0">
                { ia.map( ( tab ) => (
                    <button
                        type="button"
                        key={ tab.id }
                        aria-current={ activeTab === tab.id ? 'page' : undefined }
                        onClick={ () => onSelect( tab.id ) }
                        className={ `focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium ${
                            activeTab === tab.id
                                ? 'bg-primary! text-white!'
                                : 'text-gray-700 hover:bg-gray-100! hover:text-gray-900!'
                        }` }
                    >
                        <NavIcon tabId={ tab.id } />
                        { tab.title }
                    </button>
                ) ) }
            </nav>
        </div>
    );
}
