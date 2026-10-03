/**
 * The one button of the WPUF admin screens (design-tokens.md §Buttons).
 *
 * Variants: primary, secondary, link (tertiary), destructive, icon.
 * Sizes: sm (32px, 6px 12px, 13px/500), md (38px, 8px 16px, 14px/600).
 * No outer margin: spacing comes from the group gap or the container.
 */
import { Button as PuiButton, Spinner, cn } from '@wedevs/plugin-ui';

const VARIANTS = {
    primary: { pui: 'default', className: 'bg-primary text-primary-foreground border-transparent hover:bg-[#10b981] active:bg-[#10b981]' },
    secondary: { pui: 'outline', className: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-700' },
    link: { pui: 'link', className: 'text-primary hover:underline p-0 h-auto border-0' },
    destructive: { pui: 'destructive', className: 'bg-red-600 text-white border-transparent hover:bg-red-700' },
    icon: { pui: 'ghost', className: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100' },
};

const SIZES = {
    sm: 'h-8 px-3 py-1.5 text-[13px] font-medium gap-1.5 rounded-md',
    md: 'h-[38px] px-4 py-2 text-sm font-semibold gap-2 rounded-md',
};

const ICON_SIZES = { sm: 'size-8 p-0 rounded-md', md: 'size-[38px] p-0 rounded-md' };

/**
 * @param {Object}  props
 * @param {string}  [props.variant='primary'] primary|secondary|link|destructive|icon
 * @param {string}  [props.size='md']         sm|md
 * @param {boolean} [props.busy]              Show a spinner and block clicks.
 * @param {string}  [props.className]         Extra classes (layout only).
 */
export default function Button( { variant = 'primary', size = 'md', busy = false, disabled, className, children, ...props } ) {
    const look = VARIANTS[ variant ] || VARIANTS.primary;
    const sizing = 'icon' === variant ? ICON_SIZES[ size ] || ICON_SIZES.md : SIZES[ size ] || SIZES.md;

    return (
        <PuiButton
            type="button"
            variant={ look.pui }
            disabled={ disabled || busy }
            aria-busy={ busy || undefined }
            className={ cn( 'shadow-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed', sizing, look.className, className ) }
            { ...props }
        >
            { busy && <Spinner className="size-4" /> }
            { children }
        </PuiButton>
    );
}
