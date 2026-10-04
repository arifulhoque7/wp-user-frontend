/**
 * Loading placeholders on plugin-ui Skeleton / Spinner.
 * - Skeleton: `lines` bars (or one block with className sizing);
 * - Loading: the centered primary spinner the subscriptions screen shows
 *   while it loads (48px, develop's green-500), as plugin-ui's Spinner.
 */
import { Skeleton as PuiSkeleton, Spinner, cn } from '@wedevs/plugin-ui';
import { __ } from '@wordpress/i18n';

/**
 * @param {Object} props
 * @param {number} [props.lines] Number of bars (default 1).
 */
export default function Skeleton( { lines = 1, className } ) {
    return (
        <div data-wpuf-ui="" className="grid gap-3" aria-busy="true" aria-live="polite">
            { Array.from( { length: lines } ).map( ( _, index ) => (
                <PuiSkeleton key={ index } className={ cn( 'h-4 rounded-md bg-gray-200', index === lines - 1 && lines > 1 && 'w-2/3', className ) } />
            ) ) }
        </div>
    );
}

/**
 * @param {Object} props
 * @param {string} [props.label]  Screen reader text.
 * @param {string} [props.height] Area height class (default full viewport like develop).
 */
export function Loading( { label, height = 'h-svh', className } ) {
    return (
        <div data-wpuf-ui="" className={ cn( 'flex items-center justify-center', height, className ) } role="status">
            <Spinner className="size-12 text-green-500" />
            <span className="sr-only">{ label || __( 'Loading…', 'wp-user-frontend' ) }</span>
        </div>
    );
}
