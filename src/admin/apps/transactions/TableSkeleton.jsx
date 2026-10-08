/**
 * Loading state of the payments table: the table's frame with bars, as the
 * forms lists' skeleton.
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';
import { Skeleton } from '@wedevs/plugin-ui';

const ROW = 'flex items-center gap-4 px-4 border-0 border-b border-solid border-gray-200';

export default function TableSkeleton( { rows = 6 } ) {
    return (
        <div role="status" aria-busy="true" aria-live="polite">
            <span className="sr-only">{ __( 'Loading…', 'wp-user-frontend' ) }</span>
            <div className={ ROW + ' h-10' }>
                <Skeleton className="size-4 rounded-[4px] bg-gray-200" />
                <Skeleton className="h-3 w-24 bg-gray-200" />
            </div>
            { Array.from( { length: rows } ).map( ( _, index ) => (
                <div key={ index } className={ ROW + ' h-14 last:border-b-0' }>
                    <Skeleton className="size-4 rounded-[4px] bg-gray-200" />
                    <Skeleton className="h-3.5 w-16 bg-gray-200" />
                    <Skeleton className="h-5 w-20 rounded-full bg-gray-200" />
                    <Skeleton className="h-3.5 flex-1 bg-gray-200" />
                    <Skeleton className="hidden h-3.5 w-24 bg-gray-200 md:block" />
                    <Skeleton className="hidden h-3.5 w-24 bg-gray-200 md:block" />
                </div>
            ) ) }
        </div>
    );
}
