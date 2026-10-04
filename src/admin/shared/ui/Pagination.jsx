/**
 * Pagination on plugin-ui's Pagination parts, with the two develop
 * behaviours and sizes (controlled by currentPage):
 * - variant "simple" (forms lists): Previous / Next, pages current +/- 2
 *   with an underline on the current one; nothing for a single page;
 * - variant "summary" (subscriptions): "Showing X to Y of Z results" and a
 *   boxed group of 3 pages whose edge buttons go to the first / last page.
 */
import { Pagination as PuiPagination, PaginationContent, PaginationItem, PaginationLink, cn } from '@wedevs/plugin-ui';
import { __, sprintf } from '@wordpress/i18n';

import { pagesAround, pagesFixed } from './pages';

// Points the reading direction's way: mirrored in right-to-left admin.
const Chevron = ( { dir } ) => (
    <svg className="size-5 rtl:-scale-x-100" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        { 'prev' === dir
            ? <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            : <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /> }
    </svg>
);

/**
 * @param {Object}   props
 * @param {number}   props.currentPage  Current page (1-based).
 * @param {Function} props.onPageChange ( page ) => void
 * @param {string}   [props.variant]    simple|summary
 * @param {number}   [props.totalPages] simple: total pages.
 * @param {number}   [props.total]      summary: number of items.
 * @param {number}   [props.perPage]    summary: items per page.
 */
export default function Pagination( { currentPage, onPageChange, variant = 'simple', totalPages, total = 0, perPage = 10, className } ) {
    const pageCount = 'summary' === variant ? Math.ceil( total / perPage ) : totalPages;
    const go = ( page ) => {
        if ( page >= 1 && page <= pageCount && page !== currentPage ) {
            onPageChange( page );
        }
    };

    if ( 'summary' === variant ) {
        const first = ( currentPage - 1 ) * perPage + 1;
        const last = Math.min( currentPage * perPage, total );
        /* translators: 1: first item number, 2: last item number, 3: total items */
        const summary = sprintf( __( 'Showing %1$s to %2$s of %3$s results', 'wp-user-frontend' ), first, last, total );
        // develop subscriptions pagination: inset rings, no borders, content-width pages.
        const box = 'h-auto size-auto rounded-none border-0 shadow-none ring-1 ring-inset ring-gray-300 focus:z-20';
        const edge = cn( box, 'px-2 py-2 text-[13px] leading-[1.4] font-normal text-gray-400 bg-transparent hover:bg-gray-50 aria-disabled:bg-gray-50 aria-disabled:cursor-not-allowed' );
        const item = ( key, { label, current, disabled, onClick, extra } ) => (
            <PaginationItem key={ key }>
                <PaginationLink
                    href="#"
                    isActive={ current }
                    aria-disabled={ disabled || undefined }
                    onClick={ ( event ) => {
                        event.preventDefault();
                        if ( ! disabled ) {
                            onClick();
                        }
                    } }
                    className={ extra }
                >
                    { label }
                </PaginationLink>
            </PaginationItem>
        );

        return (
            <div data-wpuf-ui="" className={ cn( 'flex items-center justify-between border-t border-gray-200 bg-white py-3 px-6', className ) }>
                <p className="m-0 text-sm text-gray-700">{ summary }</p>
                { total > perPage && (
                    <PuiPagination className="mx-0 w-auto" aria-label={ __( 'Pagination', 'wp-user-frontend' ) }>
                        <PaginationContent className="isolate gap-0 -space-x-px rounded-md shadow-xs">
                            { item( 'first', { label: <><span className="sr-only">{ __( 'Previous', 'wp-user-frontend' ) }</span><Chevron dir="prev" /></>, disabled: 1 === currentPage, onClick: () => go( 1 ), extra: cn( edge, 'rounded-l-md' ) } ) }
                            { pagesFixed( currentPage, pageCount ).map( ( page ) => item( page, {
                                label: page,
                                current: page === currentPage,
                                onClick: () => go( page ),
                                extra: cn( box, 'px-4 py-2 text-sm font-semibold border-0', page === currentPage ? 'bg-primary text-white hover:bg-[#10b981] hover:text-white' : 'bg-transparent text-gray-900 hover:bg-gray-50' ),
                            } ) ) }
                            { item( 'last', { label: <><span className="sr-only">{ __( 'Next', 'wp-user-frontend' ) }</span><Chevron dir="next" /></>, disabled: currentPage === pageCount, onClick: () => go( pageCount ), extra: cn( edge, 'rounded-r-md' ) } ) }
                        </PaginationContent>
                    </PuiPagination>
                ) }
            </div>
        );
    }

    if ( pageCount <= 1 ) {
        return null;
    }

    const step = 'h-auto size-auto gap-1 px-0 text-sm font-medium text-gray-700 bg-transparent border-0 shadow-none hover:bg-transparent hover:text-primary aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:hover:text-gray-700';
    const link = ( page, onClick, disabled, extra, children ) => (
        <PaginationLink
            href="#"
            aria-disabled={ disabled || undefined }
            onClick={ ( event ) => {
                event.preventDefault();
                if ( ! disabled ) {
                    onClick();
                }
            } }
            className={ extra }
        >
            { children }
        </PaginationLink>
    );

    return (
        <PuiPagination className={ cn( 'mx-0 justify-start', className ) } aria-label={ __( 'Pagination', 'wp-user-frontend' ) }>
            <PaginationContent className="w-full gap-0">
                <PaginationItem className="mr-3">
                    { link( currentPage - 1, () => go( currentPage - 1 ), 1 === currentPage, step, <><Chevron dir="prev" /> { __( 'Previous', 'wp-user-frontend' ) }</> ) }
                </PaginationItem>
                { pagesAround( currentPage, pageCount ).map( ( page ) => (
                    <PaginationItem key={ page } className="mx-1">
                        <PaginationLink
                            href="#"
                            isActive={ page === currentPage }
                            onClick={ ( event ) => {
                                event.preventDefault();
                                go( page );
                            } }
                            className={ cn( 'h-auto size-auto px-4 py-2 text-sm font-medium rounded-none bg-transparent shadow-none border-0 border-t-2 hover:bg-transparent hover:border-t-primary', page === currentPage ? 'text-primary border-t-primary' : 'text-gray-500 border-t-transparent' ) }
                        >
                            { page }
                        </PaginationLink>
                    </PaginationItem>
                ) ) }
                <PaginationItem className="ml-3">
                    { link( currentPage + 1, () => go( currentPage + 1 ), currentPage === pageCount, step, <>{ __( 'Next', 'wp-user-frontend' ) } <Chevron dir="next" /></> ) }
                </PaginationItem>
            </PaginationContent>
        </PuiPagination>
    );
}
