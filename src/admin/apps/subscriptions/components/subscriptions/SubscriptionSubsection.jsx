/**
 * DESCRIPTION: SubscriptionSubsection component for collapsible form sections
 * DESCRIPTION: Renders a collapsible section with fields inside
 */
import { Accordion, ProBadge } from '@wpuf/components';
import { CalendarClock, CreditCard, Eye, FileText, Gauge, Layers, Palette, Settings2, Tags } from 'lucide-react';
import SubscriptionField from './SubscriptionField';
import ProTooltip from './ProTooltip';
import { SubscriptionAfterSubsection } from '../../slots';

// develop: the first subsection of each tab starts open.
const OPEN_BY_DEFAULT = [ 'overview', 'content_limit', 'payment_details' ];

// Section icon tiles (modern card look); unknown sections get the generic one.
const ICONS = {
	overview: FileText,
	access_and_visibility: Eye,
	post_expiration: CalendarClock,
	content_limit: Gauge,
	taxonomy_restriction: Tags,
	payment_details: CreditCard,
	design_elements: Palette,
	additional: Layers,
};

const SubscriptionSubsection = ( { subSection, fields, subscription, onFieldChange } ) => {
	const wpufSubscriptions = window.wpufSubscriptions || {};

	return (
		<Accordion
			variant="card"
			title={ subSection.label }
			description={ subSection.sub_label }
			icon={ ( () => {
				const Icon = ICONS[ subSection.id ] || Settings2;
				return <Icon size={ 16 } strokeWidth={ 2 } aria-hidden="true" />;
			} )() }
			badge={
				// develop always renders this span (8px gap even without a badge).
				<span className="pro-icon-title relative group ml-2">
					{ subSection.is_pro && ! wpufSubscriptions.isProActive && (
						<>
							<ProBadge link={ false } />
							<ProTooltip />
						</>
					) }
				</span>
			}
			defaultOpen={ OPEN_BY_DEFAULT.includes( subSection.id ) }
		>
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

			{/* Notice (server-defined text from the subsection definition) */}
			{ subSection.notice && (
				<div className="rounded-b-lg bg-yellow-50 p-4">
					<div className="flex items-center">
						<div className="shrink-0">
							<svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
		</Accordion>
	);
};

export default SubscriptionSubsection;
