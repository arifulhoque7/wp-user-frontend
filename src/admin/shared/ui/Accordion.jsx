/**
 * Collapsible section (settings accordion behaviour): header with title,
 * description, optional icon and badge, chevron that turns; the content is
 * unmounted while closed. Uncontrolled (defaultOpen) or controlled
 * (open + onToggle).
 * Variant "card": develop's subscription subsection (bordered rounded box,
 * gray header, small chevron, description as an italic sub-label).
 */
import { cn } from '@wedevs/plugin-ui';
import { useId, useState } from '@wordpress/element';

/**
 * @param {Object}   props
 * @param {*}        props.title         Title.
 * @param {*}        [props.description] Text under the title.
 * @param {*}        [props.icon]        Icon before the title.
 * @param {*}        [props.badge]       After the title (e.g. <ProBadge />).
 * @param {boolean}  [props.defaultOpen] Open at first render.
 * @param {boolean}  [props.open]        Controlled open state.
 * @param {Function} [props.onToggle]    ( open ) => void
 * @param {string}   [props.variant]     default|card
 */
export default function Accordion( { title, description, icon, badge, defaultOpen = false, open: controlled, onToggle, variant = 'default', className, children } ) {
    const [ own, setOwn ] = useState( defaultOpen );
    const open = undefined === controlled ? own : controlled;
    const panelId = useId();

    const toggle = () => {
        if ( undefined === controlled ) {
            setOwn( ! open );
        }
        onToggle?.( ! open );
    };

    if ( 'card' === variant ) {
        return (
            <div data-wpuf-ui="" className={ cn( 'border border-gray-200 rounded-xl mt-4 mb-4', className ) }>
                <h2 className="m-0">
                    <button
                        type="button"
                        aria-expanded={ open }
                        aria-controls={ panelId }
                        onClick={ toggle }
                        className={ cn( 'flex items-center justify-between w-full p-4 font-medium text-left rtl:text-right text-gray-500 bg-gray-100 gap-3 border-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/30', open ? 'rounded-t-xl' : 'rounded-xl' ) }
                    >
                        <span className="flex">
                            { icon }
                            { title }
                            { description && <span className="relative m-0 p-0 ml-2 mt-[1px] italic text-[11px] text-gray-400">{ description }</span> }
                            { badge }
                        </span>
                        <svg className={ cn( 'w-3 h-3 shrink-0', open ? 'rotate-180' : 'rotate-90' ) } aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
                        </svg>
                    </button>
                </h2>
                { open && <div id={ panelId }>{ children }</div> }
            </div>
        );
    }

    return (
        <div data-wpuf-ui="" className={ cn( 'border-b border-gray-200', className ) }>
            <button
                type="button"
                aria-expanded={ open }
                aria-controls={ panelId }
                onClick={ toggle }
                className="flex w-full items-center gap-3 py-4 text-left bg-transparent border-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/30"
            >
                { icon && <span className="flex shrink-0 items-center">{ icon }</span> }
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-base font-semibold text-gray-900">
                        { title }
                        { badge }
                    </span>
                    { description && <span className="mt-0.5 block text-sm text-gray-500">{ description }</span> }
                </span>
                <svg className={ cn( 'size-5 shrink-0 text-gray-400 transition-transform', open && 'rotate-180' ) } viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>
            { open && <div id={ panelId } className="pb-4">{ children }</div> }
        </div>
    );
}
