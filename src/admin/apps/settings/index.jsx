/**
 * Entry point for the React Settings app.
 *
 * Renders the redesigned WPUF settings screen. Reads/writes settings through
 * the wpuf/v1/settings REST endpoint, which persists to the exact same option
 * keys + field names the legacy settings screen used (storage parity).
 */
import { createRoot } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useCallback, useRef, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Save } from 'lucide-react';

import { Button, PageFooter, PageHeader, PageShell, Tabs, WpufProviders } from '@wpuf/components';
import SettingsNav from './components/settings/SettingsNav';
import SettingsSection, { PROVIDER_SECTIONS } from './components/settings/SettingsSection';
import { stripTags } from './components/settings/utils';
import UnsavedChanges from './components/settings/UnsavedChanges';
import MessageModal from './components/settings/MessageModal';
import ErrorBoundary from './components/settings/ErrorBoundary';

// Register the store.
import './stores-react/settings';
import { STORE_NAME } from './stores-react/settings/constants';
import { addRouteGuard, getRouteQuery, inApp, registerScreen, setRouteQuery } from '../../app/client';

// apiFetch is externalized to WordPress core's window.wp.apiFetch, which already
// has the REST root URL + nonce middleware configured (via the wp-api-fetch
// dependency). No extra middleware needed — adding our own root middleware would
// double-prefix the path and break requests.

const SettingsApp = () => {
    const { ia, sections, fields, activeTab, isLoading, isSaving, isDirty, error, search } = useSelect( ( select ) => {
        const store = select( STORE_NAME );
        return {
            ia: store.getIa(),
            sections: store.getSections(),
            fields: store.getFields(),
            activeTab: store.getActiveTab(),
            isLoading: store.isLoading(),
            isSaving: store.isSaving(),
            isDirty: store.isDirty(),
            error: store.getError(),
            search: store.getSearch(),
        };
    }, [] );

    const { setActiveTab, setSearch, save, discard, loadSettings, setError } = useDispatch( STORE_NAME );

    const boot = window.wpuf_settings || {};
    const [ pendingTab, setPendingTab ] = useState( null );
    const [ showNewUi, setShowNewUi ] = useState( !! boot.new_ui_notice );
    const classicOnly = Array.isArray( boot.classic_only ) ? boot.classic_only : [];
    const [ activeSub, setActiveSub ] = useState( null );
    const [ justSaved, setJustSaved ] = useState( false );
    const savedTimer = useRef( null );

    // Explicit "Saved" confirmation: driven by the save() thunk's boolean result,
    // not inferred from isSaving/error transitions.
    const handleSave = useCallback( async () => {
        const ok = await save();
        if ( ok ) {
            setJustSaved( true );
            if ( savedTimer.current ) {
                clearTimeout( savedTimer.current );
            }
            savedTimer.current = setTimeout( () => setJustSaved( false ), 2500 );
        }
    }, [ save ] );

    useEffect( () => () => {
        if ( savedTimer.current ) {
            clearTimeout( savedTimer.current );
        }
    }, [] );

    const sectionTitle = ( id ) => {
        const s = sections.find( ( x ) => x.id === id );
        return s ? stripTags( s.title ) : id;
    };

    const didInit = useRef( false );

    // Load the settings payload once on mount.
    useEffect( () => {
        loadSettings();
    }, [ loadSettings ] );

    // Restore the active tab + sub-tab from the URL once the IA loads (so a
    // refresh / shared link lands on the same tab); fall back to the first tab.
    useEffect( () => {
        if ( didInit.current || ! ia.length ) {
            return;
        }
        const query = getRouteQuery();
        let urlTab = query.tab || null;
        let urlSub = query.sub || null;

        // Links from the classic screen point at a section, by hash
        // (`#wpuf_ai`, `#/ai`) or as `?tab=wpuf_payment`: open the tab that
        // holds that section, on that section. In the admin app the old
        // fragment arrives as the route's `hash` query.
        const hash = ( inApp() ? query.hash || '' : window.location.hash ).replace( /^#?\/?/, '' );
        const target = ( urlTab && ! ia.find( ( t ) => t.id === urlTab ) && urlTab ) || ( ! urlTab && hash ) || '';
        if ( target ) {
            const section = target.startsWith( 'wpuf_' ) || target === 'n8n' ? target : `wpuf_${ target }`;
            const owner = ia.find( ( t ) => Array.isArray( t.sections ) && t.sections.includes( section ) );
            if ( owner ) {
                urlTab = owner.id;
                urlSub = section;
            } else if ( ia.find( ( t ) => t.id === target ) ) {
                urlTab = target;
            }
        }

        const restoredTab = ( urlTab && ia.find( ( t ) => t.id === urlTab ) ) || ia[ 0 ];
        setActiveTab( restoredTab.id );

        // Only restore the sub-tab if it actually belongs to the restored tab,
        // so a stale/hand-edited `?sub=` doesn't show an empty panel.
        if ( urlSub && Array.isArray( restoredTab.sections ) && restoredTab.sections.includes( urlSub ) ) {
            setActiveSub( urlSub );
        }
        didInit.current = true;
    }, [ ia, setActiveTab ] );

    // Reflect the active tab + sub-tab in the URL (replaceState — no reload, no
    // history spam) so the selection survives a refresh.
    useEffect( () => {
        if ( ! didInit.current || ! activeTab ) {
            return;
        }
        setRouteQuery( { tab: activeTab, sub: activeSub || null, hash: null } );
    }, [ activeTab, activeSub ] );

    // In the admin app, leaving the route with unsaved edits asks first (the
    // same dialog as switching tabs).
    const dirtyRef = useRef( isDirty );
    dirtyRef.current = isDirty;
    const [ pendingLeave, setPendingLeave ] = useState( null );

    useEffect(
        () => addRouteGuard( () => ( dirtyRef.current ? new Promise( ( resolve ) => setPendingLeave( { resolve } ) ) : true ) ),
        []
    );

    // Warn before leaving the page with unsaved changes.
    useEffect( () => {
        const handler = ( e ) => {
            if ( isDirty ) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener( 'beforeunload', handler );
        return () => window.removeEventListener( 'beforeunload', handler );
    }, [ isDirty ] );

    // Intercept tab switches when there are unsaved edits.
    const handleSelectTab = useCallback(
        ( tabId ) => {
            // Clicking a tab exits an active search to that tab.
            setSearch( '' );
            if ( tabId === activeTab ) {
                return;
            }
            if ( isDirty ) {
                setPendingTab( tabId );
                return;
            }
            // Real user tab switch — start the new tab at its first sub-tab.
            setActiveSub( null );
            setActiveTab( tabId );
        },
        [ activeTab, isDirty, setActiveTab, setSearch ]
    );

    const handleDiscard = useCallback( () => {
        discard();
        if ( pendingTab ) {
            setActiveSub( null );
            setActiveTab( pendingTab );
        }
        setPendingTab( null );
    }, [ discard, pendingTab, setActiveTab ] );

    const currentTab = ia.find( ( t ) => t.id === activeTab ) || ia[ 0 ];

    // Global search: when a term is entered, search across EVERY section (not just
    // the active tab), so e.g. "social" finds the Social Login fields under
    // Login & Registration. Each SettingsSection renders null when it has no
    // matching field, so only sections with hits appear.
    const searching = !! ( search && search.trim() );
    const searchTerm = searching ? search.trim().toLowerCase() : '';
    const allSectionIds = [ ...new Set( ia.flatMap( ( t ) => t.sections || [] ) ) ];
    const renderedSections = searching
        ? allSectionIds
        : ( currentTab
            ? ( currentTab.sections || [] ).filter(
                ( sectionId ) => ! currentTab.subtabs || ( activeSub || currentTab.sections[ 0 ] ) === sectionId
            )
            : [] );

    // Whether any section has a field / title matching the search (coarse — used
    // only to decide between rendering results vs the empty state).
    const searchHasResults = ! searching || allSectionIds.some( ( sid ) => {
        const secFields = fields[ sid ] || [];
        if ( secFields.some( ( f ) =>
            `${ f.label || '' } ${ f.desc || '' } ${ f.name || '' }`.toLowerCase().includes( searchTerm )
        ) ) {
            return true;
        }
        // Provider sections can match on the provider's display name/key (e.g.
        // "facebook" / "vonage") even when no field label contains it — mirror
        // SettingsSection/ProviderTabs so the empty state isn't shown falsely.
        const providers = PROVIDER_SECTIONS[ sid ];
        if ( providers && providers.some( ( p ) =>
            ( p.label || '' ).toLowerCase().includes( searchTerm ) || ( p.key || '' ).toLowerCase().includes( searchTerm )
        ) ) {
            return true;
        }
        const sec = sections.find( ( s ) => s.id === sid );
        return sec && stripTags( sec.title ).toLowerCase().includes( searchTerm );
    } );

    return (
        <PageShell className="wpuf-settings-react">
            <PageHeader
                utm="wpuf-settings"
                supportUrl={ boot.support_url || undefined }
                extra={ boot.switch_ui_url ? (
                    <a
                        href={ boot.switch_ui_url }
                        title={ __( 'Switch back to the classic settings screen', 'wp-user-frontend' ) }
                        className="border border-solid border-gray-100 mr-4 text-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 no-underline shadow-xs hover:bg-slate-100 hover:text-gray-600"
                    >
                        { __( 'Classic view', 'wp-user-frontend' ) }
                    </a>
                ) : null }
            />

            { isLoading ? (
                <div className="px-3 pt-8 pb-6">
                    <div className="flex animate-pulse gap-8 rounded-lg border border-gray-200 bg-white p-8 shadow-xs">
                        {/* Left nav skeleton */}
                        <div className="w-[280px] shrink-0 [&>:not([hidden])~:not([hidden])]:mt-3 [&>:not([hidden])~:not([hidden])]:mb-0">
                            <div className="h-9 rounded-md bg-gray-100" />
                            { Array.from( { length: 8 } ).map( ( _, i ) => (
                                <div key={ i } className="h-9 rounded-md bg-gray-100" />
                            ) ) }
                        </div>
                        {/* Content skeleton */}
                        <div className="min-w-0 flex-1 border-l border-gray-200 pl-8">
                            <div className="h-7 w-44 rounded-sm bg-gray-200" />
                            <div className="my-8 border-b border-gray-200" />
                            <div className="[&>:not([hidden])~:not([hidden])]:mt-6 [&>:not([hidden])~:not([hidden])]:mb-0">
                                { Array.from( { length: 5 } ).map( ( _, i ) => (
                                    <div key={ i }>
                                        <div className="mb-2 h-4 w-32 rounded-sm bg-gray-100" />
                                        <div className="h-9 w-full rounded-md bg-gray-100" />
                                    </div>
                                ) ) }
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
            <div className="px-3 pt-8 pb-6">
            { /* Settings of other plugins the React screen cannot show (D12). */ }
            { classicOnly.length > 0 && (
                <div role="status" data-settings-notice="classic-only" className="mb-6 flex items-start gap-3 rounded-md border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <div className="min-w-0 flex-1">
                        <p className="m-0 font-medium">
                            { __( 'Some settings added by other plugins are only available in Classic view:', 'wp-user-frontend' ) }
                        </p>
                        <p className="m-0 mt-1">{ classicOnly.join( ', ' ) }</p>
                    </div>
                    { boot.classic_url && (
                        <a href={ boot.classic_url } className="shrink-0 font-medium text-amber-900 underline hover:text-amber-900">
                            { __( 'Open Classic view', 'wp-user-frontend' ) }
                        </a>
                    ) }
                </div>
            ) }

            { /* Shown once to each admin of a site that had the classic screen (D12). */ }
            { showNewUi && (
                <div role="status" data-settings-notice="new-ui" className="mb-6 flex items-start gap-3 rounded-md border-l-4 border-primary bg-emerald-50 px-4 py-3 text-sm text-gray-700">
                    <p className="m-0 min-w-0 flex-1">
                        { boot.switch_ui_url
                            ? createInterpolateElement(
                                __( 'This is the new settings screen. Every setting is where it was stored before; you can go back to the <a>Classic view</a> at any time.', 'wp-user-frontend' ),
                                { a: <a href={ boot.switch_ui_url } className="font-medium text-primary underline" /> } // eslint-disable-line jsx-a11y/anchor-has-content
                            )
                            : __( 'This is the new settings screen. Every setting is where it was stored before.', 'wp-user-frontend' ) }
                    </p>
                    <Button variant="link" size="sm" className="shrink-0 text-gray-600" onClick={ () => setShowNewUi( false ) }>
                        { __( 'Dismiss', 'wp-user-frontend' ) }
                    </Button>
                </div>
            ) }

            { error ? (
                <MessageModal
                    title={ __( 'Couldn’t save settings', 'wp-user-frontend' ) }
                    message={ error }
                    tone="error"
                    onClose={ () => setError( null ) }
                />
            ) : null }

            { /* Title row over both columns (FlyHR settings). */ }
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="mt-0 mb-0 text-xl! font-semibold leading-7 text-gray-900">
                    { searching
                        ? __( 'Search results', 'wp-user-frontend' )
                        : ( currentTab ? currentTab.title : '' ) }
                </h2>
            </div>

            <div className="flex items-start gap-6">
                <SettingsNav
                    ia={ ia }
                    activeTab={ activeTab }
                    onSelect={ handleSelectTab }
                    search={ search }
                    onSearch={ setSearch }
                />

                <div className="min-w-0 flex-1 max-w-full">

                    { ! searching && currentTab && currentTab.notice ? (
                        <div className="mb-8 flex items-start gap-2 rounded-md border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.1c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            { currentTab.notice }
                        </div>
                    ) : null }

                    { ! searching && currentTab && currentTab.subtabs && currentTab.sections.length > 1 ? (
                        <div className="mb-8" data-settings-subtabs="">
                            <Tabs
                                variant="segmented"
                                label={ currentTab.title }
                                tabs={ currentTab.sections.map( ( sid ) => ( { id: sid, label: sectionTitle( sid ) } ) ) }
                                value={ activeSub || currentTab.sections[ 0 ] }
                                onChange={ setActiveSub }
                            />
                        </div>
                    ) : null }

                    { searching && ! searchHasResults ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <p className="m-0 text-base font-medium text-gray-700">
                                { __( 'No settings found', 'wp-user-frontend' ) }
                            </p>
                            <p className="mt-1 mb-0 text-sm text-gray-400">
                                { __( 'Try a different keyword.', 'wp-user-frontend' ) }
                            </p>
                        </div>
                    ) : (
                        renderedSections.map( ( sectionId ) => (
                            <ErrorBoundary key={ sectionId }>
                                <SettingsSection
                                    sectionId={ sectionId }
                                    tabTitle={ ! searching && currentTab && ! currentTab.subtabs ? currentTab.title : null }
                                />
                            </ErrorBoundary>
                        ) )
                    ) }
                </div>
            </div>
            { /* Save / Cancel: a sticky card at the end of the content, as FlyHR's
                Add Employee form (owner 2026-10-06): it follows the window bottom
                while the section is taller than the window and sits above the
                logo footer, never over it. */ }
            <div className="wpuf-settings-actions sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 rounded-[10px] border border-gray-200 bg-white/95 px-6 py-4 shadow-[0_-1px_3px_rgba(0,0,0,0.06)] backdrop-blur">
                { justSaved ? (
                    <span className="me-auto flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        { __( 'Saved', 'wp-user-frontend' ) }
                    </span>
                ) : isDirty ? (
                    <span className="me-auto text-xs text-gray-400">
                        { __( 'Unsaved changes', 'wp-user-frontend' ) }
                    </span>
                ) : null }
                <Button
                    variant="secondary"
                    size="lg"
                    disabled={ ! isDirty || isSaving }
                    onClick={ () => discard() }
                >
                    { __( 'Cancel', 'wp-user-frontend' ) }
                </Button>
                <Button
                    size="lg"
                    disabled={ isSaving || ! isDirty }
                    onClick={ handleSave }
                >
                    <Save size={ 16 } strokeWidth={ 2 } aria-hidden="true" />
                    { isSaving ? __( 'Saving…', 'wp-user-frontend' ) : __( 'Save', 'wp-user-frontend' ) }
                </Button>
            </div>
            </div>
            ) }

            { /* WordPress's footer is hidden on shared-layer screens (D26): the switch
                link lives here (D12), at the bottom of the window on short tabs. */ }
            <PageFooter>
                { boot.switch_ui_url && createInterpolateElement(
                    __( 'Prefer the old screen? Switch to the <a>Classic view</a>.', 'wp-user-frontend' ),
                    { a: <a href={ boot.switch_ui_url } data-settings-switch="footer" className="text-gray-600 underline hover:text-gray-900" /> } // eslint-disable-line jsx-a11y/anchor-has-content
                ) }
            </PageFooter>


            { pendingTab && (
                <UnsavedChanges
                    onDiscard={ handleDiscard }
                    onContinue={ () => setPendingTab( null ) }
                />
            ) }

            { pendingLeave && (
                <UnsavedChanges
                    onDiscard={ () => {
                        discard();
                        pendingLeave.resolve( true );
                        setPendingLeave( null );
                    } }
                    onContinue={ () => {
                        pendingLeave.resolve( false );
                        setPendingLeave( null );
                    } }
                />
            ) }
        </PageShell>
    );
};

// On its own page it mounts into #wpuf-settings-root; in the admin app the
// shell mounts it on the settings route (task 5d).
registerScreen( 'settings', [ 'wpuf-settings-root' ], ( container ) => {
    const root = createRoot( container );

    root.render(
        <WpufProviders host>
            <SettingsApp />
        </WpufProviders>
    );

    return () => root.unmount();
} );
