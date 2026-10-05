/**
 * UnsavedChanges: confirm dialog shown when leaving a tab with unsaved edits
 * (Figma modal). On the shared Modal and Button since 4.6b.
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wpuf/components';
import ModalShell from './ModalShell';

const UnsavedChanges = ( { onDiscard, onContinue } ) => {
    return (
        <ModalShell
            onClose={ onContinue }
            title={ __( 'Unsaved Changes', 'wp-user-frontend' ) }
            icon={
                <img
                    src={ `${ ( window.wpuf_settings || {} ).asset_url || '' }/images/modal/unsaved-changes.svg` }
                    alt=""
                    aria-hidden="true"
                    className="h-[100px] w-[100px]"
                />
            }
        >
            <p className="m-0 mt-3 text-base font-medium leading-7 text-gray-500">
                { __( 'You have unsaved changes in these settings.', 'wp-user-frontend' ) }
                <br />
                { __( 'Leaving this tab will discard your changes.', 'wp-user-frontend' ) }
            </p>
            <div className="mt-9 flex justify-center gap-5">
                { /* eslint-disable-next-line jsx-a11y/no-autofocus -- the safe action */ }
                <Button autoFocus variant="secondary" className="h-[50px] px-6 text-base font-medium" onClick={ onContinue }>
                    { __( 'Continue Editing', 'wp-user-frontend' ) }
                </Button>
                <Button variant="destructive" className="h-[50px] px-6 text-base font-medium" onClick={ onDiscard }>
                    { __( 'Discard Changes', 'wp-user-frontend' ) }
                </Button>
            </div>
        </ModalShell>
    );
};

export default UnsavedChanges;
