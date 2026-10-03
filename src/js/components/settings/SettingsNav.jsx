/**
 * SettingsNav — left vertical tab navigation + search, driven by the IA map.
 */
import { __ } from '@wordpress/i18n';
import NavIcon from './nav-icons';

export default function SettingsNav( { ia, activeTab, onSelect, search, onSearch } ) {
    return (
        <div className="w-[280px] shrink-0">
            <div className="relative mb-4">
                <input
                    type="text"
                    value={ search }
                    placeholder={ __( 'Search settings…', 'wp-user-frontend' ) }
                    onChange={ ( e ) => onSearch( e.target.value ) }
                    className="block min-w-full m-0 leading-none text-gray-700 placeholder:text-gray-400 max-w-full focus:ring-transparent"
                    style={ {
                        width: '100%',
                        height: '42px',
                        borderRadius: '6px',
                        borderWidth: '1px',
                        paddingTop: '9px',
                        paddingRight: '38px',
                        paddingBottom: '9px',
                        paddingLeft: '13px',
                        backgroundColor: '#FFFFFF',
                        borderColor: '#CBD5E1',
                        borderStyle: 'solid',
                        opacity: 1,
                        boxSizing: 'border-box',
                        fontSize: '16px',
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
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </span>
                ) }
            </div>
            <nav className="[&>:not([hidden])~:not([hidden])]:mt-1">
                { ia.map( ( tab ) => (
                    <button
                        type="button"
                        key={ tab.id }
                        onClick={ () => onSelect( tab.id ) }
                        className={ `flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm font-medium ${
                            activeTab === tab.id
                                ? 'bg-primary text-white'
                                : 'text-gray-700 hover:bg-gray-100'
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
