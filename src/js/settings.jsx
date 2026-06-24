/**
 * Entry point for the React Settings app.
 *
 * Renders the redesigned WPUF settings screen. Reads/writes settings through
 * the wpuf/v1/settings REST endpoint, which persists to the exact same option
 * keys + field names the legacy settings screen used (storage parity).
 */
import { createRoot } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import Header from './components/settings/Header';
import SettingsNav from './components/settings/SettingsNav';
import SettingsSection from './components/settings/SettingsSection';
import UnsavedChanges from './components/settings/UnsavedChanges';
import ErrorBoundary from './components/settings/ErrorBoundary';

// Register the store.
import './stores-react/settings';
import { STORE_NAME } from './stores-react/settings/constants';

// apiFetch is externalized to WordPress core's window.wp.apiFetch, which already
// has the REST root URL + nonce middleware configured (via the wp-api-fetch
// dependency). No extra middleware needed — adding our own root middleware would
// double-prefix the path and break requests.

const SettingsApp = () => {
    const { ia, sections, activeTab, isLoading, isSaving, isDirty, error, search } = useSelect( ( select ) => {
        const store = select( STORE_NAME );
        return {
            ia: store.getIa(),
            sections: store.getSections(),
            activeTab: store.getActiveTab(),
            isLoading: store.isLoading(),
            isSaving: store.isSaving(),
            isDirty: store.isDirty(),
            error: store.getError(),
            search: store.getSearch(),
        };
    }, [] );

    const { setActiveTab, setSearch, save, discard, loadSettings } = useDispatch( STORE_NAME );

    const [ pendingTab, setPendingTab ] = useState( null );
    const [ activeSub, setActiveSub ] = useState( null );
    const [ footerLeft, setFooterLeft ] = useState( 160 );

    // Keep the fixed footer aligned with the content area by tracking the live
    // WordPress admin-menu width (changes on fold toggle + responsive breakpoints).
    useEffect( () => {
        const update = () => {
            const menu = document.getElementById( 'adminmenuwrap' );
            const w = menu ? menu.offsetWidth : 160;
            setFooterLeft( window.innerWidth <= 782 ? 0 : w );
        };
        update();
        window.addEventListener( 'resize', update );
        const observer = new MutationObserver( update );
        observer.observe( document.body, { attributes: true, attributeFilter: [ 'class' ] } );
        return () => {
            window.removeEventListener( 'resize', update );
            observer.disconnect();
        };
    }, [] );

    const sectionTitle = ( id ) => {
        const s = sections.find( ( x ) => x.id === id );
        return s ? s.title.replace( /<[^>]*>/g, '' ).trim() : id;
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
        const params = new URLSearchParams( window.location.search );
        const urlTab = params.get( 'tab' );
        const urlSub = params.get( 'sub' );

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
        const params = new URLSearchParams( window.location.search );
        params.set( 'tab', activeTab );
        if ( activeSub ) {
            params.set( 'sub', activeSub );
        } else {
            params.delete( 'sub' );
        }
        window.history.replaceState( null, '', `${ window.location.pathname }?${ params.toString() }` );
    }, [ activeTab, activeSub ] );

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
        [ activeTab, isDirty, setActiveTab ]
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

    return (
        <div className="wpuf-settings-react wpuf-min-h-screen">
            <Header utm="wpuf-settings" />

            { isLoading ? (
                <p className="wpuf-p-8 wpuf-text-gray-500">{ __( 'Loading…', 'wp-user-frontend' ) }</p>
            ) : (
            <div className="wpuf-px-[32px] wpuf-pt-[32px] wpuf-pb-[100px]">
            { error ? (
                <div className="wpuf-mb-4 wpuf-rounded-md wpuf-bg-red-50 wpuf-px-4 wpuf-py-3 wpuf-text-sm wpuf-text-red-700">
                    { error }
                </div>
            ) : null }

            <div className="wpuf-flex wpuf-gap-8 wpuf-rounded-lg wpuf-border wpuf-border-gray-200 wpuf-bg-white wpuf-p-8 wpuf-shadow-sm">
                <SettingsNav
                    ia={ ia }
                    activeTab={ activeTab }
                    onSelect={ handleSelectTab }
                    search={ search }
                    onSearch={ setSearch }
                />

                <div className="wpuf-min-w-0 wpuf-flex-1 wpuf-max-w-full wpuf-border-l wpuf-border-gray-200 wpuf-pl-8">
                    <h2 className="wpuf-mt-0 wpuf-mb-0 wpuf-text-2xl wpuf-font-bold wpuf-leading-7 wpuf-text-gray-900">
                        { currentTab ? currentTab.title : '' }
                    </h2>

                    {/* Figma: full-width divider under the tab title, 32px above + below. */}
                    <div className="wpuf-my-8 wpuf-border-b wpuf-border-gray-200" />

                    { currentTab && currentTab.notice ? (
                        <div className="wpuf-mb-8 wpuf-flex wpuf-items-start wpuf-gap-2 wpuf-rounded-md wpuf-border-l-4 wpuf-border-amber-400 wpuf-bg-amber-50 wpuf-px-4 wpuf-py-3 wpuf-text-sm wpuf-text-amber-700">
                            <svg className="wpuf-mt-0.5 wpuf-h-4 wpuf-w-4 wpuf-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.1c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            { currentTab.notice }
                        </div>
                    ) : null }

                    { currentTab && currentTab.subtabs && currentTab.sections.length > 1 ? (
                        <div className="wpuf-mb-8 wpuf-inline-flex wpuf-rounded-lg wpuf-bg-gray-100 wpuf-p-2">
                            { currentTab.sections.map( ( sid ) => {
                                const active = ( activeSub || currentTab.sections[ 0 ] ) === sid;
                                return (
                                    <button
                                        type="button"
                                        key={ sid }
                                        onClick={ () => setActiveSub( sid ) }
                                        className={ `wpuf-rounded-md wpuf-px-4 wpuf-py-2 wpuf-text-base wpuf-font-medium wpuf-transition ${
                                            active ? 'wpuf-bg-white wpuf-text-gray-900 wpuf-shadow-sm' : 'wpuf-text-gray-500 hover:wpuf-text-gray-700'
                                        }` }
                                    >
                                        { sectionTitle( sid ) }
                                    </button>
                                );
                            } ) }
                        </div>
                    ) : null }

                    { currentTab
                        ? ( currentTab.sections || [] )
                            .filter( ( sectionId ) =>
                                ! currentTab.subtabs || ( activeSub || currentTab.sections[ 0 ] ) === sectionId
                            )
                            .map( ( sectionId ) => (
                                <ErrorBoundary key={ sectionId }>
                                    <SettingsSection
                                        sectionId={ sectionId }
                                        tabTitle={ currentTab.subtabs ? null : currentTab.title }
                                    />
                                </ErrorBoundary>
                            ) )
                        : null }
                </div>
            </div>
            </div>
            ) }

            { ! isLoading && (
                <div
                    className="wpuf-settings-footer wpuf-z-40 wpuf-flex wpuf-items-center wpuf-justify-between wpuf-border-t wpuf-border-gray-200 wpuf-bg-white wpuf-px-[32px] wpuf-py-4 wpuf-shadow-[0_-1px_3px_rgba(0,0,0,0.06)]"
                    style={ { left: `${ footerLeft }px` } }
                >
                    <button
                        type="button"
                        disabled={ ! isDirty || isSaving }
                        onClick={ () => discard() }
                        className="wpuf-rounded-md wpuf-border !wpuf-border-gray-300 wpuf-bg-white wpuf-px-6 wpuf-py-2.5 wpuf-text-sm wpuf-font-medium wpuf-text-gray-700 hover:wpuf-bg-gray-50 disabled:wpuf-opacity-50"
                    >
                        { __( 'Cancel', 'wp-user-frontend' ) }
                    </button>
                    <div className="wpuf-flex wpuf-items-center wpuf-gap-3">
                        { isDirty ? (
                            <span className="wpuf-text-xs wpuf-text-gray-400">
                                { __( 'Unsaved changes', 'wp-user-frontend' ) }
                            </span>
                        ) : null }
                        <button
                            type="button"
                            disabled={ isSaving || ! isDirty }
                            onClick={ () => save() }
                            className="wpuf-rounded-md wpuf-bg-primary wpuf-px-8 wpuf-py-2.5 wpuf-text-sm wpuf-font-medium !wpuf-text-white hover:wpuf-bg-primaryHover disabled:wpuf-opacity-50"
                        >
                            { isSaving ? __( 'Saving…', 'wp-user-frontend' ) : __( 'Save', 'wp-user-frontend' ) }
                        </button>
                    </div>
                </div>
            ) }

            { pendingTab && (
                <UnsavedChanges
                    onDiscard={ handleDiscard }
                    onContinue={ () => setPendingTab( null ) }
                />
            ) }
        </div>
    );
};

const container = document.getElementById( 'wpuf-settings-root' );

if ( container ) {
    const root = createRoot( container );
    root.render( <SettingsApp /> );
}
