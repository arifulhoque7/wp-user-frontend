/**
 * DESCRIPTION: SubscriptionField component for rendering individual form fields
 * DESCRIPTION: Handles various field types: input-text, input-number, textarea, switcher, select, inline, time-date, multi-select
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import ProBadge from './ProBadge';
import ProTooltip from './ProTooltip';
import MultiSelect from './MultiSelect';

const SubscriptionField = ( { field, fieldId, subscription, onFieldChange } ) => {
	const wpufSubscriptions = window.wpufSubscriptions || {};

	// Get hidden fields from store
	const hiddenFields = useSelect(
		( select ) => {
			const store = select( 'wpuf/subscriptions-field-dependency' );
			return store ? store.getHiddenFields() : [];
		},
		[]
	);

	// Get taxonomy restriction values from store for multi-select fields
	const isViewRestriction = field.db_key === '_sub_view_allowed_term_ids';
	const { taxonomySelected, fullRestriction } = useSelect(
		( select ) => {
			if ( field.type !== 'multi-select' ) {
				return { taxonomySelected: [], fullRestriction: {} };
			}
			const store = select( 'wpuf/subscriptions' );
			const restriction = isViewRestriction
				? store.getTaxonomyViewRestriction()
				: store.getTaxonomyRestriction();
			return {
				taxonomySelected: restriction[ field.name ] || [],
				fullRestriction: restriction,
			};
		},
		[ field.type, field.name, field.db_key ]
	);

	const dispatch = useDispatch( 'wpuf/subscriptions-field-dependency' );
	const subscriptionsDispatch = useDispatch( 'wpuf/subscriptions' );

	// Convert term_fields array to options object for MultiSelect component
	const multiSelectOptions = useMemo( () => {
		if ( field.type !== 'multi-select' || ! field.term_fields ) {
			return {};
		}
		const termsList = Array.isArray( field.term_fields ) ? field.term_fields : Object.values( field.term_fields );
		const opts = {};
		termsList.forEach( ( term ) => {
			opts[ String( term.value ) ] = term.label;
		} );
		return opts;
	}, [ field.type, field.term_fields ] );

	// Check if field should be hidden
	const isHidden = hiddenFields.includes( fieldId );

	// Check if Pro feature
	const isPro = field.is_pro && ! wpufSubscriptions.isProActive;

	// Get field value based on db_type
	const getFieldValue = () => {
		if ( ! subscription ) {
			return field.default || '';
		}

		switch ( field.db_type ) {
			case 'meta':
				return subscription.meta_value?.[ field.db_key ] || field.default || '';

			case 'meta_serialized':
				if ( subscription.meta_value?.[ field.db_key ] ) {
					return subscription.meta_value[ field.db_key ][ field.serialize_key ] || field.default || '';
				}
				return field.default || '';

			case 'post':
				return subscription[ field.db_key ] || field.default || '';

			default:
				return field.default || '';
		}
	};

	// Parse expiration time value (e.g., "30 day" -> { value: "30", unit: "day" })
	const parseExpirationTime = ( timeString ) => {
		if ( ! timeString || typeof timeString !== 'string' ) {
			return { value: '', unit: 'day' };
		}
		const parts = timeString.trim().split( ' ' );
		return {
			value: parts[ 0 ] || '',
			unit: parts[ 1 ] || 'day',
		};
	};

	const value = getFieldValue();

	// Handle field value change
	const handleChange = ( newValue ) => {
		onFieldChange( field, newValue );

		// Handle field dependencies for switcher type
		if ( field.type === 'switcher' && dispatch ) {
			dispatch.toggleDependentFields( fieldId, newValue );
		}
	};

	// Switcher state, read as develop's Vue screen did ('on' / 'yes'; the
	// post_status switcher is on for 'private'). true / '1' are accepted too so
	// values saved by earlier React builds still show correctly.
	const isSwitcherOn = value === 'on' || value === 'yes' || value === true || value === '1'
		|| ( field.db_key === 'post_status' && value === 'private' );

	// Store the strings develop stores: 'on' / 'off' ('private' / 'publish' for
	// post_status). Consumers compare with 'on' (subscription checks, Stripe JS).
	const toggleSwitcher = () => {
		const nextOn = ! isSwitcherOn;
		const stored = field.db_key === 'post_status'
			? ( nextOn ? 'private' : 'publish' )
			: ( nextOn ? 'on' : 'off' );

		onFieldChange( field, stored );

		if ( dispatch ) {
			dispatch.toggleDependentFields( fieldId, nextOn );
		}
	};

	if ( isHidden ) {
		return null;
	}

	// Allow Pro and third-party plugins to override field rendering for custom field types
	const customField = applyFilters(
		'wpuf.subscription.fieldComponent',
		null,
		field,
		{ fieldId, value, subscription, onFieldChange, handleChange, isPro, getFieldValue }
	);

	if ( customField ) {
		return customField;
	}

	return (
		<div className="grid grid-cols-3 gap-4 p-4">
			{/* Label */}
			{ field.label && (
				<div className="flex items-center text-sm leading-6 text-gray-600">
					<label htmlFor={ field.name } dangerouslySetInnerHTML={ { __html: field.label } } />
					{ field.tooltip && (
						<span className="wpuf-tooltip before:bg-gray-700 before:text-zinc-50 after:border-t-gray-700 after:border-x-transparent cursor-pointer ml-2 z-10" data-tip={ field.tooltip }>
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none">
								<path d="M9.833 12.333H9V9h-.833M9 5.667h.008M16.5 9a7.5 7.5 0 1 1-15 0 7.5 7.5 0 1 1 15 0z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</span>
					) }
					<span className="pro-icon-title relative pt-1 group">
						<ProBadge isPro={ field.is_pro } />
						<ProTooltip isPro={ field.is_pro } />
					</span>
				</div>
			) }

			{/* Field Input */}
			<div className="col-span-2 relative group">
				{/* Pro overlay */}
				{ isPro && (
					<div className="hidden rounded-md border border-dashed border-emerald-200 group-hover:flex cursor-pointer absolute items-center justify-center bg-emerald-50/50 backdrop-blur-xs z-10 p-4 w-[104%] h-[180%] top-[-40%] left-[-2%]">
						<a
							href={ wpufSubscriptions.upgradeUrl || '#' }
							target="_blank"
							rel="noopener noreferrer"
							className="wpuf-button button-upgrade-to-pro inline-flex items-center px-4 py-2 bg-emerald-600 focus:bg-emerald-700 hover:bg-emerald-700 text-white rounded-md gap-2 font-medium text-sm"
						>
							{ __( 'Upgrade to Pro', 'wp-user-frontend' ) }
						</a>
					</div>
				) }

				{/* Input Text */}
				{ field.type === 'input-text' && (
					<input
						type="text"
						id={ field.name }
						name={ field.name }
						value={ value }
						placeholder={ field.placeholder || '' }
						onChange={ ( e ) => handleChange( e.target.value ) }
						disabled={ isPro }
						className="placeholder:text-gray-400 w-full rounded-md bg-white py-1 pl-3 pr-10 text-left shadow-xs focus:border-primaryHover! focus:outline-hidden focus:ring-1 focus:ring-primaryHover sm:text-sm shadow-none! border-gray-300!"
					/>
				) }

				{/* Input Number */}
				{ field.type === 'input-number' && (
					<input
						type="number"
						id={ field.name }
						name={ field.name }
						value={ value }
						placeholder={ field.placeholder || '' }
						min={ field.min }
						step={ field.step }
						onChange={ ( e ) => handleChange( e.target.value ) }
						onKeyDown={ ( e ) => {
							const allowedKeys = [ 'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', '.' ];
							if ( ! allowedKeys.includes( e.key ) && isNaN( Number( e.key ) ) ) {
								e.preventDefault();
							}
						} }
						disabled={ isPro }
						className="placeholder:text-gray-400 w-full rounded-md bg-white py-1 pl-3 pr-10 text-left shadow-xs focus:border-primaryHover! focus:outline-hidden focus:ring-1 focus:ring-primaryHover sm:text-sm shadow-none! border-gray-300!"
					/>
				) }

				{/* Textarea */}
				{ field.type === 'textarea' && (
					<textarea
						id={ field.name }
						name={ field.name }
						value={ value }
						placeholder={ field.placeholder || '' }
						rows="3"
						onChange={ ( e ) => handleChange( e.target.value ) }
						disabled={ isPro }
						className="placeholder:text-gray-400 w-full rounded-md bg-white py-1 pl-3 pr-10 text-left shadow-xs focus:border-primaryHover! focus:outline-hidden focus:ring-1 focus:ring-primaryHover sm:text-sm shadow-none! border-gray-300!"
					/>
				) }

				{/* Switcher */}
				{ field.type === 'switcher' && (
					<button
						type="button"
						id={ field.name }
						name={ field.name }
						onClick={ toggleSwitcher }
						disabled={ isPro }
						className={ `${ isSwitcherOn ? 'bg-primary' : 'bg-gray-200' } placeholder:text-gray-400 bg-gray-200 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out` }
						role="switch"
						aria-checked={ isSwitcherOn }
					>
						<span
							aria-hidden="true"
							className={ `${ isSwitcherOn ? 'translate-x-5' : 'translate-x-0' } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out` }
						/>
					</button>
				) }

				{/* Select */}
				{ field.type === 'select' && field.options && (
					<select
						id={ field.name }
						name={ field.name }
						value={ value }
						onChange={ ( e ) => handleChange( e.target.value ) }
						disabled={ isPro }
						className="w-full max-w-full! rounded-md bg-white py-1 pl-3 pr-10 text-left shadow-xs focus:border-primaryHover! focus:outline-hidden focus:ring-1 focus:ring-primaryHover sm:text-sm border-gray-300!"
					>
						{ Object.entries( field.options ).map( ( [ key, label ] ) => (
							<option key={ key } value={ key }>
								{ label }
							</option>
						) ) }
					</select>
				) }

				{/* Multi-Select (taxonomy terms dropdown with pills) */}
				{ field.type === 'multi-select' && field.term_fields && (
					<MultiSelect
						options={ multiSelectOptions }
						value={ taxonomySelected.map( String ) }
						onChange={ ( selected ) => {
							const merged = {
								...fullRestriction,
								[ field.name ]: selected,
							};

							if ( isViewRestriction ) {
								subscriptionsDispatch.setTaxonomyViewRestriction( merged );
							} else {
								subscriptionsDispatch.setTaxonomyRestriction( merged );
							}
							subscriptionsDispatch.setIsDirty( true );
						} }
						placeholder={ field.placeholder || __( 'Select terms...', 'wp-user-frontend' ) }
						selectedLabel={ __( 'terms', 'wp-user-frontend' ) }
						exclusiveOptions={ [] }
						disabled={ isPro }
					/>
				) }

				{/* Inline - compound field with multiple inputs */}
				{ field.type === 'inline' && field.fields && (
					<div className="flex gap-2 items-center">
						{ Object.entries( field.fields ).map( ( [ subFieldKey, subField ] ) => {
							// Get sub-field value
							let subFieldValue = subField.default || '';

							if ( subscription ) {
								const stored = subscription.meta_value?.[ subField.db_key ];

								if ( stored !== undefined && stored !== null ) {
									subFieldValue = stored;
								} else if ( field.name === 'expiration-time' && subscription.meta_value?._post_expiration_time ) {
									// Older packs only have the combined "number period" value.
									const parsed = parseExpirationTime( subscription.meta_value._post_expiration_time );
									subFieldValue = subField.key_id === 'expiration_value' ? parsed.value : parsed.unit;
								}
							}

							// Each part is stored under its own key (_post_expiration_number /
							// _post_expiration_period), which is what the REST save reads.
							const handleSubFieldChange = ( newValue ) => {
								onFieldChange( subField, newValue );
							};

							// Render input-number sub-field
							if ( subField.type === 'input-number' ) {
								return (
									<input
										key={ subFieldKey }
										type="number"
										id={ subField.name }
										name={ subField.name }
										value={ subFieldValue }
										placeholder={ subField.placeholder || '' }
										min={ subField.min }
										step={ subField.step }
										onChange={ ( e ) => handleSubFieldChange( e.target.value ) }
										onKeyDown={ ( e ) => {
											const allowedKeys = [ 'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', '.' ];
											if ( ! allowedKeys.includes( e.key ) && isNaN( Number( e.key ) ) ) {
												e.preventDefault();
											}
										} }
										disabled={ isPro }
										className="placeholder:text-gray-400 w-full rounded-md bg-white py-1 pl-3 pr-10 text-left shadow-xs focus:border-primaryHover! focus:outline-hidden focus:ring-1 focus:ring-primaryHover sm:text-sm shadow-none! border-gray-300!"
									/>
								);
							}

							// Render select sub-field
							if ( subField.type === 'select' && subField.options ) {
								return (
									<select
										key={ subFieldKey }
										id={ subField.name }
										name={ subField.name }
										value={ subFieldValue }
										onChange={ ( e ) => handleSubFieldChange( e.target.value ) }
										disabled={ isPro }
										className="w-full max-w-full! rounded-md bg-white py-1 pl-3 pr-10 text-left shadow-xs focus:border-primaryHover! focus:outline-hidden focus:ring-1 focus:ring-primaryHover sm:text-sm border-gray-300!"
									>
										{ Object.entries( subField.options ).map( ( [ key, label ] ) => (
											<option key={ key } value={ key }>
												{ label }
											</option>
										) ) }
									</select>
								);
							}

							return null;
						} ) }
					</div>
				) }

				{/* Time-Date */}
				{ field.type === 'time-date' && (
					<input
						type="datetime-local"
						id={ field.name }
						name={ field.name }
						value={ value ? value.replace( ' ', 'T' ) : '' }
						onChange={ ( e ) => {
							// Convert datetime-local format (YYYY-MM-DDTHH:mm) to MySQL format (YYYY-MM-DD HH:mm:ss)
							const newVal = e.target.value.replace( 'T', ' ' ) + ':00';
							handleChange( newVal );
						} }
						disabled={ isPro }
						className="placeholder:text-gray-400 w-full rounded-md bg-white py-1 pl-3 pr-10 text-left shadow-xs focus:border-primaryHover! focus:outline-hidden focus:ring-1 focus:ring-primaryHover sm:text-sm shadow-none! border-gray-300!"
					/>
				) }

				{/* Description */}
				{ field.description && (
					<div className="label">
						<span className="label-text-alt">{ field.description }</span>
					</div>
				) }
			</div>
		</div>
	);
};

export default SubscriptionField;
