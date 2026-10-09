/**
 * The builder's dialogs on the shared ConfirmDialog (they were SweetAlert2
 * popups), in develop's look: the "Oops..." alert, the custom field data
 * tooltip, the Pro field and Pro feature upsells, the missing API keys notice
 * and the hidden taxonomy fields notice. Each `open*()` returns a promise
 * that settles when the dialog closes.
 *
 * @since WPUF_SINCE
 */
import { __, sprintf } from '@wordpress/i18n';
import { ConfirmDialog, dialogs } from '@wpuf/components';
import { inApp } from '../../../app/client';
import { proMessageText } from '../utils/proMessage';

const builderData = () => window.wpuf_form_builder || {};

// Inline styles for content inside the dialogs: they render in a body-level
// portal, where the builder screen's own utility classes do not reach.
const PRIMARY = '#059669';
// Same scale as ConfirmDialog's message (16px gray-500, 8px under the title),
// one even 16px gap between the paragraphs and the screenshots.
const BODY = { margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 16, fontSize: 16, lineHeight: 1.5, color: '#6b7280', textAlign: 'center' };
const LINK = { border: 0, background: 'none', padding: 0, font: 'inherit', fontWeight: 700, color: PRIMARY, cursor: 'pointer' };
const IMAGE = { display: 'block', width: '100%', borderRadius: 8, border: '1px solid #e5e7eb', boxSizing: 'border-box' };

const proMessage = () => proMessageText( ( builderData().i18n || {} ).pro_feature_msg );

const assetUrl = () => ( window.wpuf_admin_script || {} ).asset_url || builderData().asset_url || '';

/**
 * Markup from the plugin's own PHP config (translated strings with links).
 *
 * @param {Object} props
 * @param {string} props.html        Markup.
 * @param {Object} [props.style]   Inline style.
 */
function Markup( { html, style } ) {
    // eslint-disable-next-line react/no-danger -- plugin-defined field config, as develop's popup showed it.
    return <span style={ style } dangerouslySetInnerHTML={ { __html: html || '' } } />;
}

/**
 * Develop's "Oops..." alert (single-instance fields, refused drops).
 *
 * @param {string} message Message.
 *
 * @return {Promise<boolean>} Settles on close.
 */
export function showOops( message ) {
    return dialogs.oops( message );
}

/**
 * "Do you want to show custom field data inside your post?" after a meta
 * field is added.
 *
 * @param {number} fieldId The added field.
 *
 * @return {Promise<string|Object|undefined>} 'hide' (don't show again), { advanced: fieldId } or undefined.
 */
export function openCustomFieldTooltip( fieldId ) {
    const data = builderData();
    const adminUrl = ( window.ajaxurl || '' ).replace( 'admin-ajax.php', '' );
    // In the admin app: the Settings route on the Frontend Posting section (no redirect hop).
    const settingsUrl = adminUrl + ( inApp() ? 'admin.php?page=wp-user-frontend#/settings?tab=wpuf_frontend_posting' : 'admin.php?page=wpuf-settings#wpuf_frontend_posting' );

    return dialogs.open( ( { close } ) => (
        <ConfirmDialog
            open
            title={ __( 'Do you want to show custom field data inside your post ?', 'wp-user-frontend' ) }
            media={ <img src={ data.is_pro_active ? data.lock_icon : data.free_icon } alt="" style={ { width: 110, height: 110 } } /> }
            cancelText={ __( "Don't show again", 'wp-user-frontend' ) }
            confirmText={ __( 'Okay', 'wp-user-frontend' ) }
            tone="primary"
            onCancel={ () => close( 'hide' ) }
            onConfirm={ () => close() }
            onDismiss={ () => close() }
        >
            <div style={ BODY }>
                <p style={ { margin: 0, fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' } }>
                    { __( 'Navigate through', 'wp-user-frontend' ) }{ ' ' }
                    <a href={ settingsUrl } target="_blank" rel="noreferrer" style={ { fontWeight: 700, color: PRIMARY } }>
                        { __( 'WP-admin > WPUF > Settings > Frontend Posting', 'wp-user-frontend' ) }
                    </a>{ ' ' }
                    { __( '- there you have to check the checkbox: "Show custom field data in the post content area', 'wp-user-frontend' ) }"
                </p>
                <img src={ assetUrl() + '/images/custom-fields/settings.png' } alt="" style={ IMAGE } />
                <p style={ { margin: 0, fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' } }>
                    { __( 'Edit the custom field inside the post form and on the right side you will see ', 'wp-user-frontend' ) }
                    <button type="button" style={ LINK } onClick={ () => close( { advanced: fieldId } ) }>
                        { __( '"Advanced Options".', 'wp-user-frontend' ) }
                    </button>
                    { __( ' Expand that, scroll down and you will see ', 'wp-user-frontend' ) }
                    <button type="button" style={ LINK } onClick={ () => close( { advanced: fieldId } ) }>
                        { __( '"Show data on post"', 'wp-user-frontend' ) }
                    </button>
                    { __( ' - set this yes.', 'wp-user-frontend' ) }
                </p>
                <img src={ assetUrl() + '/images/custom-fields/advance.png' } alt="" style={ IMAGE } />
            </div>
        </ConfirmDialog>
    ) );
}

/**
 * A Pro field clicked in the free palette: what it is and the upgrade link.
 *
 * @param {string} title    Field title.
 * @param {Object} fieldMsg Preview from `i18n.pro_field_message[ template ]` ({ asset_type, asset_url }), optional.
 *
 * @return {Promise<boolean>} Upgrade chosen.
 */
export function openProFieldAlert( title, fieldMsg ) {
    const data = builderData();
    const i18n = data.i18n || {};
    const upgradeText = i18n.upgrade_to_pro || __( 'Upgrade to PRO', 'wp-user-frontend' );
    const upgrade = ( close ) => {
        window.open( data.pro_link || '', '_blank' );
        close( true );
    };

    if ( ! fieldMsg ) {
        return dialogs.open( ( { close } ) => (
            <ConfirmDialog
                open
                title={ <><span style={ { color: PRIMARY } }>{ title }</span> { i18n.is_a_pro_feature || '' }</> }
                message={ proMessage() }
                media={ data.lock_icon ? <img src={ data.lock_icon } alt="" style={ { width: 110, height: 110 } } /> : null }
                showClose
                cancelText={ false }
                confirmText={ upgradeText }
                tone="primary"
                width="40rem"
                padding="2rem 3rem"
                onConfirm={ () => upgrade( close ) }
                onCancel={ () => close( false ) }
            />
        ) );
    }

    return dialogs.open( ( { close } ) => (
        <ConfirmDialog
            open
            title={ title }
            hideTitle
            icon="none"
            showClose
            cancelText={ false }
            confirmText={ upgradeText }
            tone="primary"
            width="50rem"
            padding="1.5rem"
            onConfirm={ () => upgrade( close ) }
            onCancel={ () => close( false ) }
        >
            <div style={ { display: 'flex', width: '100%', gap: 24, textAlign: 'left' } }>
                <div style={ { width: '50%' } }>
                    { data.lock_icon && <img src={ data.lock_icon } alt="" /> }
                    <h2 style={ { margin: '0 0 8px', fontSize: 20, lineHeight: 1.4, fontWeight: 500, color: '#000' } }><span style={ { color: PRIMARY } }>{ title } </span>{ i18n.is_a_pro_feature || '' }</h2>
                    <p style={ { margin: 0, fontSize: 20, lineHeight: 1.4, fontWeight: 500, color: '#6b7280' } }>{ proMessage() }</p>
                </div>
                <div style={ { display: 'flex', width: '50%', alignItems: 'center', justifyContent: 'center' } }>
                    { 'video' === fieldMsg.asset_type
                        ? <iframe style={ { width: '100%', aspectRatio: '16 / 9', border: 0 } } src={ fieldMsg.asset_url } title={ title } allowFullScreen />
                        : <img src={ fieldMsg.asset_url } alt={ title } loading="lazy" style={ { maxWidth: '100%' } } /> }
                </div>
            </div>
        </ConfirmDialog>
    ) );
}

/**
 * A field that needs settings first (reCAPTCHA / Turnstile keys, Maps API key):
 * the field's validator message, its call to action (a link to the settings)
 * and OK.
 *
 * @param {Object} validator { msg_title, msg, cta, icon }.
 *
 * @return {Promise<*>} Settles on close.
 */
export function openValidationAlert( validator ) {
    const i18n = builderData().i18n || {};

    return dialogs.alert( {
        title: <Markup html={ validator.msg_title } />,
        message: <Markup html={ validator.msg } />,
        media: validator.icon ? <img src={ validator.icon } alt="" style={ { width: 110, height: 110 } } /> : null,
        extraActions: validator.cta ? <Markup html={ validator.cta } style={ { margin: 5, fontSize: 16 } } /> : null,
        confirmText: i18n.ok || __( 'OK', 'wp-user-frontend' ),
        showClose: true,
        width: '40rem',
        padding: '2rem 3rem',
    } );
}

/**
 * Develop's save refusal: "Post Form Validation Error!" (develop used that
 * title for every form type) with the message as markup, e.g. the localized
 * `any_of_three_needed` / `email_needed` strings.
 *
 * @param {string} html Message markup.
 *
 * @return {Promise<boolean>} Settles on close.
 */
export function openSaveValidationError( html ) {
    return dialogs.alert( {
        title: __( 'Post Form Validation Error!', 'wp-user-frontend' ),
        message: <Markup html={ html } />,
        confirmText: __( 'OK', 'wp-user-frontend' ),
    } );
}

/**
 * The form has third-party taxonomy fields that stay hidden without Pro
 * (develop's markup and classes inside the popup).
 *
 * @return {Promise<*>} Settles on close.
 */
export function openHiddenTaxonomies() {
    const url = builderData().asset_url || '';

    return dialogs.alert( {
        title: __( 'Pro Fields Hidden', 'wp-user-frontend' ),
        hideTitle: true,
        confirmText: __( 'Okay', 'wp-user-frontend' ),
        className: 'wpuf-pro-taxonomy-warning',
        width: '1038px',
        padding: '36px',
        children: (
            <div className="wpuf-pro-modal-content">
                <div className="wpuf-pro-modal-left">
                    <div className="wpuf-pro-modal-icon">
                        <img src={ url + '/images/free-circle.svg' } alt={ __( 'Pro upgrade notification icon', 'wp-user-frontend' ) } />
                    </div>
                    <h2 className="wpuf-pro-modal-title">{ __( 'Pro Fields Hidden', 'wp-user-frontend' ) }</h2>
                    <p className="wpuf-pro-modal-text">
                        { __( 'This form includes custom taxonomy fields from third-party plugins. These are Pro-only and are hidden in both the builder and frontend until WPUF Pro is activated.', 'wp-user-frontend' ) }
                    </p>
                </div>
                <div className="wpuf-pro-modal-right">
                    <img src={ url + '/images/event-pro-field.jpeg' } alt={ __( 'Event Pro Field preview', 'wp-user-frontend' ) } />
                </div>
            </div>
        ),
    } );
}
