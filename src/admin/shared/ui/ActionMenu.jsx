/**
 * Row / card action menu (forms list kebab, subscription card menu): a dots
 * button opening a menu; a click outside or Escape closes it, picking an
 * item runs it and closes. Items: [{ key, label, onClick, destructive?,
 * disabled?, icon? }]. Keyboard navigation comes from plugin-ui.
 */
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, cn } from '@wedevs/plugin-ui';
import { __ } from '@wordpress/i18n';

const Dots = ( { vertical } ) => (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        { vertical
            ? <><circle cx="12" cy="5" r="1.75" /><circle cx="12" cy="12" r="1.75" /><circle cx="12" cy="19" r="1.75" /></>
            : <><circle cx="5" cy="12" r="1.75" /><circle cx="12" cy="12" r="1.75" /><circle cx="19" cy="12" r="1.75" /></> }
    </svg>
);

/**
 * @param {Object}  props
 * @param {Array}   props.items      Menu items.
 * @param {string}  [props.label]    Button label for screen readers.
 * @param {boolean} [props.vertical] Vertical dots (subscription cards).
 * @param {string}  [props.align]    start|end (default end).
 */
export default function ActionMenu( { items, label, vertical = false, align = 'end', className } ) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={ label || __( 'Actions', 'wp-user-frontend' ) }
                className={ cn( 'inline-flex items-center justify-center rounded-md p-2 text-gray-400 bg-transparent border-0 cursor-pointer hover:bg-gray-50 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-primary/30', className ) }
            >
                <Dots vertical={ vertical } />
            </DropdownMenuTrigger>
            <DropdownMenuContent align={ align } className="w-40 p-1 bg-white rounded-md shadow-lg ring-1 ring-black/5 border-0">
                { items.map( ( item ) => (
                    <DropdownMenuItem
                        key={ item.key || item.action || item.label }
                        disabled={ item.disabled }
                        onClick={ () => item.onClick?.( item ) }
                        className={ cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm cursor-pointer',
                            item.destructive
                                ? 'text-red-600 data-highlighted:bg-red-600 data-highlighted:text-white'
                                : 'text-gray-900 data-highlighted:bg-primary data-highlighted:text-white'
                        ) }
                    >
                        { item.icon }
                        { item.label }
                    </DropdownMenuItem>
                ) ) }
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
