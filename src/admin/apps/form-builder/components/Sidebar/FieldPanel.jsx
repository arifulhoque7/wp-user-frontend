import { useState, useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../store';
import { warn } from '../../utils/globalHelpers';
import { filterPanelSections } from '../../extensions/hooks';
import useAddField from '../../hooks/useAddField';
import FieldSearch from './FieldSearch';
import FieldGroup from './FieldGroup';
import FieldItem from './FieldItem';

export default function FieldPanel() {
    const { panelSections, fieldSettings } = useSelect( ( select ) => {
        const store = select( STORE_NAME );
        return {
            panelSections: store.getPanelSections(),
            fieldSettings: store.getFieldSettings(),
        };
    }, [] );

    const [ searchTerm, setSearchTerm ] = useState( '' );

    const data = window.wpuf_form_builder || {};

    // Filter sections by search term
    const filteredSections = useMemo( () => {
        let sections = filterPanelSections( panelSections );

        if ( ! searchTerm ) {
            return sections;
        }

        const term = searchTerm.toLowerCase();
        const matchedFields = Object.keys( fieldSettings ).filter( ( key ) =>
            fieldSettings[ key ].title && fieldSettings[ key ].title.toLowerCase().includes( term )
        );

        return sections.map( ( section ) => ( {
            ...section,
            fields: section.fields.filter( ( field ) => matchedFields.includes( field ) ),
        } ) );
    }, [ panelSections, fieldSettings, searchTerm ] );

    const handleAddField = useAddField();

    const handleProAlert = useCallback( ( template ) => {
        const config = fieldSettings[ template ];
        const title = config ? config.title : template;

        if ( typeof window.Swal === 'undefined' ) {
            return;
        }

        const i18n = data.i18n || {};
        const proFieldMsg = i18n.pro_field_message || {};
        const fieldMsg = proFieldMsg[ template ];

        if ( fieldMsg ) {
            let iconHtml = '';

            if ( fieldMsg.asset_type === 'image' ) {
                iconHtml = `<img src="${ fieldMsg.asset_url }" alt="${ template }" loading="lazy" onload="this.closest('div').classList.add('wpuf-is-loaded')">`;
            } else if ( fieldMsg.asset_type === 'video' ) {
                iconHtml = `<iframe onload="this.closest('div').classList.add('wpuf-is-loaded')" class="w-full" src="${ fieldMsg.asset_url }" title="${ template }" frameborder="0" allowfullscreen></iframe>`;
            }

            const html = `<div class="flex text-left">
                <div class="w-1/2">
                    <img src="${ data.lock_icon || '' }" alt="">
                    <h2 class="text-black"><span class="text-primary">${ title } </span>${ i18n.is_a_pro_feature || '' }</h2>
                    <p>${ i18n.pro_feature_msg || '' }</p>
                </div>
                <div class="w-1/2">
                    <div class="wpuf-icon-container flex justify-center items-center">
                        ${ iconHtml }
                        <div class="wpuf-shimmer"></div>
                    </div>
                </div>
            </div>`;

            window.Swal.fire( {
                html,
                showCloseButton: true,
                customClass: {
                    confirmButton: 'flex! focus:shadow-none!',
                    closeButton: 'absolute',
                },
                width: '50rem',
                padding: '1.5rem',
                confirmButtonColor: '#059669',
                confirmButtonText: i18n.upgrade_to_pro || 'Upgrade to PRO',
            } ).then( ( result ) => {
                if ( result.isConfirmed ) {
                    window.open( data.pro_link || '', '_blank' );
                }
            } );
        } else {
            window.Swal.fire( {
                html: i18n.pro_feature_msg || '',
                showCloseButton: true,
                customClass: {
                    confirmButton: 'flex! focus:shadow-none!',
                    closeButton: 'absolute',
                },
                width: '40rem',
                padding: '2rem 3rem',
                title: '<span class="text-primary">' + title + '</span> ' + ( i18n.is_a_pro_feature || '' ),
                imageUrl: data.lock_icon || '',
                confirmButtonColor: '#059669',
                confirmButtonText: i18n.upgrade_to_pro || 'Upgrade to PRO',
            } ).then( ( result ) => {
                if ( result.isConfirmed ) {
                    window.open( data.pro_link || '', '_blank' );
                }
            } );
        }
    }, [ fieldSettings ] );

    const handleValidationAlert = useCallback( ( template ) => {
        const config = fieldSettings[ template ];

        if ( ! config || ! config.validator || ! config.validator.msg ) {
            return;
        }

        const validator = config.validator;
        const i18n = data.i18n || {};

        warn( {
            title: validator.msg_title || '',
            color: validator.color || '#059669',
            html: validator.msg,
            showCancelButton: true,
            imageUrl: validator.icon || '',
            confirmButtonText: validator.cta || '',
            cancelButtonText: i18n.ok || __( 'OK', 'wp-user-frontend' ),
            showCloseButton: true,
            width: '40rem',
            padding: '2rem 3rem',
            customClass: {
                confirmButton: 'bg-white! text-gray-700! focus:shadow-none! p-0! hover:bg-none!',
                closeButton: 'absolute top-4 right-4',
                cancelButton: 'bg-primary! text-white!',
            },
        } );
    }, [ fieldSettings ] );

    return (
        <div>
            <FieldSearch onSearch={ setSearchTerm } />
            <div className="wpuf-form-builder-form-fields mt-4">
                { filteredSections.map( ( section, index ) => (
                    <FieldGroup key={ section.id } section={ section } index={ index }>
                        { section.fields.map( ( template ) => (
                            <FieldItem
                                key={ template }
                                template={ template }
                                onAdd={ handleAddField }
                                onProAlert={ handleProAlert }
                                onValidationAlert={ handleValidationAlert }
                            />
                        ) ) }
                    </FieldGroup>
                ) ) }
            </div>
        </div>
    );
}
