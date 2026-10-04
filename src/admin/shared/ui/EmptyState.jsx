/**
 * Empty state, the develop cases:
 * - size "md" (forms list "No Post Forms Created Yet" / "No Items Here!"):
 *   padded white block, optional image, 18px title (32px above), text
 *   (32px above, 40px below when there are actions), actions 12px apart;
 * - size "compact" (forms list "no match"): just the title, 32px above;
 * - size "lg" (subscriptions "No Subscription created yet!"): 50vh centered
 *   block, 30px title, text 32px below it, actions 48px below.
 */
import { cn } from '@wedevs/plugin-ui';

/**
 * @param {Object} props
 * @param {*}      props.title         Title.
 * @param {*}      [props.description] Text under the title.
 * @param {string} [props.image]       Image URL (local asset).
 * @param {*}      [props.icon]        Inline icon above the title (lg).
 * @param {*}      [props.actions]     Buttons.
 * @param {string} [props.size]        md|compact|lg
 */
export default function EmptyState( { title, description, image, icon, actions, size = 'md', className } ) {
    if ( 'compact' === size ) {
        return (
            <div data-wpuf-ui="" className={ cn( 'text-center', className ) }>
                <h2 className="m-0 mt-8 text-lg font-normal text-gray-800">{ title }</h2>
            </div>
        );
    }

    if ( 'lg' === size ) {
        return (
            <div data-wpuf-ui="" className={ cn( 'flex h-[50vh] items-center justify-center', className ) }>
                <div className="w-3/4 text-center">
                    { image && <img src={ image } alt="" className="mx-auto max-w-full" /> }
                    { icon }
                    { title && <h3 className="m-0 text-3xl font-normal text-gray-900">{ title }</h3> }
                    { description && <p className="m-0 mt-8 text-sm text-gray-500 text-center">{ description }</p> }
                    { actions && <div className="mt-12 flex justify-center gap-3">{ actions }</div> }
                </div>
            </div>
        );
    }

    return (
        <div data-wpuf-ui="" className={ cn( 'grid min-h-full bg-white px-6 py-24 sm:py-32 lg:px-8', className ) }>
            <div className="flex flex-col items-center">
                { image && <img src={ image } alt="" className="max-w-full" /> }
                { title && <h2 className="m-0 mt-8 text-lg font-normal text-gray-800">{ title }</h2> }
                { description && <p className={ cn( 'm-0 mt-8 text-sm text-gray-500', actions && 'mb-10' ) }>{ description }</p> }
                { actions && <div className="flex justify-center gap-3">{ actions }</div> }
            </div>
        </div>
    );
}
