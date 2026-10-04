/**
 * Form dialog (develop's subscriptions quick edit panel: one third wide,
 * 24px padding, rounded, bordered, shadow). plugin-ui Dialog: focus is
 * trapped and returned, Esc and the overlay close it (onClose).
 * The title is required for screen readers; `hideTitle` keeps it visually
 * hidden where develop showed none.
 */
import { Dialog, DialogContent, DialogTitle, cn } from '@wedevs/plugin-ui';

/**
 * @param {Object}   props
 * @param {boolean}  props.open        Open.
 * @param {Function} props.onClose     () => void (Esc, overlay, close button).
 * @param {*}        props.title       Dialog title.
 * @param {boolean}  [props.hideTitle] Title for screen readers only.
 * @param {*}        props.children    Body.
 */
export default function Modal( { open, onClose, title, hideTitle = false, className, children } ) {
    return (
        <Dialog open={ open } onOpenChange={ ( next ) => ! next && onClose?.() }>
            <DialogContent
                showCloseButton={ false }
                className={ cn( 'w-1/3 min-w-[360px] max-w-none sm:max-w-none p-6 gap-0 bg-white rounded-lg border border-gray-200 shadow', className ) }
            >
                <DialogTitle className={ hideTitle ? 'sr-only' : 'm-0 mb-4 text-base font-semibold text-gray-900' }>{ title }</DialogTitle>
                { children }
            </DialogContent>
        </Dialog>
    );
}
