/**
 * FormsList component — main orchestrator for the forms list page.
 *
 * @since WPUF_SINCE
 */
import { useState, useEffect, useCallback, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { ErrorState, Pagination, Tabs, notify, useConfirm } from '@wpuf/components';

import useFormsFetch, { PER_PAGE } from '../hooks/useFormsFetch';
import useClipboard from '../hooks/useClipboard';

import SearchBar from './SearchBar';
import SelectionBar from './SelectionBar';
import FormsTable from './FormsTable';
import TableSkeleton from './TableSkeleton';
import EmptyState from './EmptyState';
import CreateButtons from './CreateButtons';
import AIConfigModal from './AIConfigModal';

const FormsList = ( {
    postType = 'wpuf_forms',
    formType = 'post',
    pageSlug = 'wpuf-post-forms',
    pageTitle = 'Post Forms',
} ) => {
    const filteredPageTitle = applyFilters( 'wpuf.formsList.pageTitle', pageTitle, formType );
    // Pro hides the AI entry on the registration list when the free AI handler is missing.
    const aiFormBuilderAvailable = applyFilters( 'wpuf.formsList.aiFormBuilderAvailable', true, formType );

    const isPlainPermalink = wpuf_forms_list.is_plain_permalink;
    const permalinkUrl = wpuf_forms_list.permalink_settings_url;
    const aiConfigured = wpuf_forms_list.ai_configured || false;
    const aiSettingsUrl = wpuf_forms_list.ai_settings_url || '';
    const postCounts = wpuf_forms_list.post_counts || {};

    const newFormUrl = window.wpuf_admin_script.admin_url + 'admin.php?page=wpuf-' + formType + '-forms&action=add-new';

    const { forms, loading, error, pagination, fetchForms } = useFormsFetch( { postType } );
    const { copiedKey, copyToClipboard } = useClipboard();
    const [ confirm, confirmDialog ] = useConfirm();

    const [ currentTab, setCurrentTab ] = useState( 'any' );
    const [ searchTerm, setSearchTerm ] = useState( '' );
    const [ selectedForms, setSelectedForms ] = useState( [] );
    const [ perPage, setPerPage ] = useState( PER_PAGE );
    const [ showAIConfigModal, setShowAIConfigModal ] = useState( false );

    const debounceTimerRef = useRef( null );

    // Fetch on mount and whenever the tab or the page size changes (page 1, current search).
    useEffect( () => {
        fetchForms( 1, currentTab, searchTerm, perPage );
    }, [ currentTab, perPage ] );

    // Debounced search
    const handleSearchChange = useCallback( ( value ) => {
        setSearchTerm( value );

        if ( debounceTimerRef.current ) {
            clearTimeout( debounceTimerRef.current );
        }

        debounceTimerRef.current = setTimeout( () => {
            fetchForms( 1, currentTab, value, perPage );
        }, 500 );
    }, [ currentTab, perPage, fetchForms ] );

    // Cleanup debounce timer on unmount
    useEffect( () => {
        return () => {
            if ( debounceTimerRef.current ) {
                clearTimeout( debounceTimerRef.current );
            }
        };
    }, [] );

    // A new page of rows clears the selection.
    useEffect( () => {
        setSelectedForms( [] );
    }, [ forms ] );

    const selectAllChecked = forms.length > 0 && selectedForms.length === forms.length;

    const handleSelectAll = useCallback( () => {
        setSelectedForms( selectAllChecked ? [] : forms.map( ( form ) => form.ID ) );
    }, [ selectAllChecked, forms ] );

    const handleSelectForm = useCallback( ( formId ) => {
        setSelectedForms( ( prev ) => {
            if ( prev.includes( formId ) ) {
                return prev.filter( ( id ) => id !== formId );
            }
            return [ ...prev, formId ];
        } );
    }, [] );

    const handlePageChange = useCallback( ( page ) => {
        fetchForms( page, currentTab, searchTerm, perPage );
    }, [ currentTab, searchTerm, perPage, fetchForms ] );

    const retry = useCallback( () => {
        fetchForms( pagination.current_page, currentTab, searchTerm, perPage );
    }, [ pagination, currentTab, searchTerm, perPage, fetchForms ] );

    // Build admin URL helper (the row actions are the server's nonce-checked
    // list actions, as on develop: they redirect back with a notice).
    const buildAdminUrl = useCallback( ( formId, action ) => {
        const params = new URLSearchParams( {
            page: pageSlug,
            id: formId.toString(),
            action,
        } );

        if ( action !== 'edit' ) {
            params.append( '_wpnonce', wpuf_forms_list.bulk_nonce );
        }

        return `${ window.wpuf_admin_script.admin_url }admin.php?${ params.toString() }`;
    }, [ pageSlug ] );

    const editUrl = useCallback( ( formId ) => buildAdminUrl( formId, 'edit' ), [ buildAdminUrl ] );

    // Row action handler
    const handleAction = useCallback( async ( action, form ) => {
        if ( 'delete' === action ) {
            const ok = await confirm( {
                title: __( 'Delete Permanently', 'wp-user-frontend' ),
                message: __( 'Are you sure you want to delete this form permanently? This action cannot be undone.', 'wp-user-frontend' ),
                confirmText: __( 'Delete Permanently', 'wp-user-frontend' ),
            } );

            if ( ! ok ) {
                return;
            }
        }

        window.location.href = buildAdminUrl( form.ID, action );
    }, [ buildAdminUrl, confirm ] );

    // Bulk action handler (develop's bulk request to the server list action)
    const handleBulkAction = useCallback( async ( bulkAction ) => {
        if ( ! bulkAction || selectedForms.length === 0 ) {
            return;
        }

        if ( 'delete' === bulkAction ) {
            const ok = await confirm( {
                title: __( 'Delete Permanently', 'wp-user-frontend' ),
                message: __( 'Are you sure you want to delete the selected forms permanently? This action cannot be undone.', 'wp-user-frontend' ),
                confirmText: __( 'Delete Permanently', 'wp-user-frontend' ),
            } );

            if ( ! ok ) {
                return;
            }
        }

        const params = new URLSearchParams( {
            page: pageSlug,
            _wpnonce: wpuf_forms_list.bulk_nonce,
            _wp_http_referer: window.location.href,
            action: bulkAction,
            action2: bulkAction,
            bulk_action: 'Apply',
            paged: pagination.current_page.toString(),
        } );

        if ( searchTerm ) {
            params.append( 's', searchTerm );
        }

        if ( currentTab === 'trash' ) {
            params.append( 'post_status', 'trash' );
        }

        selectedForms.forEach( ( formId ) => {
            params.append( 'post[]', formId.toString() );
        } );

        window.location.href = `${ window.wpuf_admin_script.admin_url }admin.php?${ params.toString() }`;
    }, [ selectedForms, pageSlug, searchTerm, currentTab, pagination, confirm ] );

    // Open the templates modal (PHP template part, legacy jQuery).
    const openModal = useCallback( ( event ) => {
        event?.preventDefault();

        const $ = window.jQuery;
        const $modal = $ ? $( '.wpuf-form-template-modal' ) : null;

        if ( ! $modal || ! $modal.length ) {
            window.location.href = newFormUrl;
            return;
        }

        $modal.show().removeClass( 'wpuf-hidden' );
        $modal[ 0 ].offsetHeight; // eslint-disable-line no-unused-expressions

        setTimeout( function () {
            $modal.addClass( 'wpuf-modal-show' );
        }, 10 );

        $( 'body' ).addClass( 'wpuf-modal-open' );
        $( 'body' ).css( 'overflow', 'hidden' );
        $( '#wpbody-content .wrap' ).hide();
    }, [ newFormUrl ] );

    // AI Form Builder handler
    const openAIFormBuilder = useCallback( ( event ) => {
        event?.preventDefault();

        if ( ! aiConfigured ) {
            setShowAIConfigModal( true );
            return;
        }

        const action = formType === 'profile' ? 'wpuf_profile_form_template' : 'post_form_template';

        const params = new URLSearchParams( {
            action,
            template: 'ai_form',
            _wpnonce: wpuf_forms_list.template_nonce,
        } );

        window.location.href = window.wpuf_admin_script.admin_url + 'admin.php?' + params.toString();
    }, [ aiConfigured, formType ] );

    // Shortcode getter with Pro filter
    const getShortcode = useCallback( ( formId ) => {
        const shortcode = `[wpuf_form id="${ formId }"]`;
        return applyFilters( 'wpuf.formsList.getShortcode', shortcode, formId, formType );
    }, [ formType ] );

    // Copy shortcode handler (develop failed silently, e.g. on plain http)
    const handleCopyShortcode = useCallback( ( text, key ) => {
        copyToClipboard( text, key ).catch( () => {
            notify( __( 'Could not copy the shortcode. Please copy it manually.', 'wp-user-frontend' ), 'error' );
        } );
    }, [ copyToClipboard ] );

    // Menu items based on current tab (develop items)
    const menuItems = useMemo( () => {
        if ( currentTab === 'trash' ) {
            return [
                { key: 'restore', label: __( 'Restore', 'wp-user-frontend' ) },
                { key: 'delete', label: __( 'Delete Permanently', 'wp-user-frontend' ), destructive: true },
            ];
        }

        return [
            { key: 'edit', label: __( 'Edit', 'wp-user-frontend' ) },
            { key: 'duplicate', label: __( 'Duplicate', 'wp-user-frontend' ) },
            { key: 'trash', label: __( 'Trash', 'wp-user-frontend' ), destructive: true },
        ];
    }, [ currentTab ] );

    const tabs = Object.entries( postCounts ).map( ( [ key, value ] ) => ( {
        id: key === 'all' ? 'any' : key,
        label: value.label,
        count: value.count,
    } ) );

    // Determine empty state type
    const getEmptyStateType = () => {
        if ( searchTerm !== '' ) {
            return 'search';
        }
        if ( currentTab === 'any' ) {
            return 'empty';
        }
        return 'tab-empty';
    };

    const aiHandler = aiFormBuilderAvailable ? openAIFormBuilder : null;

    let content;

    if ( loading ) {
        content = <TableSkeleton />;
    } else if ( error ) {
        content = (
            <ErrorState
                title={ __( 'Could not load the forms', 'wp-user-frontend' ) }
                message={ error.message }
                onRetry={ retry }
            />
        );
    } else if ( forms.length === 0 ) {
        content = <EmptyState type={ getEmptyStateType() } onAddNew={ openModal } onAIFormBuilder={ aiHandler } />;
    } else {
        content = (
            <>
                <FormsTable
                    forms={ forms }
                    selectedForms={ selectedForms }
                    selectAllChecked={ selectAllChecked }
                    onSelectAll={ handleSelectAll }
                    onSelectForm={ handleSelectForm }
                    onAction={ handleAction }
                    editUrl={ editUrl }
                    postType={ postType }
                    formType={ formType }
                    getShortcode={ getShortcode }
                    copiedKey={ copiedKey }
                    onCopyShortcode={ handleCopyShortcode }
                    menuItems={ menuItems }
                />

                <Pagination
                    variant="footer"
                    currentPage={ pagination.current_page }
                    total={ pagination.total_items }
                    perPage={ pagination.per_page }
                    onPageChange={ handlePageChange }
                    onPerPageChange={ setPerPage }
                />
            </>
        );
    }

    return (
        <div>
            { /* Permalink Notice */ }
            { isPlainPermalink && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-6">
                    <div className="flex">
                        <div className="shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                { __( 'WordPress REST API Issue Detected', 'wp-user-frontend' ) }
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                    { __( 'Your WordPress permalinks are set to "Plain" which may cause issues with fetching the forms. For better functionality, please consider changing your permalink structure.', 'wp-user-frontend' ) }
                                </p>
                            </div>
                            <div className="mt-4">
                                <div className="flex">
                                    <a
                                        href={ permalinkUrl }
                                        className="bg-yellow-50 text-yellow-800 rounded-md border border-yellow-300 px-3 py-2 text-sm font-medium hover:bg-yellow-100 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                    >
                                        { __( 'Go to Permalink Settings', 'wp-user-frontend' ) }
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) }

            { /* Page title and action buttons */ }
            <div className="flex justify-between items-center mt-9">
                <h3 className="text-2xl font-bold m-0 p-0 leading-none">
                    { filteredPageTitle }
                </h3>
                <CreateButtons onAddNew={ openModal } onAIFormBuilder={ aiHandler } />
            </div>

            { /* List card (FlyHR): toolbar with status tabs + search, selection
                 bar, table or state, footer pagination. */ }
            <div className="mt-9 rounded-[10px] border border-solid border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-0 border-b border-solid border-gray-200 px-4 pt-3 pb-2">
                    <Tabs
                        variant="toolbar"
                        tabs={ tabs }
                        value={ currentTab }
                        onChange={ setCurrentTab }
                        label={ __( 'Form status', 'wp-user-frontend' ) }
                    />
                    <SearchBar
                        value={ searchTerm }
                        onChange={ handleSearchChange }
                    />
                </div>

                { selectedForms.length > 0 && (
                    <SelectionBar
                        count={ selectedForms.length }
                        currentTab={ currentTab }
                        onAction={ handleBulkAction }
                        onClear={ () => setSelectedForms( [] ) }
                    />
                ) }

                { content }
            </div>

            <AIConfigModal
                isOpen={ showAIConfigModal }
                onClose={ () => setShowAIConfigModal( false ) }
                onGoToSettings={ () => {
                    window.location.href = aiSettingsUrl;
                } }
            />

            { confirmDialog }
        </div>
    );
};

export default FormsList;
