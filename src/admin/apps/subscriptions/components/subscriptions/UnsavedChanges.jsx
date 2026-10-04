/**
 * DESCRIPTION: UnsavedChanges popup component
 * DESCRIPTION: Modal for confirming navigation with unsaved changes
 */
import { __ } from '@wordpress/i18n';
import { Modal, Button, ButtonGroup } from '@wordpress/components';

const UnsavedChanges = ({ onDiscard, onContinue }) => {
	return (
		<Modal
			title={__('Unsaved Changes', 'wp-user-frontend')}
			onRequestClose={onContinue}
			className="wpuf-unsaved-changes-modal"
		>
			<div className="p-4">
				<p className="text-sm text-gray-500 mb-6">
					{__(
						'You have unsaved changes in your current subscription.',
						'wp-user-frontend'
					)}
					<br />
					{__(
						'Navigating away from this page will cause your work to be lost.',
						'wp-user-frontend'
					)}
				</p>

				<div className="flex justify-end [&>:not([hidden])~:not([hidden])]:ml-3 [&>:not([hidden])~:not([hidden])]:mr-0">
					<ButtonGroup>
						<Button
							variant="secondary"
							onClick={onContinue}
							className="mr-2"
						>
							{__('Continue Editing', 'wp-user-frontend')}
						</Button>
						<Button
							variant="primary"
							isDestructive
							onClick={onDiscard}
						>
							{__('Discard Changes', 'wp-user-frontend')}
						</Button>
					</ButtonGroup>
				</div>
			</div>
		</Modal>
	);
};

export default UnsavedChanges;
