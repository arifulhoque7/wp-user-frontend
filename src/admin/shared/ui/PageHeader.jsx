/**
 * Page header of the WPUF admin screens (develop look, src/js/components/Header.jsx):
 * logo, product title, plan + version badges, "Upgrade to PRO" (free only),
 * Headway changelog icon (`#wpuf-headway-icon`, the id the Headway widget
 * attaches to), "Submit Ideas" and "Support".
 * - variant "bleed" (forms lists, subscriptions): spans the wp-admin content
 *   gutter (20px each side), 16px above, 16px below, 2px bottom border;
 * - variant "card" (settings): white block, 20px padding, 2px bottom border.
 * Data comes from the boot payload (version, proVersion, plan, isPro, assetUrl).
 */
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { cn } from '@wedevs/plugin-ui';

import { useBoot } from '../hooks';
import { UPGRADE_URL } from './ProBadge';

export const SUPPORT_URL = 'https://wedevs.com/contact/?utm_source=wpuf-subscription';
export const IDEAS_URL = 'https://feedback.wedevs.com/b/user-frontend';

// Tailwind 3 values of develop's classes (ring-green-600/20, shadow-xs).
const BADGE = 'ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 ring-1 ring-inset ring-[rgba(22,163,74,0.2)]';
const SHADOW = 'shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]';
// develop's Ideas link kept the wp-admin link color (admin color scheme).
const OUTLINE = 'border border-solid border-gray-100 mr-4 text-center rounded-md px-3 py-2 text-sm font-semibold text-(--wp-admin-theme-color,#2271b1) no-underline hover:bg-slate-100 focus:bg-slate-100 focus:shadow-none';

/**
 * "pro-business" -> "Pro Business".
 *
 * @param {string} plan Plan slug.
 *
 * @return {string} Label.
 */
export function planLabel( plan ) {
    return String( plan || '' )
        .split( '-' )
        .filter( Boolean )
        .map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
        .join( ' ' );
}

/**
 * @param {Object} props
 * @param {string} [props.variant]    bleed|card
 * @param {string} [props.utm]        utm_source of the upgrade link.
 * @param {string} [props.supportUrl] Support link (screens differ).
 * @param {*}      [props.extra]      Extra links before the Headway icon (e.g. "Classic view").
 */
export default function PageHeader( { variant = 'bleed', utm = 'wpuf-header', supportUrl = SUPPORT_URL, extra, className } ) {
    const boot = useBoot();
    const isPro = true === boot.isPro;
    const version = isPro && boot.proVersion ? boot.proVersion : boot.version;
    const plan = isPro ? planLabel( boot.plan ) : '';

    return (
        <div
            className={ cn(
                'flex justify-between items-center border-0 border-b-2 border-solid border-gray-100',
                'card' === variant ? 'bg-white p-5' : 'w-[calc(100%+40px)] -ml-5 px-5 mt-4 pb-4',
                className
            ) }
        >
            <div className="flex justify-start items-center">
                { boot.assetUrl && <img src={ boot.assetUrl + '/images/wpuf-icon-circle.svg' } alt={ __( 'WPUF Icon', 'wp-user-frontend' ) } className="w-12 h-auto mr-4" /> }
                <h2 className="m-0 text-2xl leading-7 font-bold text-[#1d2327]">{ isPro ? 'WP User Frontend Pro' : 'WP User Frontend' }</h2>
                { plan && <span className={ cn( BADGE, 'font-semibold' ) }>{ plan }</span> }
                { version && <span className={ cn( BADGE, 'font-medium' ) }>{ 'v' + version }</span> }
                { ! isPro && (
                    <a
                        href={ addQueryArgs( UPGRADE_URL, { utm_source: utm, utm_medium: 'wpuf-header' } ) }
                        target="_blank"
                        rel="noreferrer"
                        className="flex ml-4 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white no-underline hover:bg-[#10b981] hover:text-white focus:text-white focus:shadow-none"
                    >
                        { __( 'Upgrade to PRO', 'wp-user-frontend' ) }
                    </a>
                ) }
            </div>
            <div className="flex justify-end items-center w-2/4">
                { extra }
                <span id="wpuf-headway-icon" className={ cn( 'border border-solid border-gray-100 mr-4 rounded-full p-1 hover:bg-slate-100', SHADOW ) }></span>
                <a className={ cn( OUTLINE, SHADOW, 'wpuf-feedback-link' ) } target="_blank" rel="noreferrer" href={ IDEAS_URL }>
                    { '💡 ' + __( 'Submit Ideas', 'wp-user-frontend' ) }
                </a>
                { supportUrl && (
                    <a
                        href={ supportUrl }
                        target="_blank"
                        rel="noreferrer"
                        className={ cn( 'rounded-md text-center bg-primary px-3 py-2 text-sm font-semibold text-white no-underline hover:bg-[#10b981] hover:text-white focus:bg-[#10b981] focus:text-white', SHADOW ) }
                    >
                        { __( 'Support', 'wp-user-frontend' ) + ' \u00a0\u00a0' }
                        <span className="dashicons dashicons-businessperson" aria-hidden="true"></span>
                    </a>
                ) }
            </div>
        </div>
    );
}
