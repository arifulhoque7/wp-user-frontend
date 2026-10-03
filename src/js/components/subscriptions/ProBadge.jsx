/**
 * DESCRIPTION: ProBadge component for Pro feature indicators
 * DESCRIPTION: Displays a "Pro" badge for premium features
 */
import { __ } from '@wordpress/i18n';

const ProBadge = ( { isPro = false } ) => {
	const wpufSubscriptions = window.wpufSubscriptions || {};

	// Don't show badge if Pro is active or if not a Pro feature
	if ( ! isPro || wpufSubscriptions.isProActive ) {
		return null;
	}

	return (
		<span className="ml-2 inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
			{ __( 'Pro', 'wp-user-frontend' ) }
		</span>
	);
};

export default ProBadge;
