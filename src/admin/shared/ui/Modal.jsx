/**
 * Form dialog (develop's subscriptions quick edit panel: one third wide,
 * 24px padding, rounded, bordered, shadow). plugin-ui Dialog: focus is
 * trapped and returned, Esc and the overlay close it (onClose).
 * The title is required for screen readers; `hideTitle` keeps it visually
 * hidden where develop showed none.
 */
import { Dialog, DialogContent, DialogTitle, cn } from '@wedevs/plugin-ui';

import { __ } from '@wordpress/i18n';

/**
 * @param {Object}   props
 * @param {boolean}  props.open        Open.
 * @param {Function} props.onClose     () => void (Esc, overlay, close button).
 * @param {*}        props.title       Dialog title.
 * @param {boolean}  [props.hideTitle] Title for screen readers only.
 * @param {string}   [props.titleClassName] Title look (default 16px semibold).
 * @param {*}        [props.icon]      Shown above the title.
 * @param {string}   [props.variant]   default | message (settings Figma message dialog: 560px,
 *                                     centered column, large title, corner close button).
 * @param {*}        props.children    Body.
 */
export default function Modal( { open, onClose, title, hideTitle = false, titleClassName, icon, variant = 'default', className, children } ) {
    const message = 'message' === variant;

    return (
        <Dialog open={ open } onOpenChange={ ( next ) => ! next && onClose?.() }>
            <DialogContent
                showCloseButton={ false }
                className={ cn(
                    'gap-0 bg-white rounded-lg border border-gray-200 shadow max-w-none sm:max-w-none',
                    message ? 'w-[560px] flex flex-col items-center px-16 pt-12 pb-12 text-center' : 'w-1/3 min-w-[360px] p-6',
                    className
                ) }
            >
                { message && (
                    <button
                        type="button"
                        onClick={ () => onClose?.() }
                        aria-label={ __( 'Close', 'wp-user-frontend' ) }
                        className="absolute right-6 top-6 rounded-full border-0 bg-transparent p-2 cursor-pointer hover:bg-gray-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M1 13L13 1M1 1L13 13" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                ) }
                { icon }
                <DialogTitle className={ hideTitle ? 'sr-only' : titleClassName || ( message ? 'm-0 mt-7 text-2xl font-extrabold text-gray-800' : 'm-0 mb-4 text-base font-semibold text-gray-900' ) }>{ title }</DialogTitle>
                { children }
            </DialogContent>
        </Dialog>
    );
}
