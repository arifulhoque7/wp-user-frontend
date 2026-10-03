/**
 * DESCRIPTION: UpdateButton component with Publish/Draft dropdown
 * DESCRIPTION: Renders a button with dropdown options for saving subscription
 */
import { __ } from '@wordpress/i18n';

const UpdateButton = ( {
	buttonText = __( 'Update', 'wp-user-frontend' ),
	isUpdating = false,
	onPublish,
	onSaveDraft,
} ) => {
	return (
		<div className="relative">
			<button
				type="button"
				disabled={ isUpdating }
				className={ `peer inline-flex justify-between items-center cursor-pointer bg-primary hover:bg-primaryHover text-white font-medium text-base py-2 px-5 rounded-md min-w-[122px] ${
					isUpdating ? 'cursor-not-allowed bg-gray-50' : ''
				}` }
				onClick={ onPublish }
			>
				{ buttonText }
				<svg
					className="rotate-180 w-3 h-3 ml-4"
					data-accordion-icon=""
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 10 6"
				>
					<path
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M9 5 5 1 1 5"
					/>
				</svg>
			</button>
			<div className="hidden hover:block peer-hover:block cursor-pointer w-44 z-40 bg-white border border-[#DBDBDB] absolute z-10 shadow-sm right-0 rounded-md after:content-[''] before:content-[''] after:absolute before:absolute after:w-[13px] before:w-[70%] before:-right-[1px] after:h-[13px] before:h-3 before:mt-3 after:top-[-7px] before:-top-6 after:right-[1.4rem] after:z-[-1] after:bg-white after:border after:border-[#DBDBDB] after:!rotate-45 after:border-r-0 after:border-b-0">
				<button
					type="button"
					onClick={ onPublish }
					className={ `flex w-full py-3 items-center px-4 text-sm font-medium text-gray-700 hover:bg-primaryHover hover:text-white rounded-t-md ${
						isUpdating ? 'cursor-not-allowed bg-gray-50' : ''
					}` }
					disabled={ isUpdating }
				>
					{ __( 'Publish', 'wp-user-frontend' ) }
				</button>
				<button
					type="button"
					onClick={ onSaveDraft }
					className={ `flex w-full py-3 items-center px-4 text-sm font-medium text-gray-700 hover:bg-primaryHover hover:text-white rounded-b-md ${
						isUpdating ? 'cursor-not-allowed bg-gray-50' : ''
					}` }
					disabled={ isUpdating }
				>
					{ __( 'Save as Draft', 'wp-user-frontend' ) }
				</button>
			</div>
		</div>
	);
};

export default UpdateButton;
