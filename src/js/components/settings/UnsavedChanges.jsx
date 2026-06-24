/**
 * UnsavedChanges — confirm modal shown when leaving a tab with unsaved edits.
 * Follows the User Directory free module's DeleteConfirmModal design (custom
 * centered overlay card), not the @wordpress/components Modal.
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const UnsavedChanges = ( { onDiscard, onContinue } ) => {
    const modalRef = useRef( null );

    useEffect( () => {
        const handleKeyDown = ( e ) => {
            if ( e.key === 'Escape' ) {
                onContinue();
            }
        };
        document.addEventListener( 'keydown', handleKeyDown );
        if ( modalRef.current ) {
            const firstButton = modalRef.current.querySelector( 'button' );
            if ( firstButton ) {
                firstButton.focus();
            }
        }
        return () => document.removeEventListener( 'keydown', handleKeyDown );
    }, [ onContinue ] );

    return (
        <div
            className="wpuf-fixed wpuf-inset-0 wpuf-z-[100000] wpuf-flex wpuf-items-center wpuf-justify-center wpuf-bg-black wpuf-bg-opacity-30"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wpuf-unsaved-modal-title"
        >
            <div
                ref={ modalRef }
                className="wpuf-relative wpuf-flex wpuf-w-[560px] wpuf-flex-col wpuf-items-center wpuf-rounded-lg wpuf-bg-white wpuf-px-16 wpuf-pb-12 wpuf-pt-12 wpuf-text-center"
            >
                <button
                    onClick={ onContinue }
                    aria-label={ __( 'Close', 'wp-user-frontend' ) }
                    className="wpuf-absolute wpuf-right-6 wpuf-top-6 wpuf-rounded-full wpuf-p-2 hover:wpuf-bg-gray-100"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 13L13 1M1 1L13 13" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <img
                    src={ `${ ( window.wpuf_settings || {} ).asset_url || '' }/images/modal/unsaved-changes.svg` }
                    alt=""
                    aria-hidden="true"
                    className="wpuf-h-[100px] wpuf-w-[100px]"
                />

                <h1 id="wpuf-unsaved-modal-title" className="wpuf-m-0 wpuf-mt-7 wpuf-text-2xl wpuf-font-extrabold wpuf-text-gray-700">
                    { __( 'Unsaved Changes', 'wp-user-frontend' ) }
                </h1>
                <p className="wpuf-m-0 wpuf-mt-3 wpuf-text-base wpuf-font-medium wpuf-leading-7 wpuf-text-gray-500">
                    { __( 'You have unsaved changes in these settings.', 'wp-user-frontend' ) }
                    <br />
                    { __( 'Leaving this tab will discard your changes.', 'wp-user-frontend' ) }
                </p>

                <div className="wpuf-mt-9 wpuf-flex wpuf-justify-center wpuf-gap-5">
                    <button
                        onClick={ onContinue }
                        className="wpuf-h-[50px] wpuf-rounded-md wpuf-border !wpuf-border-gray-300 wpuf-bg-white wpuf-px-6 wpuf-text-base wpuf-font-medium wpuf-text-gray-700 hover:wpuf-bg-gray-50"
                    >
                        { __( 'Continue Editing', 'wp-user-frontend' ) }
                    </button>
                    <button
                        onClick={ onDiscard }
                        className="wpuf-h-[50px] wpuf-rounded-md wpuf-bg-[#EF4444] wpuf-px-6 wpuf-text-base wpuf-font-medium !wpuf-text-white wpuf-shadow-sm hover:wpuf-bg-red-600"
                    >
                        { __( 'Discard Changes', 'wp-user-frontend' ) }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnsavedChanges;
