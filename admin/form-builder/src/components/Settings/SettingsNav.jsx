import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import { STORE_NAME } from '../../store';

/**
 * Settings sidebar navigation — mirrors the Vue template in post-form-settings.php.
 *
 * Structure: top-level groups (headers) with always-visible sub-items.
 * No collapse/expand — all sub-items rendered flat, exactly like Vue.
 */
const BADGE_MENUS = [ 'post_expiration' ];

export default function SettingsNav( { activeTab, onTabChange } ) {
    const data = window.wpuf_form_builder || {};
    const isProActive = useSelect( ( select ) => select( STORE_NAME ).getIsProActive(), [] );

    const settingsTitles = useMemo( () => {
        const titles = data.settings_titles || {};
        return applyFilters( 'wpuf.formBuilder.settingsTabs', titles );
    }, [] ); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="w-1/4 min-h-screen border-r p-8">
            { Object.entries( settingsTitles ).map( ( [ topKey, topItem ] ) => {
                const subItems = topItem.sub_items || {};
                const hasSubItems = Object.keys( subItems ).length > 0;

                // Modules header is clickable when it has no sub-items (Vue behavior)
                const isClickableHeader = ! hasSubItems;
                const isHeaderActive = isClickableHeader && activeTab === topKey;

                return (
                    <div key={ topKey }>
                        { /* Top-level section header */ }
                        <div className="mb-4 flex justify-between items-center">
                            <h2
                                id={ isClickableHeader ? `${ topKey }-menu` : undefined }
                                onClick={ isClickableHeader ? () => onTabChange( topKey ) : undefined }
                                className={ `group/sidebar-item text-base m-0 flex items-center w-full py-2 px-3 -ml-3 rounded-lg wpuf-transition-all duration-200 ease-in-out ${ isClickableHeader ? 'hover:bg-primary hover:cursor-pointer hover:text-white' : '' } ${ isHeaderActive ? 'bg-primary active_settings_tab text-white' : 'text-gray-600' }` }
                            >
                                { topItem.icon && (
                                    <span
                                        className={ `${ isHeaderActive ? '[&_.custom-stroke]:stroke-white' : '[&_.custom-stroke]:stroke-gray-500' } ${ isClickableHeader ? 'group-hover/sidebar-item:[&_.custom-stroke]:stroke-white' : '' }` }
                                        dangerouslySetInnerHTML={ { __html: topItem.icon } }
                                    />
                                ) }
                                <span className="ml-2">{ topItem.label }</span>
                            </h2>
                        </div>

                        { /* Sub-items list */ }
                        { hasSubItems && (
                            <div className="mb-4">
                                <ul className="wpuf-sidebar-menu list-none [&>:not([hidden])~:not([hidden])]:mt-2 [&>:not([hidden])~:not([hidden])]:mb-0">
                                    { Object.entries( subItems ).map( ( [ subKey, subItem ] ) => {
                                        const isActive = activeTab === subKey;

                                        return (
                                            <li
                                                key={ subKey }
                                                onClick={ () => onTabChange( subKey ) }
                                                className={ `group/sidebar-item mx-2 py-2 px-3 hover:bg-primary hover:cursor-pointer rounded-lg wpuf-transition-all duration-200 ease-in-out items-center flex justify-between ${ isActive ? 'bg-primary active_settings_tab' : '' }` }
                                                data-settings={ subKey }
                                            >
                                                <a
                                                    className={ `ml-2 text-sm group-hover/sidebar-item:text-white wpuf-transition-all duration-200 ease-in-out focus:shadow-none focus:outline-hidden flex items-center ${ isActive ? 'text-white' : 'text-gray-600' }` }
                                                >
                                                    { subItem.icon && (
                                                        <span
                                                            className={ `[&>svg]:w-5 [&>svg]:h-5 ${ isActive ? '[&_.custom-stroke]:stroke-white' : '[&_.custom-stroke]:stroke-gray-500 group-hover/sidebar-item:[&_.custom-stroke]:stroke-white' }` }
                                                            dangerouslySetInnerHTML={ { __html: subItem.icon } }
                                                        />
                                                    ) }
                                                    <span className="ml-2">{ subItem.label }</span>
                                                </a>
                                                { ! isProActive && BADGE_MENUS.includes( subKey ) && (
                                                    <span>
                                                        <img
                                                            src={ `${ data.asset_url || '' }/images/pro-badge.svg` }
                                                            alt="pro icon"
                                                        />
                                                    </span>
                                                ) }
                                            </li>
                                        );
                                    } ) }
                                </ul>
                            </div>
                        ) }
                    </div>
                );
            } ) }
        </div>
    );
}
