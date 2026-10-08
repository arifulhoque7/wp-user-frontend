import { useState, useMemo, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../store';
import { openProFieldAlert, openValidationAlert } from '../../common/BuilderDialogs';
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
        const proFieldMsg = ( data.i18n || {} ).pro_field_message || {};

        openProFieldAlert( title, proFieldMsg[ template ] );
    }, [ fieldSettings ] );

    const handleValidationAlert = useCallback( ( template ) => {
        const config = fieldSettings[ template ];

        if ( ! config || ! config.validator || ! config.validator.msg ) {
            return;
        }

        openValidationAlert( config.validator );
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

            <div className="mt-12 p-6 rounded-lg shadow-md text-center border border-gray-50">
                <h2 className="text-slate-600 text-xl font-bold mb-4">
                    { __( 'Got an idea for a new field?', 'wp-user-frontend' ) }
                </h2>
                <p className="text-slate-600 mb-6">
                    { __( 'We\'d love to hear it!', 'wp-user-frontend' ) }
                </p>
                <a
                    className="wpuf-btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://feedback.wedevs.com/b/user-frontend"
                >
                    { __( 'Share Your Idea', 'wp-user-frontend' ) }
                </a>
            </div>
        </div>
    );
}
