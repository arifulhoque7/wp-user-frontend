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
			<div className="sticky top-10 flex flex-col rounded-lg border border-gray-200 bg-white p-2">
				<ul className="m-0 [&>:not([hidden])~:not([hidden])]:mt-0.5 [&>:not([hidden])~:not([hidden])]:mb-0">
					{ statusItems.map( ( item ) => {
						const count = allCount[ item.key ] || 0;
						const isActive = currentSubscriptionStatus === item.key;

						return (
							<li
								key={ item.key }
								role="button"
								tabIndex={ 0 }
								aria-current={ isActive ? 'page' : undefined }
								onClick={ () => onStatusClick && onStatusClick( item.key ) }
								onKeyDown={ ( event ) => {
									if ( 'Enter' === event.key || ' ' === event.key ) {
										event.preventDefault();
										onStatusClick && onStatusClick( item.key );
									}
								} }
								className={
									'm-0 justify-between items-center group flex gap-x-3 rounded-md py-2.5 px-3 text-sm font-medium leading-5 hover:cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/30' +
									( isActive ? ' bg-primary text-white' : ' text-gray-700 hover:text-gray-900 hover:bg-gray-100' )
								}
							>
								{ item.label }
								{ count > 0 && (
									<span
										className={
											'text-xs leading-4 px-2 py-0.5 rounded-full w-max h-max border' +
											( isActive ? ' border-white/40 text-white' : ' border-gray-200 text-gray-500' )
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
