/**
 * MessageModal — a centered confirmation/alert dialog (matches the WPUF Redesign
 * Figma modal: icon badge + title + message + action). Used to surface save /
 * validation errors prominently instead of an easy-to-miss inline banner.
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const TONES = {
    error: { ring: 'wpuf-bg-red-50', stroke: '#DC2626' },
    warning: { ring: 'wpuf-bg-amber-50', stroke: '#D97706' },
    success: { ring: 'wpuf-bg-emerald-50', stroke: '#059669' },
};

const ICON_PATHS = {
    // x-circle
    error: 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    // exclamation-triangle
    warning: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    // check-circle
    success: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

export default function MessageModal( { title, message, onClose, tone = 'error', actionLabel } ) {
    const modalRef = useRef( null );
    const toneStyle = TONES[ tone ] || TONES.error;

    useEffect( () => {
        const handleKeyDown = ( e ) => {
            if ( e.key === 'Escape' ) {
                onClose();
            }
        };
        document.addEventListener( 'keydown', handleKeyDown );
        if ( modalRef.current ) {
            const btn = modalRef.current.querySelector( 'button[data-primary]' );
            if ( btn ) {
                btn.focus();
            }
        }
        return () => document.removeEventListener( 'keydown', handleKeyDown );
    }, [ onClose ] );

    return (
        <div
            className="wpuf-fixed wpuf-inset-0 wpuf-z-[100000] wpuf-flex wpuf-items-center wpuf-justify-center wpuf-bg-black wpuf-bg-opacity-30"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wpuf-message-modal-title"
        >
            <div
                ref={ modalRef }
                className="wpuf-relative wpuf-flex wpuf-w-[560px] wpuf-flex-col wpuf-items-center wpuf-rounded-lg wpuf-bg-white wpuf-px-16 wpuf-pb-12 wpuf-pt-12 wpuf-text-center"
            >
                <button
                    onClick={ onClose }
                    aria-label={ __( 'Close', 'wp-user-frontend' ) }
                    className="wpuf-absolute wpuf-right-6 wpuf-top-6 wpuf-rounded-full wpuf-p-2 hover:wpuf-bg-gray-100"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 13L13 1M1 1L13 13" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <span className={ `wpuf-flex wpuf-h-[88px] wpuf-w-[88px] wpuf-items-center wpuf-justify-center wpuf-rounded-full ${ toneStyle.ring }` }>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={ toneStyle.stroke } strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={ ICON_PATHS[ tone ] || ICON_PATHS.error } />
                    </svg>
                </span>

                <h1 id="wpuf-message-modal-title" className="wpuf-m-0 wpuf-mt-7 wpuf-text-2xl wpuf-font-extrabold wpuf-text-gray-800">
                    { title }
                </h1>
                <p className="wpuf-m-0 wpuf-mt-3 wpuf-max-w-md wpuf-text-base wpuf-font-medium wpuf-leading-7 wpuf-text-gray-500">
                    { message }
                </p>

                <button
                    type="button"
                    data-primary
                    onClick={ onClose }
                    className="wpuf-mt-9 wpuf-h-[50px] wpuf-rounded-md wpuf-bg-primary wpuf-px-8 wpuf-text-base wpuf-font-medium !wpuf-text-white wpuf-shadow-sm hover:wpuf-bg-primaryHover"
                >
                    { actionLabel || __( 'OK', 'wp-user-frontend' ) }
                </button>
            </div>
        </div>
    );
}
