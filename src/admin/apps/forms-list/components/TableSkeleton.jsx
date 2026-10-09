/**
 * Loading state of the forms table (FlyHR TableSkeleton, inside the list
 * card): the table's own frame (40px header row, 56px rows, same borders)
 * with skeleton bars, so nothing jumps when the rows arrive. Plain screen
 * markup like the table; only the bars are plugin-ui parts.
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';
import { Skeleton } from '@wedevs/plugin-ui';

const ROW = 'flex items-center gap-4 px-4 border-0 border-b border-solid border-gray-200';

const TableSkeleton = ( { rows = 6, checkbox = true } ) => (
    <div role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">{ __( 'Loading…', 'wp-user-frontend' ) }</span>
        <div className={ ROW + ' h-10' }>
            { checkbox ? <Skeleton className="size-4 rounded-[4px] bg-gray-200" /> : null }
            <Skeleton className="h-3 w-24 bg-gray-200" />
        </div>
        { Array.from( { length: rows } ).map( ( _, index ) => (
            <div key={ index } className={ ROW + ' h-14 last:border-b-0' }>
                { checkbox ? <Skeleton className="size-4 rounded-[4px] bg-gray-200" /> : null }
                <Skeleton className="h-3.5 flex-1 bg-gray-200" />
                <Skeleton className="hidden h-3.5 w-32 bg-gray-200 sm:block" />
                <Skeleton className="hidden h-3.5 w-24 bg-gray-200 md:block" />
                <Skeleton className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
        ) ) }
    </div>
);

export default TableSkeleton;
