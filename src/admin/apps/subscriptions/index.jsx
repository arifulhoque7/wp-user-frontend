/**
 * DESCRIPTION: Entry point for Subscriptions React app
 * DESCRIPTION: Renders the subscription management interface with URL-based navigation
 */
import { createRoot } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SlotFillProvider } from '@wordpress/components';
import { doAction } from '@wordpress/hooks';
import { WpufProviders, PageHeader, UnsavedGuard } from '@wpuf/components';
import SubscriptionForm from './components/subscriptions/SubscriptionForm';
import SubscriptionList from './components/subscriptions/SubscriptionList';
import SidebarMenu from './components/subscriptions/SidebarMenu';
import ContentHeader from './components/subscriptions/ContentHeader';
import QuickEdit from './components/subscriptions/QuickEdit';
import Preferences from './components/subscriptions/Preferences';
import Notices from './components/subscriptions/Notices';

// Import stores to register them
import './stores-react/subscription';
import './stores-react/fieldDependency';
import './stores-react/notice';
import './stores-react/component';
import './stores-react/quickEdit';
import './stores-react/router';

// Import styles

// Signal to Pro and third-party plugins that stores are registered and ready
doAction( 'wpuf.subscription.init' );

const SubscriptionsApp = () => {
    // Get current route from router store
    const { params } = useSelect((select) => {
        const router = select('wpuf/subscriptions-router');
        return {
            params: router.getQueryParams(),
        };
    }, []);

    // Get subscription data from store
    const { allCount, isDirty, isUnsavedPopupOpen } = useSelect((select) => {
        const store = select('wpuf/subscriptions');
        return {
            allCount: store.getCounts(),
            isDirty: store.isDirty(),
            isUnsavedPopupOpen: store.isUnsavedPopupOpen(),
        };
    }, []);

    const { navigate } = useDispatch('wpuf/subscriptions-router');
    const { setIsUnsavedPopupOpen, setIsDirty } = useDispatch('wpuf/subscriptions');

    const [pendingStatus, setPendingStatus] = useState(null);

    // Determine view based on URL params
    const action = params.action || 'list';
    const subscriptionId = params.id ? parseInt(params.id, 10) : null;
    const status = params.post_status || 'all';

    // Get actions from store for fetching counts
    const { fetchCounts } = useDispatch('wpuf/subscriptions');

    // Fetch counts on mount
    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    // Handle add subscription click
    // develop shows "Add Subscription" on the form views too; leaving a dirty
    // form asks first (develop did not).
    const handleAddSubscription = useCallback(() => {
        if (isDirty) {
            setPendingStatus('__new');
            setIsUnsavedPopupOpen(true);
            return;
        }
        navigate({ action: 'new', id: null, post_status: null, p: null });
    }, [isDirty, navigate, setIsUnsavedPopupOpen]);

    // Handle sidebar status click
    const handleStatusClick = useCallback((newStatus) => {
        if (isDirty) {
            setIsUnsavedPopupOpen(true);
            setPendingStatus(newStatus);
        } else {
            navigate({ action: null, id: null, post_status: newStatus === 'all' ? null : newStatus, p: null });
        }
    }, [isDirty, navigate, setIsUnsavedPopupOpen]);

    // Handle discard changes from unsaved popup
    const handleDiscardChanges = useCallback(() => {
        setIsDirty(false);
        setIsUnsavedPopupOpen(false);
        // A sidebar click goes to that status; the form's Cancel goes back to
        // the list it came from (develop goToList).
        if ('__new' === pendingStatus) {
            navigate({ action: 'new', id: null, post_status: null, p: null });
            setPendingStatus(null);
            return;
        }
        const target = pendingStatus || status;
        navigate({ action: null, id: null, post_status: target === 'all' ? null : target, p: null });
        setPendingStatus(null);
    }, [pendingStatus, status, navigate, setIsDirty, setIsUnsavedPopupOpen]);

    // Handle continue editing from unsaved popup
    const handleContinueEditing = useCallback(() => {
        setIsUnsavedPopupOpen(false);
        // Staying: forget where the cancelled navigation was going.
        setPendingStatus(null);
    }, [setIsUnsavedPopupOpen]);

    return (
        <>
            <PageHeader utm="wpuf-subscription" />
            <ContentHeader
                currentSubscriptionStatus={status}
                allCount={allCount}
                onAddSubscription={handleAddSubscription}
            />
            <div className={`flex pt-[40px] px-[20px] ${isUnsavedPopupOpen ? 'blur-sm' : ''}`}>
                {/* Left Sidebar */}
                <div className="basis-1/5 border-r-2 border-gray-200">
                    <SidebarMenu
                        currentSubscriptionStatus={status}
                        allCount={allCount}
                        onStatusClick={handleStatusClick}
                        isUnsavedPopupOpen={isUnsavedPopupOpen}
                    />
                </div>

                {/* Main Content */}
                <div className="basis-4/5">
                    {action === 'edit' || action === 'new' ? (
                        <SubscriptionForm
                            mode={action === 'new' ? 'add-new' : 'edit'}
                            subscriptionId={subscriptionId}
                            onDiscardChanges={handleDiscardChanges}
                            onContinueEditing={handleContinueEditing}
                        />
                    ) : status === 'preferences' ? (
                        <Preferences />
                    ) : (
                        <SubscriptionList />
                    )}
                </div>
            </div>

            {/* Unsaved changes: the dialog on sidebar/cancel, the browser prompt on unload */}
            <UnsavedGuard
                dirty={isDirty}
                open={isUnsavedPopupOpen}
                onDiscard={handleDiscardChanges}
                onContinue={handleContinueEditing}
            />

            {/* Quick Edit modal */}
            <QuickEdit />

            {/* Quick edit / preferences notices go to the shared toasts (develop's Notice list position) */}
            <Notices />
        </>
    );
};

const container = document.getElementById('wpuf-subscription-page');

if (container) {
    const root = createRoot(container);
    root.render(
        // host: the form views are still legacy markup until 4.1b (design.md D25).
        <WpufProviders host>
            <SlotFillProvider>
                <SubscriptionsApp />
            </SlotFillProvider>
        </WpufProviders>
    );
}
