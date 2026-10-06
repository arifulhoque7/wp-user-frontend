/**
 * MessageModal: an alert for save / validation errors (instead of an
 * easy-to-miss inline banner), on the shared ConfirmDialog.
 */
import { __ } from '@wordpress/i18n';
import { ConfirmDialog } from '@wpuf/components';

export default function MessageModal( { title, message, onClose, tone = 'error', actionLabel } ) {
    return (
        <ConfirmDialog
            open
            title={ title }
            message={ message }
            confirmText={ actionLabel || __( 'OK', 'wp-user-frontend' ) }
            cancelText={ false }
            tone={ 'error' === tone ? 'danger' : 'primary' }
            onConfirm={ onClose }
            onCancel={ onClose }
        />
    );
}
