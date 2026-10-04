/**
 * develop's save button: "Update" / "Save" with a menu offering Publish and
 * Save as Draft (develop opened it on hover; here it opens on click and from
 * the keyboard). Busy while a save runs.
 */
import { __ } from '@wordpress/i18n';
import { ActionMenu, Button } from '@wpuf/components';

const UpdateButton = ( {
	buttonText = __( 'Update', 'wp-user-frontend' ),
	isUpdating = false,
	onPublish,
	onSaveDraft,
} ) => (
	<ActionMenu
		label={ buttonText }
		items={ [
			{ key: 'publish', label: __( 'Publish', 'wp-user-frontend' ), onClick: onPublish, disabled: isUpdating },
			{ key: 'draft', label: __( 'Save as Draft', 'wp-user-frontend' ), onClick: onSaveDraft, disabled: isUpdating },
		] }
		trigger={
			<Button busy={ isUpdating } className="min-w-[122px] justify-between">
				{ buttonText }
				<svg className="rotate-180 w-3 h-3 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
					<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
				</svg>
			</Button>
		}
	/>
);

export default UpdateButton;
