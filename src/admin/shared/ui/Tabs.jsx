/**
 * Tab bar on plugin-ui Tabs (the panels stay with the screen; keyboard
 * arrows and roles from plugin-ui / Base UI), sized like the develop tabs:
 * - variant "underline" (plugin-ui `line`; forms list status tabs,
 *   subscription details): py-4 px-1, 14px/500, 2px primary underline,
 *   32px right margin per tab, optional count pill;
 * - variant "segmented" (plugin-ui `default`; builder header): gray-100
 *   track p-2, tabs py-2 px-4 16px with an 8px right margin, active white
 *   with a soft shadow.
 */
import { Tabs as PuiTabs, TabsList, TabsTrigger, cn } from '@wedevs/plugin-ui';

/**
 * @param {Object}   props
 * @param {Array}    props.tabs      [{ id, label, count?, disabled? }]
 * @param {string}   props.value     Active tab id.
 * @param {Function} props.onChange  ( id ) => void
 * @param {string}   [props.variant] underline|segmented
 * @param {string}   [props.label]   aria-label of the tab list.
 */
export default function Tabs( { tabs, value, onChange, variant = 'underline', label, className } ) {
    const segmented = 'segmented' === variant;

    return (
        <PuiTabs value={ value } onValueChange={ ( next ) => onChange( next ) }>
            <TabsList
                variant={ segmented ? 'default' : 'line' }
                aria-label={ label }
                className={ cn(
                    'h-auto group-data-horizontal/tabs:h-auto justify-start',
                    segmented ? 'w-max gap-0 rounded-lg bg-gray-100 p-2' : 'w-auto gap-0 p-0 rounded-none bg-transparent',
                    className
                ) }
            >
                { tabs.map( ( tab ) => (
                    <TabsTrigger
                        key={ tab.id }
                        value={ tab.id }
                        disabled={ tab.disabled }
                        className={ cn(
                            // Develop spaces tabs with a right margin on each (also the last one).
                            'flex-none h-auto gap-0 cursor-pointer shadow-none',
                            segmented
                                ? 'mr-2 rounded-md border-0 px-4 py-2 text-base font-normal text-gray-500 data-active:bg-white data-active:text-gray-800 data-active:drop-shadow-xs enabled:hover:bg-white enabled:hover:text-gray-800'
                                : 'mr-8 rounded-none border-0 border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 data-active:border-b-primary data-active:text-primary enabled:hover:border-b-primary enabled:hover:text-primary'
                        ) }
                    >
                        { tab.label }
                        { undefined !== tab.count && (
                            <span className="ml-3 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-900">{ tab.count }</span>
                        ) }
                    </TabsTrigger>
                ) ) }
            </TabsList>
        </PuiTabs>
    );
}
