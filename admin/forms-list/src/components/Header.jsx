/**
 * Header component — top bar with logo, version, and action links.
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';

const Header = ( { utm = 'wpuf-header' } ) => {
    const wpuf = window.wpuf_admin_script;
    const logoUrl = wpuf.asset_url + '/images/wpuf-icon-circle.svg';
    const upgradeUrl = wpuf.upgradeUrl + '?utm_source=' + utm + '&utm_medium=wpuf-header';
    const supportUrl = wpuf.support_url;

    const headerTitle = wpuf.isProActive
        ? 'WP User Frontend Pro'
        : 'WP User Frontend';

    const headerVersion = wpuf.isProActive && wpuf.pro_version
        ? wpuf.pro_version
        : wpuf.version;

    const headerPlan = wpuf.isProActive && wpuf.plan
        ? wpuf.plan
            .split( '-' )
            .map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
            .join( ' ' )
        : '';

    return (
        <div className="w-[calc(100%+40px)] ml-[-20px] px-[20px] flex mt-4 justify-between items-center border-b-2 border-gray-100 pb-4">
            <div className="flex justify-start items-center">
                <img src={ logoUrl } alt="WPUF Icon" className="w-12 mr-4" />
                <h2 className="text-2xl leading-7 font-bold">{ headerTitle }</h2>
                { headerPlan && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                        { headerPlan }
                    </span>
                ) }
                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    v{ headerVersion }
                </span>
                { ! wpuf.isProActive && (
                    <a
                        href={ upgradeUrl }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wpuf-btn-primary flex ml-4 p-2"
                    >
                        { __( 'Upgrade to PRO', 'wp-user-frontend' ) }
                    </a>
                ) }
            </div>
            <div className="flex justify-end items-center w-2/4">
                <span
                    id="wpuf-headway-icon"
                    className="border border-gray-100 mr-[16px] rounded-full p-1 shadow-xs hover:bg-slate-100 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2"
                ></span>
                <a
                    className="border border-gray-100 mr-[16px] wpuf-feedback-link text-center rounded-md px-3 py-2 text-sm font-semibold shadow-xs hover:bg-slate-100 focus:bg-slate-100"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://feedback.wedevs.com/b/user-frontend"
                >
                    { '\uD83D\uDCA1 ' }{ __( 'Submit Ideas', 'wp-user-frontend' ) }
                </a>
                <a
                    href={ supportUrl }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md text-center bg-primary px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-primaryHover hover:text-white focus:bg-primaryHover focus:text-white"
                >
                    { __( 'Support ', 'wp-user-frontend' ) }
                    &nbsp;&nbsp;
                    <span className="dashicons dashicons-businessman"></span>
                </a>
            </div>
        </div>
    );
};

export default Header;
