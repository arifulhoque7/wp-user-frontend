/**
 * DESCRIPTION: SidebarMenu component for Subscriptions page
 * DESCRIPTION: Displays navigation menu with status filters and counts
 */
import { __ } from '@wordpress/i18n';

const SidebarMenu = ( {
	currentSubscriptionStatus = 'all',
	allCount = {},
	onStatusClick,
	isUnsavedPopupOpen = false,
} ) => {
	const statusItems = [
		{ key: 'all', label: __( 'All Subscriptions', 'wp-user-frontend' ) },
		{ key: 'publish', label: __( 'Published', 'wp-user-frontend' ) },
		{ key: 'draft', label: __( 'Drafts', 'wp-user-frontend' ) },
		{ key: 'trash', label: __( 'Trash', 'wp-user-frontend' ) },
		{ key: 'preferences', label: __( 'Preferences', 'wp-user-frontend' ) },
	];

	return (
		<div className={ isUnsavedPopupOpen ? 'blur-sm' : '' }>
			<div className="flex flex-col">
				<ul className="[&>:not([hidden])~:not([hidden])]:mt-2 [&>:not([hidden])~:not([hidden])]:mb-0 text-lg">
					{ statusItems.map( ( item ) => {
						const count = allCount[ item.key ] || 0;
						const isActive = currentSubscriptionStatus === item.key;

						return (
							<li
								key={ item.key }
								onClick={ () => onStatusClick && onStatusClick( item.key ) }
								className={
									'justify-between text-gray-700 hover:text-primary hover:bg-gray-50 group flex gap-x-3 rounded-md py-2 px-[20px] text-sm leading-6 hover:cursor-pointer' +
									( isActive ? ' bg-gray-50 text-primary' : '' )
								}
							>
								{ item.label }
								{ count > 0 && (
									<span
										className={
											'text-sm w-fit px-2.5 py-1 rounded-full w-max h-max border' +
											( isActive ? ' border-primary' : '' )
										}
									>
										{ count }
									</span>
								) }
							</li>
						);
					} ) }
				</ul>
			</div>
		</div>
	);
};

export default SidebarMenu;
