/**
 * DESCRIPTION: Subscription form component for creating/editing subscriptions
 * DESCRIPTION: Refactored to use URL-based navigation via router
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { applyFilters, doAction } from '@wordpress/hooks';
import SubscriptionDetails from './SubscriptionDetails';
import UpdateButton from './UpdateButton';
import { SubscriptionFormFooter } from '../../slots';
import { useSubscriptionData, useSubscriptionActions, useSubscriptionNavigation } from '../../hooks';
import { fetchSubscription } from '../../api/subscription';

const SubscriptionForm = ({ mode = 'add-new', subscriptionId = null }) => {
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState(null);
	const [currentTab, setCurrentTab] = useState('subscription_details');

	// Navigation hook
	const { goToList } = useSubscriptionNavigation();

	// Store selectors using custom hook
	const { subscription, isUpdating, isDirty } = useSubscriptionData();

	// Store actions using custom hook
	const {
		setItem,
		setItemCopy,
		setIsDirty,
		setIsUnsavedPopupOpen,
		modifyItem,
		setBlankItem,
		updateItem: storeUpdateItem,
		populateTaxonomyRestrictionData,
	} = useSubscriptionActions();

	// Fetch subscription data if in edit mode
	useEffect(() => {
		if (mode === 'edit' && subscriptionId) {
			// Fetch single subscription by ID
			fetchSubscription(subscriptionId)
				.then((data) => {
					if (data.success && data.subscription) {
						setItem(data.subscription);
						setItemCopy(JSON.parse(JSON.stringify(data.subscription)));
						populateTaxonomyRestrictionData(data.subscription);
						doAction( 'wpuf.subscription.formMounted', data.subscription, mode );
					} else {
						setError(data.message || __('Subscription not found', 'wp-user-frontend'));
					}
				})
				.catch((err) => {
					setError(err.message || __('Failed to load subscription', 'wp-user-frontend'));
				});
		} else if (mode === 'add-new') {
			// Initialize blank item for new subscription
			setBlankItem();
			doAction( 'wpuf.subscription.formMounted', null, mode );
		}

		return () => {
			doAction( 'wpuf.subscription.formUnmounted' );
		};
	}, [mode, subscriptionId, setItem, setItemCopy, setBlankItem]);

	// Handle field changes
	const handleFieldChange = (field, value) => {
		switch (field.db_type) {
			case 'post':
				modifyItem(field.db_key, value);
				break;

			case 'meta':
				modifyItem(field.db_key, value, null);
				break;

			case 'meta_serialized':
				modifyItem(field.db_key, value, field.serialize_key);
				break;

			default:
				break;
		}
	};

	// Handle save (publish)
	const handlePublish = async () => {
		setIsSaving(true);
		setError(null);

		try {
			// Set post_status to publish
			modifyItem('post_status', 'publish');

			doAction( 'wpuf.subscription.beforeSave', subscription, mode );

			const result = await storeUpdateItem();

			if (result?.success) {
				setIsDirty(false);
				doAction( 'wpuf.subscription.afterSave', result, mode );
				goToList();
			} else {
				setError(result?.message || __('Failed to save subscription', 'wp-user-frontend'));
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setIsSaving(false);
		}
	};

	// Handle save as draft
	const handleSaveDraft = async () => {
		setIsSaving(true);
		setError(null);

		try {
			// Set post_status to draft before saving
			modifyItem('post_status', 'draft');

			doAction( 'wpuf.subscription.beforeSave', subscription, mode );

			const result = await storeUpdateItem();

			if (result?.success) {
				setIsDirty(false);
				doAction( 'wpuf.subscription.afterSave', result, mode );
				goToList();
			} else {
				setError(result?.message || __('Failed to save subscription', 'wp-user-frontend'));
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setIsSaving(false);
		}
	};

	// Handle cancel - check for unsaved changes
	const handleCancel = () => {
		if (isDirty) {
			setIsUnsavedPopupOpen(true);
		} else {
			goToList();
		}
	};

	if (!subscription) {
		return (
			<div className="p-8 text-center">
				<p>{error || __('Loading subscription...', 'wp-user-frontend')}</p>
			</div>
		);
	}

	return (
		<div className="px-12">
			{/* Header */}
			<h3 className="text-lg font-bold mb-0">
				{mode === 'edit'
					? __('Edit Subscription', 'wp-user-frontend')
					: __('New Subscription', 'wp-user-frontend')}
			</h3>

			{/* Error message */}
			{error && (
				<div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-sm">
					{error}
				</div>
			)}

			{/* Subscription details with tabs */}
			<SubscriptionDetails
				subscription={subscription}
				onFieldChange={handleFieldChange}
				currentTab={currentTab}
				onTabChange={setCurrentTab}
			/>

			{/* Extension slot: Pro and third-party plugins can add UI below form fields */}
			<SubscriptionFormFooter.Slot
				fillProps={ { subscription, mode, onFieldChange: handleFieldChange } }
			/>

			{/* Action buttons */}
			<div className="flex flex-row-reverse mt-8 text-end">
				<UpdateButton
					buttonText={mode === 'edit' ? __('Update', 'wp-user-frontend') : __('Save', 'wp-user-frontend')}
					isUpdating={isUpdating || isSaving}
					onPublish={handlePublish}
					onSaveDraft={handleSaveDraft}
				/>
				<button
					type="button"
					onClick={handleCancel}
					className="mr-[10px] rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
				>
					{__('Cancel', 'wp-user-frontend')}
				</button>
			</div>
		</div>
	);
};

export default SubscriptionForm;
