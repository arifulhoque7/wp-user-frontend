/**
 * DESCRIPTION: Quick Edit modal for subscription plan name and date
 * DESCRIPTION: Allows quick editing without leaving the list view
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import UpdateButton from './UpdateButton';

const QuickEdit = () => {
	const [ title, setTitle ] = useState( '' );
	const [ date, setDate ] = useState( '' );

	// Get data from stores
	const isQuickEdit = useSelect( ( select ) => select( 'wpuf/subscriptions-quick-edit' ).isQuickEdit(), [] );
	const { item, errors, isUpdating, updateError } = useSelect( ( select ) => {
		const store = select( 'wpuf/subscriptions' );
		return {
			item: store.getItem(),
			errors: store.getErrors() || {},
			isUpdating: store.isUpdating(),
			updateError: store.getUpdateError(),
		};
	}, [] );

	const { setItem, setError, resetErrors, updateItem } = useDispatch( 'wpuf/subscriptions' );
	const { setQuickEditStatus } = useDispatch( 'wpuf/subscriptions-quick-edit' );
	const { addNotice } = useDispatch( 'wpuf/subscriptions-notice' );

	// Initialize form data when item changes
	useEffect( () => {
		if ( item ) {
			setTitle( item.post_title || '' );
			setDate( item.post_date || '' );
		}
	}, [ item ] );

	// Format date for datetime-local input (YYYY-MM-DDTHH:mm)
	const formatDateTimeForInput = useCallback( ( dateStr ) => {
		if ( ! dateStr ) return '';
		const date = new Date( dateStr );
		const year = date.getFullYear();
		const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
		const day = String( date.getDate() ).padStart( 2, '0' );
		const hours = String( date.getHours() ).padStart( 2, '0' );
		const minutes = String( date.getMinutes() ).padStart( 2, '0' );
		return `${ year }-${ month }-${ day }T${ hours }:${ minutes }`;
	}, [] );

	// Format date for API (YYYY-MM-DD HH:mm:ss)
	const formatDateTimeForAPI = useCallback( ( dateStr ) => {
		if ( ! dateStr ) return '';
		const date = new Date( dateStr );
		const year = date.getFullYear();
		const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
		const day = String( date.getDate() ).padStart( 2, '0' );
		const hours = String( date.getHours() ).padStart( 2, '0' );
		const minutes = String( date.getMinutes() ).padStart( 2, '0' );
		const seconds = String( date.getSeconds() ).padStart( 2, '0' );
		return `${ year }-${ month }-${ day } ${ hours }:${ minutes }:${ seconds }`;
	}, [] );

	// Common update function with status
	const updateWithStatus = useCallback( ( newStatus ) => {
		resetErrors();

		// Validate plan name
		if ( ! title || title.trim() === '' ) {
			setError( 'planName', __( 'This field is required', 'wp-user-frontend' ) );
			return;
		}

		if ( title.includes( '#' ) ) {
			setError( 'planName', __( '# is not supported in plan name', 'wp-user-frontend' ) );
			return;
		}

		// Update the item with new values
		const updatedItem = {
			...item,
			post_title: title,
			post_date: formatDateTimeForAPI( date ),
			post_status: newStatus,
		};

		setItem( updatedItem );

		// Call updateItem action
		updateItem().then( ( result ) => {
			if ( result.success ) {
				addNotice( {
					content: result.message || __( 'Subscription updated successfully', 'wp-user-frontend' ),
					type: 'success',
				} );
				setQuickEditStatus( false );
				// Refresh the list after a short delay
				setTimeout( () => {
					window.location.reload();
				}, 1000 );
			} else {
				setError( 'fetch', result.message || __( 'An error occurred while updating', 'wp-user-frontend' ) );
			}
		} );
	}, [ item, title, date, setItem, setError, resetErrors, updateItem, setQuickEditStatus, addNotice, formatDateTimeForAPI ] );

	// Handle publish
	const handlePublish = useCallback( () => {
		updateWithStatus( 'publish' );
	}, [ updateWithStatus ] );

	// Handle save as draft
	const handleSaveDraft = useCallback( () => {
		updateWithStatus( 'draft' );
	}, [ updateWithStatus ] );

	// Handle cancel
	const handleCancel = useCallback( () => {
		setQuickEditStatus( false );
		resetErrors();
	}, [ setQuickEditStatus, resetErrors ] );

	if ( ! isQuickEdit ) {
		return null;
	}

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-10 bg-black/50" />

			{/* Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="mx-auto w-full max-w-lg rounded-lg bg-white shadow-xl p-6">
					{/* Plan Name Field */}
					<div className="px-2">
						<label htmlFor="plan-name" className="block text-sm font-medium leading-6 text-gray-900">
							{ __( 'Plan name', 'wp-user-frontend' ) }
						</label>
						<div className="relative mt-2 rounded-md shadow-xs">
							<input
								type="text"
								id="plan-name"
								value={ title }
								onChange={ ( e ) => setTitle( e.target.value ) }
								className={ `w-full rounded-md bg-white py-1.5 pl-3 pr-10 shadow-xs focus:outline-hidden focus:ring-1 sm:text-sm ${
									errors?.planName
										? 'border-red-500! ring-red-300 placeholder:text-red-300 text-red-900! focus:ring-red-500 border-2'
										: 'ring-gray-300 focus:ring-blue-500 border-gray-300'
								}` }
								aria-invalid={ errors?.planName ? 'true' : 'false' }
							/>
							{ errors?.planName && (
								<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
									<ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
								</div>
							) }
						</div>
						{ errors?.planName && (
							<p className="mt-2 text-sm text-red-600" id="plan-name-error">
								{ errors?.planName?.message }
							</p>
						) }
					</div>

					{/* Date Field */}
					<div className="px-2 mt-4">
						<label htmlFor="post-date" className="block text-sm font-medium leading-6 text-gray-900">
							{ __( 'Date', 'wp-user-frontend' ) }
						</label>
						<div className="relative mt-2 rounded-md shadow-xs">
							<input
								type="datetime-local"
								id="post-date"
								value={ formatDateTimeForInput( date ) }
								onChange={ ( e ) => setDate( e.target.value ) }
								className={ `w-full rounded-md bg-white py-1.5 pl-3 pr-3 shadow-xs focus:outline-hidden focus:ring-1 sm:text-sm ${
									errors?.date
										? 'border-red-500! ring-red-300 placeholder:text-red-300 text-red-900! focus:ring-red-500 border-2'
										: 'ring-gray-300 focus:ring-blue-500 border-gray-300'
								}` }
								aria-invalid={ errors?.date ? 'true' : 'false' }
							/>
						</div>
						{ errors?.date && (
							<p className="mt-2 text-sm text-red-600" id="date-error">
								{ __( 'Not a valid date', 'wp-user-frontend' ) }
							</p>
						) }
					</div>

					{/* Update Error */}
					{ updateError && updateError.status && (
						<div className="px-2 mt-4">
							<p className="mt-2 text-xs text-red-600">{ updateError.message }</p>
						</div>
					) }

					{/* Actions */}
					<div className="mt-6 flex flex-row-reverse gap-3">
						<UpdateButton
							isUpdating={ isUpdating }
							onPublish={ handlePublish }
							onSaveDraft={ handleSaveDraft }
						/>
						<button
							type="button"
							onClick={ handleCancel }
							disabled={ isUpdating }
							className={ `rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50${
								isUpdating ? ' cursor-not-allowed bg-gray-50' : ''
							}` }
						>
							{ __( 'Cancel', 'wp-user-frontend' ) }
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default QuickEdit;
