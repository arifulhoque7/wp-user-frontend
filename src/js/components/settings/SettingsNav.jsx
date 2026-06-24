/**
 * SettingsNav — left vertical tab navigation + search, driven by the IA map.
 */
import { __ } from '@wordpress/i18n';
import NavIcon from './nav-icons';

export default function SettingsNav( { ia, activeTab, onSelect, search, onSearch } ) {
    return (
        <div className="wpuf-w-[280px] wpuf-shrink-0">
            <input
                type="text"
                value={ search }
                placeholder={ __( 'Search', 'wp-user-frontend' ) }
                onChange={ ( e ) => onSearch( e.target.value ) }
                className="wpuf-mb-4 wpuf-block wpuf-min-w-full wpuf-m-0 wpuf-leading-none wpuf-text-gray-700 placeholder:wpuf-text-gray-400 wpuf-max-w-full focus:wpuf-ring-transparent"
                style={ {
                    width: '100%',
                    height: '42px',
                    borderRadius: '6px',
                    borderWidth: '1px',
                    paddingTop: '9px',
                    paddingRight: '13px',
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
            <nav className="wpuf-space-y-1">
                { ia.map( ( tab ) => (
                    <button
                        type="button"
                        key={ tab.id }
                        onClick={ () => onSelect( tab.id ) }
                        className={ `wpuf-flex wpuf-w-full wpuf-items-center wpuf-rounded-md wpuf-px-3 wpuf-py-2.5 wpuf-text-left wpuf-text-sm wpuf-font-medium ${
                            activeTab === tab.id
                                ? 'wpuf-bg-primary wpuf-text-white'
                                : 'wpuf-text-gray-700 hover:wpuf-bg-gray-100'
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
