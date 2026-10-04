/**
 * DESCRIPTION: SubscriptionSubsection component for collapsible form sections
 * DESCRIPTION: Renders a collapsible section with fields inside
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import SubscriptionField from './SubscriptionField';
import ProBadge from './ProBadge';
import ProTooltip from './ProTooltip';
import { SubscriptionAfterSubsection } from '../../slots';

const SubscriptionSubsection = ( { subSection, fields, subscription, onFieldChange } ) => {
	// Some sections should be open by default (first subsection of each section)
	const openTabs = [ 'overview', 'content_limit', 'payment_details' ];
	const shouldBeOpen = openTabs.includes( subSection.id );

	// Start closed (opposite of shouldBeOpen)
	const [ isClosed, setIsClosed ] = useState( ! shouldBeOpen );

	const wpufSubscriptions = window.wpufSubscriptions || {};

	return (
		<div className="border border-gray-200 rounded-xl mt-4 mb-4">
			{/* Header */}
			<h2 className="m-0">
				<button
					type="button"
					onClick={ () => setIsClosed( ! isClosed ) }
					className={ `flex items-center justify-between w-full p-4 font-medium rtl:text-right text-gray-500 bg-gray-100 gap-3 ${ isClosed ? 'rounded-xl' : 'rounded-t-xl' }` }
				>
					<span className="flex">
						{ subSection.label }
						{ subSection.sub_label && (
							<span className="relative m-0 p-0 ml-2 mt-[1px] italic text-[11px] text-gray-400">
								{ subSection.sub_label }
							</span>
						) }
						{ subSection.is_pro && (
							<span className="pro-icon-title relative group ml-2">
								<ProBadge />
								<ProTooltip />
							</span>
						) }
					</span>
					<svg
						className={ `w-3 h-3 shrink-0 ${ isClosed ? 'rotate-90' : 'rotate-180' }` }
														data-accordion-icon
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
			</h2>

			{/* Fields */}
			{ ! isClosed && (
				<>
					{ Object.entries( fields || {} ).map( ( [ fieldKey, field ] ) => (
						<SubscriptionField
							key={ fieldKey }
							field={ field }
							fieldId={ fieldKey }
							subscription={ subscription }
							onFieldChange={ onFieldChange }
						/>
					) ) }

					{/* Extension slot: Pro and third-party plugins can add UI after subsection fields */}
					<SubscriptionAfterSubsection.Slot
						fillProps={ { subSection, subscription, onFieldChange } }
					/>

					{/* Notice */}
					{ subSection.notice && (
						<div className="rounded-b-xl bg-yellow-50 p-4">
							<div className="flex items-center">
								<div className="shrink-0">
									<svg
										className="h-5 w-5 text-yellow-400"
										viewBox="0 0 20 20"
										fill="currentColor"
														aria-hidden="true"
									>
										<path
											fillRule="evenodd"
											d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
								<div className="ml-3">
									<div className="mt-2 text-sm text-yellow-700">
										<p dangerouslySetInnerHTML={ { __html: subSection.notice.message } } />
									</div>
								</div>
							</div>
						</div>
					) }
				</>
			) }
		</div>
	);
};

export default SubscriptionSubsection;
