/**
 * DESCRIPTION: ProTooltip component for upgrade prompts
 * DESCRIPTION: Shows tooltip with upgrade link on hover for Pro features
 */
import { __ } from '@wordpress/i18n';

const ProTooltip = ( { isPro = true } ) => {
	const wpufSubscriptions = window.wpufSubscriptions || {};

	// Don't show tooltip if Pro is active or if not a Pro feature
	if ( ! isPro || wpufSubscriptions.isProActive ) {
		return null;
	}

	return (
		<div
			role="tooltip"
			className="hidden wpuf-group-hover:wpuf-block absolute z-50 w-64 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg left-0 top-full mt-1"
		>
			<div className="relative">
				<p className="m-0 mb-2">
					{ __( 'This feature is available in Pro version', 'wp-user-frontend' ) }
				</p>
				<a
					href={ wpufSubscriptions.upgradeUrl || '#' }
					target="_blank"
					rel="noopener noreferrer"
					className="text-emerald-400 wpuf-hover:wpuf-text-emerald-300 font-medium underline"
				>
					{ __( 'Upgrade to Pro', 'wp-user-frontend' ) }
					&rarr;
				</a>
				{/* Arrow */}
				<div className="absolute -top-1 left-4 w-2 h-2 rotate-45 bg-gray-900" />
			</div>
		</div>
	);
};

export default ProTooltip;
