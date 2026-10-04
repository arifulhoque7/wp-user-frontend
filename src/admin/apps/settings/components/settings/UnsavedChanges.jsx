/**
 * UnsavedChanges — confirm modal shown when leaving a tab with unsaved edits.
 * Follows the User Directory free module's DeleteConfirmModal design (custom
 * centered overlay card), not the @wordpress/components Modal.
 */
import { __ } from '@wordpress/i18n';
import ModalShell from './ModalShell';

const UnsavedChanges = ( { onDiscard, onContinue } ) => {
    return (
        <ModalShell onClose={ onContinue } labelledBy="wpuf-unsaved-modal-title">
                <img
                    src={ `${ ( window.wpuf_settings || {} ).asset_url || '' }/images/modal/unsaved-changes.svg` }
                    alt=""
                    aria-hidden="true"
                    className="h-[100px] w-[100px]"
                />

                <h1 id="wpuf-unsaved-modal-title" className="m-0 mt-7 text-2xl font-extrabold text-gray-700">
                    { __( 'Unsaved Changes', 'wp-user-frontend' ) }
                </h1>
                <p className="m-0 mt-3 text-base font-medium leading-7 text-gray-500">
                    { __( 'You have unsaved changes in these settings.', 'wp-user-frontend' ) }
                    <br />
                    { __( 'Leaving this tab will discard your changes.', 'wp-user-frontend' ) }
                </p>

                <div className="mt-9 flex justify-center gap-5">
                    <button
                        data-primary
                        onClick={ onContinue }
                        className="h-[50px] rounded-md border border-gray-300! bg-white px-6 text-base font-medium text-gray-700 hover:bg-gray-50"
                    >
                        { __( 'Continue Editing', 'wp-user-frontend' ) }
                    </button>
                    <button
                        onClick={ onDiscard }
                        className="h-[50px] rounded-md bg-[#EF4444] px-6 text-base font-medium text-white! shadow-xs hover:bg-red-600"
                    >
                        { __( 'Discard Changes', 'wp-user-frontend' ) }
                    </button>
                </div>
        </ModalShell>
    );
};

export default UnsavedChanges;
