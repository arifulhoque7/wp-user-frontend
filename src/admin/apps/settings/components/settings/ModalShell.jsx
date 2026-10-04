/**
 * ModalShell — the shared centered-dialog chrome (dimmed overlay, white card,
 * corner close button, Escape-to-close). Modal content (icon, title, message,
 * actions) is passed as children. Used by UnsavedChanges and MessageModal.
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function ModalShell( { onClose, labelledBy, children } ) {
    const cardRef = useRef( null );

    useEffect( () => {
        const handleKeyDown = ( e ) => {
            if ( e.key === 'Escape' ) {
                onClose();
            }
        };
        document.addEventListener( 'keydown', handleKeyDown );

        // Focus the marked primary action so Enter confirms it.
        const primary = cardRef.current && cardRef.current.querySelector( 'button[data-primary]' );
        if ( primary ) {
            primary.focus();
        }

        return () => document.removeEventListener( 'keydown', handleKeyDown );
    }, [ onClose ] );

    return (
        <div
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/30"
            role="dialog"
            aria-modal="true"
            aria-labelledby={ labelledBy }
        >
            <div
                ref={ cardRef }
                className="relative flex w-[560px] flex-col items-center rounded-lg bg-white px-16 pb-12 pt-12 text-center"
            >
                <button
                    onClick={ onClose }
                    aria-label={ __( 'Close', 'wp-user-frontend' ) }
                    className="absolute right-6 top-6 rounded-full p-2 hover:bg-gray-100"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 13L13 1M1 1L13 13" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                { children }
            </div>
        </div>
    );
}
