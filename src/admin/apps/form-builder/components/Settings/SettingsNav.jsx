import { __ } from '@wordpress/i18n';
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
        <div className="sticky top-10 w-60 shrink-0 rounded-[10px] border border-gray-200 bg-white p-2 shadow-sm">
            { Object.entries( settingsTitles ).map( ( [ topKey, topItem ] ) => {
                const subItems = topItem.sub_items || {};
                const hasSubItems = Object.keys( subItems ).length > 0;

                // Modules header is clickable when it has no sub-items (Vue behavior)
                const isClickableHeader = ! hasSubItems;
                const isHeaderActive = isClickableHeader && activeTab === topKey;

                return (
                    <div key={ topKey }>
                        { /* Top-level section header */ }
                        <div className="mb-1 flex justify-between items-center">
                            <h2
                                id={ isClickableHeader ? `${ topKey }-menu` : undefined }
                                onClick={ isClickableHeader ? () => onTabChange( topKey ) : undefined }
                                className={ `group/sidebar-item m-0 flex items-center w-full rounded-md wpuf-transition-all duration-200 ease-in-out ${ isClickableHeader ? 'py-2 px-2.5 text-sm! font-medium hover:bg-gray-100 hover:cursor-pointer' : 'px-2.5 pt-3 pb-1 text-xs! font-semibold uppercase tracking-wide' } ${ isHeaderActive ? 'bg-primary/10 active_settings_tab text-primary' : 'text-gray-500' }` }
                            >
                                { topItem.icon && (
                                    <span
                                        className={ `inline-flex [&>svg]:w-4 [&>svg]:h-4 ${ isHeaderActive ? 'icon-primary' : '[&_.custom-stroke]:stroke-gray-400' }` }
                                        dangerouslySetInnerHTML={ { __html: topItem.icon } }
                                    />
                                ) }
                                <span className="ml-2">{ topItem.label }</span>
                            </h2>
                        </div>

                        { /* Sub-items list */ }
                        { hasSubItems && (
                            <div className="mb-2">
                                <ul className="wpuf-sidebar-menu list-none m-0 [&>:not([hidden])~:not([hidden])]:mt-0.5 [&>:not([hidden])~:not([hidden])]:mb-0">
                                    { Object.entries( subItems ).map( ( [ subKey, subItem ] ) => {
                                        const isActive = activeTab === subKey;

                                        return (
                                            <li
                                                key={ subKey }
                                                onClick={ () => onTabChange( subKey ) }
                                                className={ `group/sidebar-item m-0 py-2 px-2.5 hover:cursor-pointer rounded-md wpuf-transition-all duration-200 ease-in-out items-center flex justify-between ${ isActive ? 'bg-primary/10 active_settings_tab' : 'hover:bg-gray-100' }` }
                                                data-settings={ subKey }
                                            >
                                                <a
                                                    className={ `text-sm wpuf-transition-all duration-200 ease-in-out focus:shadow-none focus:outline-hidden flex items-center ${ isActive ? 'text-primary! font-medium' : 'text-gray-600 group-hover/sidebar-item:text-gray-900' }` }
                                                >
                                                    { subItem.icon && (
                                                        <span
                                                            className={ `inline-flex [&>svg]:w-4 [&>svg]:h-4 ${ isActive ? 'icon-primary' : '[&_.custom-stroke]:stroke-gray-400 group-hover/sidebar-item:[&_.custom-stroke]:stroke-gray-600' }` }
                                                            dangerouslySetInnerHTML={ { __html: subItem.icon } }
                                                        />
                                                    ) }
                                                    <span className="ml-2">{ subItem.label }</span>
                                                </a>
                                                { ! isProActive && BADGE_MENUS.includes( subKey ) && (
                                                    <span>
                                                        <img
                                                            src={ `${ data.asset_url || '' }/images/pro-badge.svg` }
                                                            alt={ __( 'pro icon', 'wp-user-frontend' ) }
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
