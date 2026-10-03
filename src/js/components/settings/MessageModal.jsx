/**
 * MessageModal — a centered confirmation/alert dialog (matches the WPUF Redesign
 * Figma modal: icon badge + title + message + action). Used to surface save /
 * validation errors prominently instead of an easy-to-miss inline banner.
 */
import { __ } from '@wordpress/i18n';
import ModalShell from './ModalShell';

const TONES = {
    error: { ring: 'bg-red-50', stroke: '#DC2626' },
    warning: { ring: 'bg-amber-50', stroke: '#D97706' },
    success: { ring: 'bg-emerald-50', stroke: '#059669' },
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
    const toneStyle = TONES[ tone ] || TONES.error;

    return (
        <ModalShell onClose={ onClose } labelledBy="wpuf-message-modal-title">
            <span className={ `flex h-[88px] w-[88px] items-center justify-center rounded-full ${ toneStyle.ring }` }>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={ toneStyle.stroke } strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={ ICON_PATHS[ tone ] || ICON_PATHS.error } />
                </svg>
            </span>

            <h1 id="wpuf-message-modal-title" className="m-0 mt-7 text-2xl font-extrabold text-gray-800">
                { title }
            </h1>
            <p className="m-0 mt-3 max-w-md text-base font-medium leading-7 text-gray-500">
                { message }
            </p>

            <button
                type="button"
                data-primary
                onClick={ onClose }
                className="mt-9 h-[50px] rounded-md bg-primary px-8 text-base font-medium text-white! shadow-xs hover:bg-primaryHover"
            >
                { actionLabel || __( 'OK', 'wp-user-frontend' ) }
            </button>
        </ModalShell>
    );
}
