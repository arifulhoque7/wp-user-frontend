/**
 * DESCRIPTION: MultiSelect dropdown component with search, pills, and drag-to-reorder.
 * DESCRIPTION: Adapted from wpuf-pro user-directory module for subscription taxonomy fields.
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const MultiSelect = ( { options, value, onChange, placeholder, sortable = false, searchable = true, selectedLabel = 'items', exclusiveOptions = [ 'all' ], disabled = false } ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ dragIndex, setDragIndex ] = useState( null );
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const dropdownRef = useRef( null );
	const searchInputRef = useRef( null );

	// Helper function to get display text from option value
	const getOptionDisplayText = ( key ) => {
		const option = options[ key ];
		if ( typeof option === 'string' ) {
			return option;
		}
		if ( option && typeof option === 'object' && option.label ) {
			return option.label;
		}
		return key;
	};

	// Close dropdown on outside click
	useEffect( () => {
		const handleClick = ( e ) => {
			if ( dropdownRef.current && ! dropdownRef.current.contains( e.target ) ) {
				setIsOpen( false );
				setSearchTerm( '' );
			}
		};
		document.addEventListener( 'mousedown', handleClick );
		return () => document.removeEventListener( 'mousedown', handleClick );
	}, [] );

	// Focus search input when dropdown opens
	useEffect( () => {
		if ( isOpen && searchable && searchInputRef.current ) {
			setTimeout( () => {
				searchInputRef.current?.focus();
			}, 100 );
		}
	}, [ isOpen, searchable ] );

	// Handle select/deselect with exclusive options logic
	const handleSelect = ( key ) => {
		if ( disabled ) {
			return;
		}

		// Check if the selected key is an exclusive option
		if ( exclusiveOptions.includes( key ) ) {
			onChange( [ key ] );
			setIsOpen( false );
			setSearchTerm( '' );
			return;
		}
		// Remove all exclusive options when selecting a non-exclusive option
		let newValue = value.filter( ( k ) => ! exclusiveOptions.includes( k ) );
		if ( ! newValue.includes( key ) ) {
			newValue = [ ...newValue, key ];
		}
		onChange( newValue );
		setIsOpen( false );
		setSearchTerm( '' );
	};

	const handleRemove = ( key ) => {
		if ( disabled ) {
			return;
		}

		// If removing an exclusive option, clear all selections
		if ( exclusiveOptions.includes( key ) ) {
			onChange( [] );
		} else {
			const newValue = value.filter( ( k ) => k !== key );
			onChange( newValue );
		}
	};

	// Drag and drop handlers (only if sortable)
	const handleDragStart = ( index ) => sortable && setDragIndex( index );
	const handleDragOver = ( index ) => {
		if ( ! sortable || dragIndex === null || dragIndex === index ) {
			return;
		}
		const newValue = [ ...value ];
		const [ removed ] = newValue.splice( dragIndex, 1 );
		newValue.splice( index, 0, removed );
		setDragIndex( index );
		onChange( newValue );
	};
	const handleDragEnd = () => sortable && setDragIndex( null );

	// Filter options based on search term and already selected values
	const getFilteredOptions = () => {
		let filtered = Object.keys( options ).filter( ( key ) => ! value.includes( key ) );

		if ( searchable && searchTerm.trim() ) {
			const searchLower = searchTerm.toLowerCase();
			filtered = filtered.filter( ( key ) => {
				const displayText = getOptionDisplayText( key );
				return displayText.toLowerCase().includes( searchLower );
			} );
		}

		return filtered;
	};

	const availableOptions = getFilteredOptions();

	// Get display text for selected values
	const getDisplayText = () => {
		if ( value.length === 0 ) {
			return placeholder;
		}
		// Show count if more than 3 items selected
		if ( value.length > 3 ) {
			return `${ value.length } ${ selectedLabel } ${ __( 'selected', 'wp-user-frontend' ) }`;
		}
		// Show first 3 items if 3 or fewer selected
		return value.slice( 0, 3 ).map( ( k ) => getOptionDisplayText( k ) ).join( ', ' );
	};

	// Handle search input change
	const handleSearchChange = ( e ) => {
		setSearchTerm( e.target.value );
	};

	// Handle search input keydown
	const handleSearchKeyDown = ( e ) => {
		if ( e.key === 'Escape' ) {
			setIsOpen( false );
			setSearchTerm( '' );
		} else if ( e.key === 'Enter' && availableOptions.length > 0 ) {
			handleSelect( availableOptions[ 0 ] );
		}
	};

	return (
		<div className="relative" ref={ dropdownRef }>
			<button
				type="button"
				className="flex w-full text-gray-700 font-normal leading-none text-left items-center justify-between rounded-md border border-gray-300 bg-white py-2 px-3 shadow-xs focus:outline-hidden focus:ring-1 focus:ring-primary sm:text-sm"
				aria-haspopup="listbox"
				aria-expanded={ isOpen }
				disabled={ disabled }
				onClick={ () => setIsOpen( ( open ) => ! open ) }
			>
				<span
					className={ value.length === 0 ? 'text-gray-400' : 'text-gray-700' }
					style={ {
						display: 'block',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
						maxWidth: 'calc(100% - 24px)',
					} }
				>
					{ getDisplayText() }
				</span>
				<svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			{ isOpen && (
				<ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto p-0 m-0 list-none" role="listbox">
					{/* Search input */}
					{ searchable && (
						<li className="sticky top-0 bg-white border-b border-gray-200 p-2 mb-0!">
							<input
								ref={ searchInputRef }
								type="text"
								value={ searchTerm }
								onChange={ handleSearchChange }
								onKeyDown={ handleSearchKeyDown }
								placeholder={ __( 'Search options...', 'wp-user-frontend' ) }
								className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
							/>
						</li>
					) }
					{ availableOptions.length === 0 && (
						<li className="p-3 text-gray-400 text-sm mb-0!">
							{ searchTerm.trim() ? __( 'No matching options', 'wp-user-frontend' ) : __( 'No more options', 'wp-user-frontend' ) }
						</li>
					) }
					{ availableOptions.map( ( key ) => (
						<li
							key={ key }
							className="cursor-pointer p-3 mb-0! hover:bg-gray-100 text-sm text-left"
							role="option"
							aria-selected={ false }
							tabIndex={ 0 }
							onClick={ () => handleSelect( key ) }
							onKeyDown={ ( e ) => {
								if ( e.key === 'Enter' || e.key === ' ' ) {
									handleSelect( key );
								}
							} }
						>
							{ getOptionDisplayText( key ) }
						</li>
					) ) }
				</ul>
			) }
			{/* Pills for selected items */}
			{ value.length > 0 && (
				<div className="flex flex-wrap gap-2 mt-3">
					{ value.map( ( key, idx ) => (
						<div
							key={ key }
							className={
								'group/item flex items-center bg-gray-50 border border-gray-200 rounded-sm px-3 py-1 text-sm shadow-xs ' +
								( sortable ? 'cursor-move ' : '' ) +
								'transition-colors duration-150 hover:border-primary hover:bg-emerald-50'
							}
							draggable={ sortable }
							onDragStart={ sortable ? () => handleDragStart( idx ) : undefined }
							onDragOver={ sortable ? ( e ) => {
								e.preventDefault();
								handleDragOver( idx );
							} : undefined }
							onDragEnd={ sortable ? handleDragEnd : undefined }
							tabIndex={ 0 }
							aria-label={ sortable ? __( 'Drag to reorder', 'wp-user-frontend' ) : undefined }
						>
							<span className="text-gray-800">
								{ getOptionDisplayText( key ) }
							</span>
							{ ! disabled && (
								<button
									type="button"
									className="ml-1 text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 w-4 h-4 flex items-center justify-center"
									aria-label={ __( 'Remove', 'wp-user-frontend' ) }
									onClick={ () => handleRemove( key ) }
								>
									&times;
								</button>
							) }
						</div>
					) ) }
				</div>
			) }
		</div>
	);
};

export default MultiSelect;
