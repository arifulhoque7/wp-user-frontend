/**
 * Confirmation dialog (replaces Swal confirms, window.confirm and the
 * settings message modal): warning icon, title, message, Cancel then the
 * confirm button (tone "danger" red by default, "primary" green). The
 * confirm button has focus, Escape or the overlay cancels.
 *
 * useConfirm() gives the Swal-style flow:
 *   const [ confirm, dialog ] = useConfirm();
 *   if ( await confirm( { title, message } ) ) { ... }   // render { dialog }
 */
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    cn,
} from '@wedevs/plugin-ui';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const TONE = {
    danger: { button: 'bg-red-600 enabled:hover:bg-red-700 text-white', ring: 'bg-red-50', stroke: '#DC2626' },
    primary: { button: 'bg-primary enabled:hover:bg-[#10b981] text-white', ring: 'bg-emerald-50', stroke: '#059669' },
    warning: { button: 'bg-primary enabled:hover:bg-[#10b981] text-white', ring: 'bg-amber-50', stroke: '#D97706' },
};

/**
 * @param {Object}   props
 * @param {boolean}  props.open           Open.
 * @param {*}        props.title          Title.
 * @param {*}        [props.message]      Message.
 * @param {string}   [props.confirmText]  Confirm label (default "Yes").
 * @param {string}   [props.cancelText]   Cancel label (default "Cancel"); false hides it (alert).
 * @param {string}   [props.tone]         danger|primary|warning
 * @param {boolean}  [props.busy]         Confirm running.
 * @param {Function} [props.onConfirm]    Confirm.
 * @param {Function} [props.onCancel]     Cancel / Escape / overlay.
 */
export default function ConfirmDialog( { open, title, message, confirmText, cancelText, tone = 'danger', busy = false, onConfirm, onCancel } ) {
    const look = TONE[ tone ] || TONE.danger;

    return (
        <AlertDialog open={ open } onOpenChange={ ( next ) => ! next && onCancel?.() }>
            <AlertDialogContent className="max-w-md bg-white text-center sm:text-center">
                <AlertDialogHeader className="items-center sm:items-center">
                    <span className={ cn( 'flex size-14 items-center justify-center rounded-full', look.ring ) } aria-hidden="true">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ look.stroke } strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </span>
                    <AlertDialogTitle className="text-xl font-semibold text-gray-900">{ title }</AlertDialogTitle>
                    { message && <AlertDialogDescription className="text-sm font-medium text-gray-500">{ message }</AlertDialogDescription> }
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center gap-3">
                    { false !== cancelText && (
                        <AlertDialogCancel className="h-[38px] px-4 text-sm font-semibold bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                            { cancelText || __( 'Cancel', 'wp-user-frontend' ) }
                        </AlertDialogCancel>
                    ) }
                    <AlertDialogAction
                        autoFocus
                        disabled={ busy }
                        aria-busy={ busy || undefined }
                        onClick={ ( event ) => {
                            event.preventDefault();
                            onConfirm?.();
                        } }
                        className={ cn( 'h-[38px] px-4 text-sm font-semibold border-0 rounded-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed', look.button ) }
                    >
                        { confirmText || __( 'Yes', 'wp-user-frontend' ) }
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/**
 * Promise-based confirm, like `Swal.fire( ... ).then( r => r.isConfirmed )`.
 *
 * @return {[Function, *]} [ confirm( options ) => Promise<boolean>, dialog element to render ]
 */
export function useConfirm() {
    const [ options, setOptions ] = useState( null );
    const resolver = useRef( null );

    const confirm = useCallback( ( next ) => new Promise( ( resolve ) => {
        resolver.current = resolve;
        setOptions( next || {} );
    } ), [] );

    const settle = ( value ) => {
        resolver.current?.( value );
        resolver.current = null;
        setOptions( null );
    };

    const dialog = (
        <ConfirmDialog
            { ...( options || {} ) }
            open={ null !== options }
            onConfirm={ () => settle( true ) }
            onCancel={ () => settle( false ) }
        />
    );

    return [ confirm, dialog ];
}
