/**
 * DESCRIPTION: Pagination component for subscription list
 * DESCRIPTION: Handles page navigation with configurable buttons
 */
import { useState, useMemo } from '@wordpress/element';

const Pagination = ( { currentPage, count, maxVisibleButtons = 3, perPage, onChangePage } ) => {
	const [ currentPg, setCurrentPg ] = useState( currentPage );

	const totalPages = Math.ceil( count / perPage );

	const isInFirstPage = currentPg === 1;
	const isInLastPage = currentPg === totalPages;

	const startPage = useMemo( () => {
		if ( currentPg === 1 || totalPages <= maxVisibleButtons ) {
			return 1;
		}
		if ( currentPg === totalPages ) {
			return totalPages - maxVisibleButtons;
		}
		return currentPg - 1;
	}, [ currentPg, totalPages, maxVisibleButtons ] );

	const startNumber = ( currentPg - 1 ) * perPage + 1;
	const endNumber = Math.min( currentPg * perPage, count );

	const pages = useMemo( () => {
		const range = [];
		for (
			let i = startPage;
			i <= Math.min( startPage + maxVisibleButtons - 1, totalPages );
			i++
		) {
			range.push( {
				name: i,
				isDisabled: i === currentPg,
			} );
		}
		return range;
	}, [ startPage, maxVisibleButtons, totalPages, currentPg ] );

	const goToFirstPage = () => {
		setCurrentPg( 1 );
		onChangePage( 1 );
	};

	const goToLastPage = () => {
		setCurrentPg( totalPages );
		onChangePage( totalPages );
	};

	const goToPage = ( page ) => {
		setCurrentPg( page );
		onChangePage( page );
	};

	return (
		<div className="flex items-center justify-between border-t border-gray-200 bg-white py-3 px-6 mt-16">
			<div className="flex flex-1 items-center justify-between">
				<div>
					<p className="text-sm text-gray-700">
						Showing
						<span className="font-medium"> { startNumber } </span>
						to
						<span className="font-medium"> { endNumber } </span>
						of
						<span className="font-medium"> { count } </span>
						results
					</p>
				</div>
				{ count > perPage && (
					<nav className="isolate inline-flex [&>:not([hidden])~:not([hidden])]:-ml-px [&>:not([hidden])~:not([hidden])]:mr-0 rounded-md shadow-xs" aria-label="Pagination">
						<button
							onClick={ goToFirstPage }
							disabled={ isInFirstPage }
							className={ `relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${ isInFirstPage ? 'bg-gray-50 cursor-not-allowed' : '' }` }
						>
							<span className="sr-only">Previous</span>
							<svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
							</svg>
						</button>
						{ pages.map( ( page ) => (
							<button
								key={ page.name }
								onClick={ () => goToPage( page.name ) }
								className={ `relative items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 inline-flex ${ currentPg === page.name ? 'bg-primary text-white hover:bg-primaryHover' : '' }` }
							>
								{ page.name }
							</button>
						) ) }
						<button
							onClick={ goToLastPage }
							disabled={ isInLastPage }
							className={ `relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${ isInLastPage ? 'bg-gray-50 cursor-not-allowed' : '' }` }
						>
							<span className="sr-only">Next</span>
							<svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
							</svg>
						</button>
					</nav>
				) }
			</div>
		</div>
	);
};

export default Pagination;
