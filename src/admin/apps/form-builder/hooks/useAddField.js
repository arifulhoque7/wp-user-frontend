import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { STORE_NAME } from '../store';
import { createField, isFieldSingleInstance, containsField } from '../utils/fieldUtils';

const isProfilePage = window.location.search.includes( 'page=wpuf-profile-forms' );

// "Don't show again" for the custom field tooltip lasts for the page, shared by
// every place that adds a field (palette click, stage drop).
const tooltipState = { enabled: true };

/**
 * Add a palette field to the form: single-instance check, new field, insert
 * position and the custom field tooltip. Used by the palette (click) and the
 * stage (drop at a position).
 *
 * @return {Function} `( template, dropIndex? ) => void`
 */
export default function useAddField() {
    const { fieldSettings, formFields, indexToInsert } = useSelect( ( select ) => {
        const store = select( STORE_NAME );
        return {
            fieldSettings: store.getFieldSettings(),
            formFields: store.getFormFields(),
            indexToInsert: store.getIndexToInsert(),
        };
    }, [] );

    const { addField, setIndexToInsert, openFieldSettings } = useDispatch( STORE_NAME );

    const data = window.wpuf_form_builder || {};
    const singleObjects = data.wpuf_single_objects || [];

    const showTooltip = useCallback( ( field ) => {
        if ( typeof window.Swal === 'undefined' ) {
            return;
        }

        const adminScript = window.wpuf_admin_script || {};
        const adminAssetUrl = adminScript.asset_url || data.asset_url || '';
        const imageOne = adminAssetUrl + '/images/custom-fields/settings.png';
        const imageTwo = adminAssetUrl + '/images/custom-fields/advance.png';
        const settingsUrl = ( window.ajaxurl || '' ).replace( 'admin-ajax.php', '' ) + 'admin.php?page=wpuf-settings#wpuf_frontend_posting';
        const fieldId = field.id;

        const html = '<div class="wpuf-custom-field-instruction">' +
            '<div class="step-one">' +
            sprintf(
                '<p class="text-base">%s <a href="%s" target="_blank" class="text-primary font-bold">%s</a>%s"</p>',
                __( 'Navigate through', 'wp-user-frontend' ),
                settingsUrl,
                __( 'WP-admin > WPUF > Settings > Frontend Posting', 'wp-user-frontend' ),
                __( '- there you have to check the checkbox: "Show custom field data in the post content area', 'wp-user-frontend' )
            ) +
            '<img src="' + imageOne + '" alt="settings" class="rounded-md">' +
            '</div>' +
            '<div class="step-two">' +
            sprintf(
                '<p class="text-base">%s<button type="button" class="text-primary wpuf-swal-action-link font-bold" data-action="open-advanced-options" data-field-id="%s">%s</button>%s<button type="button" class="text-primary wpuf-swal-action-link font-bold" data-action="open-advanced-options" data-field-id="%s">%s</button>%s</p>',
                __( 'Edit the custom field inside the post form and on the right side you will see ', 'wp-user-frontend' ),
                fieldId,
                __( '"Advanced Options".', 'wp-user-frontend' ),
                __( ' Expand that, scroll down and you will see ', 'wp-user-frontend' ),
                fieldId,
                __( '"Show data on post"', 'wp-user-frontend' ),
                __( ' - set this yes.', 'wp-user-frontend' )
            ) +
            '<img src="' + imageTwo + '" alt="custom field data" class="rounded-md">' +
            '</div>' +
            '</div>';

        window.Swal.fire( {
            title: __( 'Do you want to show custom field data inside your post ?', 'wp-user-frontend' ),
            html,
            imageUrl: data.is_pro_active ? data.lock_icon : data.free_icon,
            showCancelButton: true,
            confirmButtonText: __( "Don't show again", 'wp-user-frontend' ),
            cancelButtonText: __( 'Okay', 'wp-user-frontend' ),
            customClass: {
                confirmButton: 'bg-white! text-black! border! border-solid! border-gray-300! focus:shadow-none!',
                cancelButton: 'text-white!',
            },
            cancelButtonColor: '#059669',
            didOpen: ( modal ) => {
                const buttons = modal.querySelectorAll( 'button.wpuf-swal-action-link[data-action="open-advanced-options"]' );

                buttons.forEach( ( btn ) => {
                    btn.addEventListener( 'click', ( e ) => {
                        e.preventDefault();
                        const fId = btn.getAttribute( 'data-field-id' );

                        window.Swal.close();

                        setTimeout( () => {
                            openFieldSettings( parseInt( fId, 10 ) );

                            setTimeout( () => {
                                const container = document.querySelector( 'div.wpuf-form-builder-field-options' );

                                if ( ! container ) {
                                    return;
                                }

                                const sections = container.querySelectorAll( '.option-fields-section' );
                                let targetSection = null;
                                let targetH3 = null;

                                sections.forEach( ( section ) => {
                                    const h3 = section.querySelector( 'h3' );

                                    if ( ! h3 ) {
                                        return;
                                    }

                                    const clone = h3.cloneNode( true );
                                    const icons = clone.querySelectorAll( 'i' );
                                    icons.forEach( ( i ) => i.remove() );
                                    const text = clone.textContent.trim().toLowerCase().replace( /\.$/, '' );

                                    if ( text === 'advanced options' ) {
                                        targetH3 = h3;
                                        targetSection = section;
                                    }
                                } );

                                if ( targetH3 ) {
                                    const contentDiv = targetSection.querySelector( '.option-field-section-fields' );

                                    if ( contentDiv && ! contentDiv.offsetParent ) {
                                        targetH3.click();
                                    }

                                    setTimeout( () => {
                                        targetSection.scrollIntoView( { behavior: 'smooth', block: 'nearest' } );
                                    }, 350 );
                                }
                            }, 650 );
                        }, 250 );
                    } );
                } );
            },
        } ).then( ( result ) => {
            if ( result.isConfirmed ) {
                tooltipState.enabled = false;
            }
        } );
    }, [ data, openFieldSettings ] );

    const handleAddField = useCallback( ( template, dropIndex ) => {
        // Single-instance check
        if ( isFieldSingleInstance( template, singleObjects ) && containsField( formFields, template ) ) {
            if ( typeof window.Swal !== 'undefined' ) {
                window.Swal.fire( {
                    title: '<span class="text-primary">Oops...</span>',
                    html: '<p class="text-gray-500 text-xl m-0 p-0">' + __( 'You already have this field in the form', 'wp-user-frontend' ) + '</p>',
                    imageUrl: ( data.asset_url || '' ) + '/images/oops.svg',
                    showCloseButton: true,
                    padding: '1rem',
                    width: '35rem',
                    customClass: {
                        confirmButton: 'flex! focus:shadow-none! bg-primary!',
                        closeButton: 'absolute',
                    },
                } );
            }
            return;
        }

        const field = createField( template, fieldSettings, formFields );

        if ( ! field ) {
            return;
        }

        // A click appends (or uses the pending insert index); a drop on the stage
        // passes its position, as develop's add_form_field did per event type.
        let insertAt = dropIndex;
        if ( undefined === insertAt ) {
            insertAt = indexToInsert === 0 ? formFields.length : indexToInsert;
        }
        addField( field, insertAt );
        setIndexToInsert( 0 );

        // Show custom field tooltip for meta fields (not on profile forms page)
        if ( ! isProfilePage && field.is_meta === 'yes' && tooltipState.enabled ) {
            showTooltip( field );
        }
    }, [ formFields, fieldSettings, indexToInsert, singleObjects, addField, setIndexToInsert, showTooltip ] );

    return handleAddField;
}
