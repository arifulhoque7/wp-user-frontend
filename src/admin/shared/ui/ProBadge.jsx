/**
 * "Pro" badge linking to the upgrade page (settings kit behaviour): hidden
 * when Pro is active, local image (assets/images/pro-badge.svg, 39x22),
 * opens in a new tab with UTM source per screen.
 */
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

import { useBoot } from '../hooks';

export const UPGRADE_URL = 'https://wedevs.com/wp-user-frontend-pro/pricing/';

/**
 * @param {Object} props
 * @param {string} [props.utm]        utm_source (screen key).
 * @param {string} [props.upgradeUrl] Override the upgrade URL.
 */
export default function ProBadge( { utm = 'wpuf-admin', upgradeUrl } ) {
    const boot = useBoot();

    if ( boot.isPro ) {
        return null;
    }

    const href = addQueryArgs( upgradeUrl || UPGRADE_URL, { utm_source: utm, utm_medium: 'pro-badge' } );

    return (
        <a href={ href } target="_blank" rel="noopener noreferrer" className="inline-block align-middle leading-none">
            <img src={ ( boot.assetUrl || '' ) + '/images/pro-badge.svg' } alt={ __( 'Pro', 'wp-user-frontend' ) } width="39" height="22" className="inline-block align-middle w-[39px] h-[22px] max-w-none" />
        </a>
    );
}
