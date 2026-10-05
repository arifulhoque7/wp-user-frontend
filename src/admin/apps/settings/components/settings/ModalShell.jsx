/**
 * ModalShell: the centered dialog of the settings screen (Figma modal: icon,
 * title, message, actions, corner close button) on the shared Modal
 * (`variant="message"`, plugin-ui Dialog) since 4.6b, so focus is trapped and
 * returned and Esc / the overlay close it. Used by UnsavedChanges and
 * MessageModal.
 */
import { Modal } from '@wpuf/components';

/**
 * @param {Object}   props
 * @param {Function} props.onClose  Close (Esc, overlay, corner button).
 * @param {string}   props.title    Dialog title.
 * @param {*}        [props.icon]   Shown above the title.
 * @param {*}        props.children Message and actions.
 */
export default function ModalShell( { onClose, title, icon, children } ) {
    return (
        <Modal open variant="message" onClose={ onClose } title={ title } icon={ icon }>
            { children }
        </Modal>
    );
}
