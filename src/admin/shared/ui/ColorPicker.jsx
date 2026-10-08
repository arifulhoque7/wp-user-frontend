/**
 * Color picker; value and onChange use the color string as stored (hex).
 *
 * plugin-ui has a ColorPicker file but does not export it from its package
 * index (pinned acc2771), so this builds the same control from exported
 * parts: plugin-ui Popover + the @wordpress/components ColorPicker.
 */
import { Popover, PopoverContent, PopoverTrigger, cn } from '@wedevs/plugin-ui';
import { ColorPicker as WpColorPicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * @param {Object}   props
 * @param {string}   [props.value]       Color (`#rrggbb`).
 * @param {Function} [props.onChange]    ( color: string ) => void
 * @param {boolean}  [props.enableAlpha] Allow transparency (stored values are hex: off).
 * @param {boolean}  [props.disabled]    Disabled.
 */
export default function ColorPicker( { value, onChange, enableAlpha = false, disabled, className, id, ...props } ) {
    const color = value || '';

    return (
        <Popover>
            <PopoverTrigger
                id={ id }
                disabled={ disabled }
                aria-label={ props[ 'aria-label' ] || __( 'Choose color', 'wp-user-frontend' ) }
                className={ cn( 'inline-flex items-center gap-2 h-9 px-3 text-sm text-gray-900 bg-white border border-gray-300 rounded-md cursor-pointer focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60', className ) }
            >
                <span className="size-5 rounded-full border border-gray-300" style={ { backgroundColor: color || 'transparent' } } />
                <span className="font-mono text-xs text-gray-700">{ color || __( 'None', 'wp-user-frontend' ) }</span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-none">
                <WpColorPicker color={ color || undefined } onChange={ ( next ) => onChange?.( next ) } enableAlpha={ enableAlpha } />
            </PopoverContent>
        </Popover>
    );
}
