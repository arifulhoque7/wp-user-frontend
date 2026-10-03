/**
 * DESCRIPTION: Empty state component when no subscriptions found
 * DESCRIPTION: Shows appropriate message and action based on current status
 */
import { __ } from '@wordpress/i18n';

const Empty = ( { message, currentSubscriptionStatus, onAddSubscription } ) => {
	return (
		<div className="h-[50vh] flex items-center justify-center">
			<div className="w-3/4 text-center">
				{ currentSubscriptionStatus === 'all' && (
					<svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
					</svg>
				) }
				{ currentSubscriptionStatus === 'all' && (
					<h3 className="text-3xl text-gray-900">
						{ __( 'No Subscription created yet!', 'wp-user-frontend' ) }
					</h3>
				) }
				<p className="text-sm text-gray-500 text-center mt-8">
					{ message }
				</p>
				{ currentSubscriptionStatus === 'all' && onAddSubscription && (
					<div className="mt-12">
						<button
							type="button"
							onClick={ onAddSubscription }
							className="rounded-md bg-primary px-3 py-2 text-sm text-white shadow-xs hover:bg-primaryHover focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						>
							<span className="dashicons dashicons-plus-alt"></span>&nbsp;&nbsp;&nbsp;
							{ __( 'Add Subscription', 'wp-user-frontend' ) }
						</button>
					</div>
				) }
			</div>
		</div>
	);
};

export default Empty;
