import { __ } from '@wordpress/i18n';
import { dialogs } from '@wpuf/components';

/**
 * Builder alerts and confirms on the shared dialogs (the file kept its name
 * from the SweetAlert2 version; callers did not change).
 */

/**
 * Show a warning/error alert.
 *
 * @param {Object} options
 * @param {string} options.title   Modal title.
 * @param {string} options.message Modal body text.
 *
 * @return {Promise} Resolves to { isConfirmed } when closed.
 */
export function showAlert( { title, message } ) {
    return dialogs.alert( { title, message, confirmText: __( 'OK', 'wp-user-frontend' ) } )
        .then( ( isConfirmed ) => ( { isConfirmed } ) );
}

/**
 * Show a confirmation with confirm/cancel buttons.
 *
 * @param {Object}  options
 * @param {string}  options.title         Modal title.
 * @param {string}  options.message       Modal body text.
 * @param {string}  options.confirmText   Confirm button label.
 * @param {string}  options.cancelText    Cancel button label.
 * @param {string}  options.confirmColor  '#EF4444' (default) shows the destructive action, any other the primary one.
 *
 * @return {Promise} Resolves to { isConfirmed }.
 */
export function showConfirm( {
    title,
    message,
    confirmText,
    cancelText,
    confirmColor = '#EF4444',
} ) {
    return dialogs.confirm( {
        title,
        message,
        confirmText: confirmText || __( 'Yes', 'wp-user-frontend' ),
        cancelText: cancelText || __( 'Cancel', 'wp-user-frontend' ),
        tone: '#EF4444' === confirmColor ? 'danger' : 'primary',
        icon: 'warning',
    } ).then( ( isConfirmed ) => ( { isConfirmed } ) );
}
