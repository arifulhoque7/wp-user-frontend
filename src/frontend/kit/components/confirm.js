/**
 * A confirm dialog: SweetAlert2 when the classic bundle loaded it on the
 * page (the chat uses the same), the browser's confirm otherwise. Nothing
 * is appended to <body> by us (frontend-react-architecture.md 3.2, rule 4).
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';

export default function confirmDialog( { title, text = '', confirmText = __( 'Delete', 'wp-user-frontend' ), danger = true } ) {
    if ( 'function' === typeof window.Swal?.fire ) {
        return window.Swal.fire( {
            title,
            text,
            icon: danger ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: __( 'Cancel', 'wp-user-frontend' ),
            confirmButtonColor: danger ? '#dc2626' : '#111827',
            cancelButtonColor: '#e5e7eb',
            reverseButtons: true,
            customClass: { popup: 'wpuf-frontend-swal', cancelButton: 'wpuf-frontend-swal__cancel' },
        } ).then( ( result ) => !! result.isConfirmed );
    }

    return Promise.resolve( window.confirm( text ? title + '\n' + text : title ) ); // eslint-disable-line no-alert
}
