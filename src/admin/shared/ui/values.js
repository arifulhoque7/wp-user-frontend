/**
 * Value rules of the shared/ui controls (kept pure for tests). Stored values
 * stay as typed: no `||` fallbacks, `''` is a real value (components.md).
 */

/**
 * Whether a key press may go into a number input that does not allow
 * negative numbers (develop blocks `-`).
 *
 * @param {string}  key           KeyboardEvent.key.
 * @param {boolean} allowNegative Negative numbers allowed.
 *
 * @return {boolean} Allowed.
 */
export function numberKeyAllowed( key, allowNegative ) {
    return allowNegative || '-' !== key;
}

/**
 * The value a Select shows: the stored value when it is one of the options,
 * else nothing (the placeholder). The stored value is never rewritten here.
 *
 * @param {*}     value   Stored value.
 * @param {Array} options [{ value, label }].
 *
 * @return {string|null} Option value or null.
 */
export function selectShownValue( value, options ) {
    if ( null === value || undefined === value ) {
        return null;
    }

    const wanted = String( value );

    return ( options || [] ).some( ( option ) => String( option.value ) === wanted ) ? wanted : null;
}

/**
 * Options in one shape: arrays of { value, label } or a { value: label } map.
 *
 * @param {Array|Object} options Options.
 *
 * @return {Array} [{ value: string, label: string, disabled?: boolean }]
 */
export function normalizeOptions( options ) {
    if ( Array.isArray( options ) ) {
        return options.map( ( option ) => ( 'object' === typeof option && null !== option
            ? { ...option, value: String( option.value ), label: String( option.label ?? option.value ) }
            : { value: String( option ), label: String( option ) } ) );
    }

    return Object.keys( options || {} ).map( ( key ) => ( { value: key, label: String( options[ key ] ) } ) );
}
