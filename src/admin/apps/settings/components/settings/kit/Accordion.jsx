import { useState } from '@wordpress/element';
import ProBadge from './ProBadge';

/**
 * Collapsible accordion row. Matches the WPUF Redesign Figma Email tab: a
 * divider-separated row with an optional 40×40 leading icon square, a title +
 * description, and a trailing chevron. Used to group the Email tab's settings
 * (Guest Email + the Pro email types).
 */
export default function Accordion( { title, desc, icon = null, isPro = false, defaultOpen = false, children } ) {
    const [ open, setOpen ] = useState( defaultOpen );

    return (
        <div className="border-b border-gray-200">
            <button
                type="button"
                onClick={ () => setOpen( ( v ) => ! v ) }
                className="flex w-full items-center gap-3 py-4 text-left"
            >
                { icon && <span className="flex shrink-0 items-center">{ icon }</span> }
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-base font-semibold text-gray-900">
                        { title }
                        { isPro && <ProBadge /> }
                    </span>
                    { desc && <span className="mt-0.5 block text-sm text-gray-500">{ desc }</span> }
                </span>
                <svg
                    className={ `h-5 w-5 shrink-0 text-gray-400 transition-transform ${ open ? 'rotate-180' : '' }` }
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>
            { open && <div className="pb-4">{ children }</div> }
        </div>
    );
}
