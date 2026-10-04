/**
 * Header — matches the WPUF subscriptions React page top bar.
 * Ported from recover/pr-1824 (now src/admin/apps/subscriptions/components/Header.jsx); reads the settings
 * page's localized `wpuf_settings` bootstrap instead of `wpuf_admin_script`.
 */
import { __ } from '@wordpress/i18n';

const Header = ( { utm = 'wpuf-settings' } ) => {
    const wpuf = window.wpuf_settings || {};
    const assetUrl = wpuf.asset_url || '';
    const logoUrl = assetUrl ? `${ assetUrl }/images/wpuf-icon-circle.svg` : '';
    const upgradeUrl = wpuf.upgrade_url
        ? `${ wpuf.upgrade_url }?utm_source=${ utm }&utm_medium=wpuf-header`
        : '';
    const supportUrl = wpuf.support_url || '';
    const headerVersion = wpuf.is_pro && wpuf.pro_version ? wpuf.pro_version : wpuf.version;
    const headerPlan = wpuf.is_pro && wpuf.plan
        ? wpuf.plan
            .split( '-' )
            .map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
            .join( ' ' )
        : '';

    return (
        <div className="bg-white p-[20px] flex justify-between items-center border-b-2 border-gray-100">
            <div className="flex justify-start items-center">
                { logoUrl && (
                    <img src={ logoUrl } alt="WPUF Icon" className="w-12 mr-4" />
                ) }
                <h2 className="text-2xl leading-7 font-bold m-0">
                    { wpuf.is_pro ? 'WP User Frontend Pro' : 'WP User Frontend' }
                </h2>
                { headerPlan && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                        { headerPlan }
                    </span>
                ) }
                { headerVersion && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        v{ headerVersion }
                    </span>
                ) }
                { ! wpuf.is_pro && upgradeUrl && (
                    <a
                        href={ upgradeUrl }
                        target="_blank"
                        rel="noreferrer"
                        className="flex ml-4 p-2 rounded-md bg-primary text-white! px-4 py-3 text-sm font-semibold hover:bg-primaryHover hover:text-white! focus:text-white! focus:shadow-none"
                    >
                        { __( 'Upgrade to PRO', 'wp-user-frontend' ) }
                    </a>
                ) }
            </div>
            <div className="flex justify-end items-center w-2/4">
                { wpuf.switch_ui_url && (
                    <a
                        href={ wpuf.switch_ui_url }
                        title={ __( 'Switch back to the classic settings screen', 'wp-user-frontend' ) }
                        className="border border-gray-100 mr-[16px] text-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 shadow-xs hover:bg-slate-100"
                    >
                        { __( 'Classic view', 'wp-user-frontend' ) }
                    </a>
                ) }
                <span
                    id="wpuf-headway-icon"
                    className="border border-gray-100 mr-[16px] rounded-full p-1 shadow-xs hover:bg-slate-100 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2"
                ></span>
                <a
                    className="border border-gray-100 mr-[16px] wpuf-feedback-link text-center rounded-md px-3 py-2 text-sm font-semibold shadow-xs hover:bg-slate-100 focus:bg-slate-100"
                    target="_blank"
                    href="https://feedback.wedevs.com/b/user-frontend"
                    rel="noreferrer"
                >
                    💡 { __( 'Submit Ideas', 'wp-user-frontend' ) }
                </a>
                { supportUrl && (
                    <a
                        href={ supportUrl }
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md text-center bg-primary px-3 py-2 text-sm font-semibold text-white! shadow-xs hover:bg-primaryHover hover:text-white! focus:bg-primaryHover focus:text-white!"
                    >
                        { __( 'Support ', 'wp-user-frontend' ) }
                        &nbsp;&nbsp;
                        <span className="dashicons dashicons-businessperson"></span>
                    </a>
                ) }
            </div>
        </div>
    );
};

export default Header;
