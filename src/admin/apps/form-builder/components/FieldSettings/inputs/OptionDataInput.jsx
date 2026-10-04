import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { STORE_NAME } from '../../../store';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RadioGroup, RadioGroupItem } from '@wedevs/plugin-ui';
import { Checkbox, TextInput } from '@wpuf/components';
import SettingHelpText from './SettingHelpText';

/**
 * Generate a random ID for option rows.
 */
function getRandomId() {
    return Math.floor( Math.random() * ( 9999999 - 999 + 1 ) ) + 999;
}

/**
 * One option row, draggable by its handle (develop sorted rows by
 * `.sort-handler`). `children` gets the props for the handle.
 */
function SortableOptionRow( { id, index, children } ) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable( { id: String( id ) } );

    return (
        <tr
            ref={ setNodeRef }
            style={ { transform: CSS.Translate.toString( transform ), transition } }
            data-index={ index }
            className="option-field-option flex justify-start items-center"
        >
            { children( { ...attributes, ...listeners } ) }
        </tr>
    );
}

/**
 * Option data input for select, radio, checkbox, multiselect fields.
 * Replaces Vue field-option-data component.
 *
 * Manages the list of options (label/value pairs), selected defaults,
 * show/sync value toggles, and AI generation.
 */
export default function OptionDataInput( { optionField, field } ) {
    const { updateField } = useDispatch( STORE_NAME );
    const i18n = useSelect( ( select ) => select( STORE_NAME ).getI18n(), [] );

    const isMultiple = !! optionField.is_multiple;

    // Local state for options list
    // State starts from the field, so opening the panel writes nothing.
    const [ options, setOptions ] = useState( () =>
        Object.entries( field.options || {} ).map( ( [ val, label ] ) => ( {
            label,
            value: val,
            id: getRandomId(),
        } ) )
    );
    const [ selected, setSelected ] = useState( () => {
        const fieldSelected = field.selected;

        if ( isMultiple && ! Array.isArray( fieldSelected ) ) {
            return fieldSelected ? [ fieldSelected ] : [];
        }

        return fieldSelected || ( isMultiple ? [] : '' );
    } );
    const [ showValue, setShowValue ] = useState( false );
    const [ syncValue, setSyncValue ] = useState( true );

    // AI state
    const [ showAiModal, setShowAiModal ] = useState( false );
    const [ showAiConfigModal, setShowAiConfigModal ] = useState( false );
    const [ aiPrompt, setAiPrompt ] = useState( '' );
    const [ aiLoading, setAiLoading ] = useState( false );
    const [ aiError, setAiError ] = useState( '' );
    const [ aiGeneratedOptions, setAiGeneratedOptions ] = useState( [] );

    // Only an edit (new state object) is written back to the store.
    const initialOptions = useRef( options );
    const initialSelected = useRef( selected );

    // Sync options back to field store
    useEffect( () => {
        if ( options === initialOptions.current ) {
            return;
        }

        const optionsObj = {};
        for ( const opt of options ) {
            optionsObj[ '' + opt.value ] = opt.label;
        }
        updateField( field.id, 'options', optionsObj );
    }, [ options, field.id, updateField ] );

    // Sync selected back to field store
    useEffect( () => {
        if ( selected === initialSelected.current ) {
            return;
        }
        updateField( field.id, 'selected', selected );
    }, [ selected, field.id, updateField ] );

    const sensors = useSensors( useSensor( PointerSensor, { activationConstraint: { distance: 4 } } ) );

    const handleSortEnd = useCallback( ( { active, over } ) => {
        if ( ! over || active.id === over.id ) {
            return;
        }

        setOptions( ( current ) => arrayMove(
            current,
            current.findIndex( ( option ) => String( option.id ) === active.id ),
            current.findIndex( ( option ) => String( option.id ) === over.id )
        ) );
    }, [] );

    const addOption = useCallback( () => {
        const count = options.length;
        const newOpt = ( i18n.option || 'option' ) + '-' + ( count + 1 );
        setOptions( [ ...options, { label: newOpt, value: newOpt, id: getRandomId() } ] );
    }, [ options, i18n.option ] );

    const deleteOption = useCallback( ( index ) => {
        if ( options.length === 1 ) {
            if ( window.swal ) {
                window.swal( {
                    text: i18n.last_choice_warn_msg || __( 'You must have at least one option.', 'wp-user-frontend' ),
                    showCancelButton: false,
                    confirmButtonColor: '#46b450',
                } );
            }
            return;
        }
        const newOptions = [ ...options ];
        newOptions.splice( index, 1 );
        setOptions( newOptions );
    }, [ options, i18n.last_choice_warn_msg ] );

    const setOptionLabel = useCallback( ( index, label ) => {
        const newOptions = [ ...options ];
        newOptions[ index ] = { ...newOptions[ index ], label };
        if ( syncValue ) {
            newOptions[ index ].value = label.toLocaleLowerCase().replace( /\s/g, '_' );
        }
        setOptions( newOptions );
    }, [ options, syncValue ] );

    const setOptionValue = useCallback( ( index, value ) => {
        const newOptions = [ ...options ];
        newOptions[ index ] = { ...newOptions[ index ], value };
        setOptions( newOptions );
    }, [ options ] );

    const handleSelectedChange = useCallback( ( optValue, checked ) => {
        if ( isMultiple ) {
            if ( checked ) {
                setSelected( ( prev ) => [ ...prev, optValue ] );
            } else {
                setSelected( ( prev ) => prev.filter( ( v ) => v !== optValue ) );
            }
        } else {
            setSelected( optValue );
        }
    }, [ isMultiple ] );

    const clearSelection = useCallback( () => {
        setSelected( isMultiple ? [] : '' );
    }, [ isMultiple ] );

    // AI methods
    const openAiModal = useCallback( () => {
        if ( window.wpuf_form_builder && ! window.wpuf_form_builder.ai_configured ) {
            setShowAiConfigModal( true );
            return;
        }
        setShowAiModal( true );
        setAiPrompt( '' );
        setAiError( '' );
        setAiGeneratedOptions( [] );
    }, [] );

    const closeAiModal = useCallback( () => {
        setShowAiModal( false );
        setAiPrompt( '' );
        setAiError( '' );
        setAiGeneratedOptions( [] );
        setAiLoading( false );
    }, [] );

    const generateAiOptions = useCallback( () => {
        if ( ! aiPrompt.trim() ) {
            return;
        }

        setAiLoading( true );
        setAiError( '' );

        wp.ajax.post( 'wpuf_ai_generate_field_options', {
            prompt: aiPrompt,
            field_type: field.template,
            nonce: window.wpuf_form_builder?.nonce,
        } ).done( ( response ) => {
            const opts = response.options || ( response.data && response.data.options ) || [];
            if ( opts.length > 0 ) {
                setAiGeneratedOptions( opts.map( ( opt ) => ( {
                    label: opt.label || opt,
                    value: opt.value || opt,
                    selected: true,
                } ) ) );
            } else {
                setAiError( response.message || i18n.something_went_wrong || __( 'Something went wrong.', 'wp-user-frontend' ) );
            }
        } ).fail( ( error ) => {
            setAiError( error.message || i18n.something_went_wrong || __( 'Something went wrong.', 'wp-user-frontend' ) );
        } ).always( () => {
            setAiLoading( false );
        } );
    }, [ aiPrompt, field.template, i18n.something_went_wrong ] );

    const importAiOptions = useCallback( () => {
        const selectedOpts = aiGeneratedOptions.filter( ( opt ) => opt.selected );
        const newOptions = [
            ...options,
            ...selectedOpts.map( ( opt ) => ( {
                label: opt.label,
                value: opt.value,
                id: getRandomId(),
            } ) ),
        ];
        setOptions( newOptions );
        closeAiModal();
    }, [ aiGeneratedOptions, options, closeAiModal ] );

    const allAiSelected = aiGeneratedOptions.length > 0 && aiGeneratedOptions.every( ( opt ) => opt.selected );

    const toggleAllAi = useCallback( () => {
        const selectState = ! allAiSelected;
        setAiGeneratedOptions( ( prev ) => prev.map( ( opt ) => ( { ...opt, selected: selectState } ) ) );
    }, [ allAiSelected ] );

    if ( field.hide_option_data ) {
        return null;
    }

    return (
        <div className="panel-field-opt panel-field-opt-text">
            <div className="flex">
                <label className="wpuf-font-sm text-gray-700">
                    { optionField.title }
                    <SettingHelpText text={ optionField.help_text } />
                </label>
            </div>

            { /* Show/Sync value toggles */ }
            <div className="mt-2 flex">
                <Checkbox
                    id={ `wpuf-show-values-${ field.id }` }
                    data-value="show-values"
                    value={ showValue }
                    onChange={ setShowValue }
                    label={ __( 'Show values', 'wp-user-frontend' ) }
                />
                <span className="ml-8">
                    <Checkbox
                        id={ `wpuf-sync-values-${ field.id }` }
                        data-value="sync-values"
                        value={ syncValue }
                        onChange={ setSyncValue }
                        label={ __( 'Sync values', 'wp-user-frontend' ) }
                    />
                </span>
            </div>

            { /* Options table */ }
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 font-medium">
                            { __( 'Label & Values', 'wp-user-frontend' ) }
                        </span>
                        <button
                            type="button"
                            onClick={ openAiModal }
                            className="w-8 h-8 flex items-center justify-center rounded-lg shadow-xs hover:shadow-md border-0"
                            style={ { background: 'linear-gradient(135deg, #FFEE00 0%, #D500FF 28%, #0082FF 100%)' } }
                            title={ __( 'AI Generate Options', 'wp-user-frontend' ) }
                        >
                            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.17766 13.2532L7.5 15.625L6.82234 13.2532C6.4664 12.0074 5.4926 11.0336 4.24682 10.6777L1.875 10L4.24683 9.32234C5.4926 8.9664 6.4664 7.9926 6.82234 6.74682L7.5 4.375L8.17766 6.74683C8.5336 7.9926 9.5074 8.9664 10.7532 9.32234L13.125 10L10.7532 10.6777C9.5074 11.0336 8.5336 12.0074 8.17766 13.2532Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M15.2157 7.26211L15 8.125L14.7843 7.26212C14.5324 6.25444 13.7456 5.46764 12.7379 5.21572L11.875 5L12.7379 4.78428C13.7456 4.53236 14.5324 3.74556 14.7843 2.73789L15 1.875L15.2157 2.73788C15.4676 3.74556 16.2544 4.53236 17.2621 4.78428L18.125 5L17.2621 5.21572C16.2544 5.46764 15.4676 6.25444 15.2157 7.26211Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14.0785 17.1394L13.75 18.125L13.4215 17.1394C13.2348 16.5795 12.7955 16.1402 12.2356 15.9535L11.25 15.625L12.2356 15.2965C12.7955 15.1098 13.2348 14.6705 13.4215 14.1106L13.75 13.125L14.0785 14.1106C14.2652 14.6705 14.7045 15.1098 15.2644 15.2965L16.25 15.625L15.2644 15.9535C14.7045 16.1402 14.2652 16.5795 14.0785 17.1394Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    { /* Bulk Add — pro can replace via filter, free shows teaser */ }
                    { applyFilters( 'wpuf.formBuilder.optionDataBulkAdd', null, options, setOptions, syncValue ) || (
                        <a
                            href={ ( window.wpuf_form_builder || {} ).pro_link || '' }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative inline-block group/pro-button"
                        >
                            <button
                                type="button"
                                className="inline-flex items-center gap-x-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer border-0"
                                title={ __( 'Available in Pro Version', 'wp-user-frontend' ) }
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                                { __( 'Bulk Add', 'wp-user-frontend' ) }
                            </button>
                            <div className="absolute top-0 right-0 opacity-0 group-hover/pro-button:opacity-100 wpuf-transition-all pointer-events-none">
                                <img src={ `${ ( window.wpuf_form_builder || {} ).asset_url || '' }/images/pro-badge.svg` } alt="" />
                            </div>
                        </a>
                    ) }
                </div>

                <DndContext sensors={ sensors } collisionDetection={ closestCenter } onDragEnd={ handleSortEnd }>
                    <SortableContext items={ options.map( ( option ) => String( option.id ) ) } strategy={ verticalListSortingStrategy }>
                        { /* One radio group for the default choice of a single-choice field
                             (each row holds one RadioGroupItem); checkboxes stand alone. */ }
                        <RadioGroup
                            render={ <table className="option-field-option-chooser" /> }
                            value={ isMultiple ? undefined : ( 'string' === typeof selected ? selected : '' ) }
                            onValueChange={ ( next ) => ! isMultiple && handleSelectedChange( next, true ) }
                        >
                            <tbody>
                                { options.map( ( option, index ) => (
                                    <SortableOptionRow key={ option.id } id={ option.id } index={ index }>
                                        { ( handleProps ) => ( <>
                                            <td className="flex items-center">
                                                { isMultiple ? (
                                                    <Checkbox
                                                        data-value={ option.value }
                                                        aria-label={ option.label }
                                                        value={ Array.isArray( selected ) && selected.includes( option.value ) }
                                                        onChange={ ( on ) => handleSelectedChange( option.value, on ) }
                                                    />
                                                ) : (
                                                    <RadioGroupItem
                                                        value={ option.value }
                                                        data-value={ option.value }
                                                        aria-label={ option.label }
                                                        className="border-gray-300 data-checked:border-primary data-checked:bg-primary text-white cursor-pointer"
                                                    />
                                                ) }
                                                <i className="fa fa-bars sort-handler hover:cursor-move! text-gray-400 ml-1" { ...handleProps } />
                                            </td>
                                            <td>
                                                <TextInput
                                                    className="w-full"
                                                    value={ option.label }
                                                    aria-label={ __( 'Label', 'wp-user-frontend' ) }
                                                    onChange={ ( next ) => setOptionLabel( index, next ) }
                                                />
                                            </td>
                                            { showValue && (
                                                <td>
                                                    <TextInput
                                                        className="w-full"
                                                        value={ option.value }
                                                        aria-label={ __( 'Value', 'wp-user-frontend' ) }
                                                        onChange={ ( next ) => setOptionValue( index, next ) }
                                                    />
                                                </td>
                                            ) }
                                            <td>
                                                <div className="flex ml-2">
                                                    <div
                                                        onClick={ () => deleteOption( index ) }
                                                        className="action-buttons hover:cursor-pointer"
                                                        role="button"
                                                        tabIndex={ 0 }
                                                        onKeyDown={ ( e ) => e.key === 'Enter' && deleteOption( index ) }
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 border rounded-2xl border-gray-400 hover:border-primary p-1">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                                                        </svg>
                                                    </div>
                                                    { index === options.length - 1 && (
                                                        <div
                                                            onClick={ addOption }
                                                            className="plus-buttons hover:cursor-pointer border-0!"
                                                            role="button"
                                                            tabIndex={ 0 }
                                                            onKeyDown={ ( e ) => e.key === 'Enter' && addOption() }
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="ml-1 size-6 border rounded-2xl border-gray-400 p-1">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                            </svg>
                                                        </div>
                                                    ) }
                                                </div>
                                            </td>
                                        </> ) }
                                    </SortableOptionRow>
                                ) ) }
                            </tbody>
                        </RadioGroup>
                    </SortableContext>
                </DndContext>
            </div>

            { /* Clear selection link for radio/select */ }
            { ! isMultiple && selected && (
                <a
                    className="inline-flex items-center gap-x-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:text-gray-700 hover:bg-gray-50 ring-1 ring-inset ring-gray-300 mt-4"
                    href="#clear"
                    onClick={ ( e ) => {
                        e.preventDefault();
                        clearSelection();
                    } }
                >
                    { __( 'Clear Selection', 'wp-user-frontend' ) }
                </a>
            ) }

            { /* AI Generate Options Modal */ }
            { showAiModal && (
                <div className="wpuf-ai-modal-overlay" onClick={ closeAiModal }>
                    <div className="wpuf-ai-modal" onClick={ ( e ) => e.stopPropagation() }>
                        <div className="wpuf-ai-modal-header">
                            <h3>{ __( 'AI Generate Options', 'wp-user-frontend' ) }</h3>
                            <button type="button" onClick={ closeAiModal } className="wpuf-ai-modal-close">&times;</button>
                        </div>
                        <div className="wpuf-ai-modal-body">
                            <label className="block mb-2 text-sm font-medium">
                                { __( 'Describe the options you need', 'wp-user-frontend' ) }
                            </label>
                            <textarea
                                value={ aiPrompt }
                                onChange={ ( e ) => setAiPrompt( e.target.value ) }
                                rows="3"
                                className="w-full px-3 py-2 border rounded-sm"
                                placeholder={ __( 'e.g., List of US states, Business categories, Job titles', 'wp-user-frontend' ) }
                            />
                            { aiError && (
                                <div className="mt-2 text-sm text-red-600">{ aiError }</div>
                            ) }
                            { aiGeneratedOptions.length > 0 && (
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">
                                            { __( 'Generated Options', 'wp-user-frontend' ) }
                                        </span>
                                        <button type="button" onClick={ toggleAllAi } className="text-sm text-primary hover:underline">
                                            { allAiSelected
                                                ? __( 'Deselect All', 'wp-user-frontend' )
                                                : __( 'Select All', 'wp-user-frontend' ) }
                                        </button>
                                    </div>
                                    <div className="wpuf-ai-options-list">
                                        { aiGeneratedOptions.map( ( opt, idx ) => (
                                            <div key={ idx } className="py-1 hover:bg-gray-50 rounded-sm px-2">
                                                <Checkbox
                                                    id={ `wpuf-ai-option-${ field.id }-${ idx }` }
                                                    value={ !! opt.selected }
                                                    onChange={ ( on ) => {
                                                        setAiGeneratedOptions( ( prev ) => {
                                                            const next = [ ...prev ];
                                                            next[ idx ] = { ...next[ idx ], selected: on };
                                                            return next;
                                                        } );
                                                    } }
                                                    label={ opt.label }
                                                />
                                            </div>
                                        ) ) }
                                    </div>
                                </div>
                            ) }
                        </div>
                        <div className="wpuf-ai-modal-footer">
                            <button type="button" onClick={ closeAiModal } className="wpuf-btn wpuf-btn-secondary">
                                { __( 'Cancel', 'wp-user-frontend' ) }
                            </button>
                            { aiGeneratedOptions.length === 0 ? (
                                <button
                                    type="button"
                                    onClick={ generateAiOptions }
                                    disabled={ aiLoading || ! aiPrompt }
                                    className="rounded-md text-center bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:from-purple-700 hover:to-blue-700 hover:text-white inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed border-0"
                                >
                                    { aiLoading && <i className="fa fa-spinner fa-spin mr-1" /> }
                                    { aiLoading
                                        ? __( 'Generating...', 'wp-user-frontend' )
                                        : __( 'Generate', 'wp-user-frontend' ) }
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={ importAiOptions }
                                    className="rounded-md text-center bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:from-purple-700 hover:to-blue-700 hover:text-white inline-flex items-center border-0"
                                >
                                    { __( 'Import Selected', 'wp-user-frontend' ) }
                                </button>
                            ) }
                        </div>
                    </div>
                </div>
            ) }

            { /* AI Provider Config Modal */ }
            { showAiConfigModal && (
                <div className="fixed top-0 left-0 w-screen h-screen bg-black/50 z-[1000000] flex items-center justify-center">
                    <div className="bg-white rounded-md p-8 max-w-xl w-full mx-5 relative">
                        <div className="flex justify-center mb-8">
                            <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="110" height="110" rx="55" fill="#D1FAE5" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M60 41C55.0294 41 51 45.0294 51 50C51 50.525 51.0451 51.0402 51.1317 51.5419C51.2213 52.0604 51.089 52.4967 50.8369 52.7489L42.1716 61.4142C41.4214 62.1644 41 63.1818 41 64.2426V68C41 68.5523 41.4477 69 42 69H47C47.5523 69 48 68.5523 48 68V66H50C50.5523 66 51 65.5523 51 65V63H53C53.2652 63 53.5196 62.8946 53.7071 62.7071L57.2511 59.1631C57.5033 58.911 57.9396 58.7787 58.4581 58.8683C58.9598 58.9549 59.475 59 60 59C64.9706 59 69 54.9706 69 50C69 45.0294 64.9706 41 60 41ZM60 45C59.4477 45 59 45.4477 59 46C59 46.5523 59.4477 47 60 47C61.6569 47 63 48.3431 63 50C63 50.5523 63.4477 51 64 51C64.5523 51 65 50.5523 65 50C65 47.2386 62.7614 45 60 45Z" fill="#065F46" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-medium text-center text-gray-900 mb-4">
                            { __( 'AI Provider Not Configured', 'wp-user-frontend' ) }
                        </h2>
                        <p className="text-lg text-center text-gray-400 mb-16">
                            { __( 'To use AI Form Generation, please connect an AI provider by adding your API key in the settings', 'wp-user-frontend' ) }
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={ () => setShowAiConfigModal( false ) }
                                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-lg transition-colors min-w-btn-cancel"
                            >
                                { __( 'Cancel', 'wp-user-frontend' ) }
                            </button>
                            <button
                                type="button"
                                onClick={ () => {
                                    window.location.href = window.wpuf_form_builder?.ai_settings_url || '';
                                } }
                                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-lg transition-colors min-w-btn-save"
                            >
                                { __( 'Go to Settings', 'wp-user-frontend' ) }
                            </button>
                        </div>
                    </div>
                </div>
            ) }
        </div>
    );
}
