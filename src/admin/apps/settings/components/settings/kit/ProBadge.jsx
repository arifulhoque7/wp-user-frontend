import { ProBadge as SharedProBadge } from '@wpuf/components';

/**
 * Pro badge of the settings screen: the shared ProBadge (pro-badge.svg linking
 * to the upgrade page, hidden when Pro is active) with the settings utm.
 */
export default function ProBadge( { utm = 'wpuf-settings' } ) {
    return <SharedProBadge utm={ utm } upgradeUrl={ ( window.wpuf_settings || {} ).upgrade_url } />;
}
