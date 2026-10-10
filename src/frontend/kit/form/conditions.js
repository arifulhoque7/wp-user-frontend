/**
 * Conditional logic from the stored `wpuf_cond` setting, evaluated on every
 * value change (the rules Pro's conditional-logic.js applies to the classic
 * form): with the logic on, a field is hidden until its conditions match
 * (`any` or `all`); a condition compares another field's value with an
 * option (`=` or `!=`); a hidden field posts nothing.
 *
 * @since WPUF_SINCE
 */

const on = ( value ) => 'yes' === value || 'on' === value || true === value || 'true' === value;

const asList = ( value ) => {
    if ( Array.isArray( value ) ) {
        return value.map( String );
    }

    if ( null === value || undefined === value || '' === value ) {
        return [];
    }

    return [ String( value ) ];
};

const matches = ( condition, values ) => {
    const current = asList( values[ condition.name ] );
    const equal = current.includes( String( condition.option ) );

    return '!=' === condition.operator ? ! equal : equal;
};

/**
 * Whether a field is visible for the current values.
 *
 * @param {Object} field  Field settings (with `wpuf_cond`).
 * @param {Object} values name => value
 * @return {boolean} Visible
 */
export function isVisible( field, values ) {
    const cond = field.wpuf_cond;

    if ( ! cond || ! on( cond.condition_status ) ) {
        return true;
    }

    const conditions = ( cond.conditions || [] ).filter( ( c ) => c && c.name );

    if ( ! conditions.length ) {
        return true;
    }

    const results = conditions.map( ( c ) => matches( c, values ) );

    return 'all' === cond.cond_logic ? results.every( Boolean ) : results.some( Boolean );
}

/**
 * The visible fields, in order, column fields recursed (an invisible column hides its children).
 *
 * @param {Array}  fields Fields.
 * @param {Object} values name => value
 * @return {Set<string>} Names of the visible fields
 */
export function visibleNames( fields, values ) {
    const names = new Set();

    const walk = ( list ) => {
        list.forEach( ( field ) => {
            if ( ! isVisible( field, values ) ) {
                return;
            }

            names.add( field.name );

            if ( 'column_field' === field.template && field.inner_fields ) {
                Object.values( field.inner_fields ).forEach( ( column ) => walk( column || [] ) );
            }
        } );
    };

    walk( fields );

    return names;
}

/**
 * Whether the submit button's own condition (`submit_button_cond`) allows submitting.
 *
 * @param {Object} settings Form settings.
 * @param {Object} values   name => value
 * @return {boolean} Enabled
 */
export function submitAllowed( settings, values ) {
    const cond = settings && settings.submit_button_cond;

    if ( ! cond || ! on( cond.condition_status ) ) {
        return true;
    }

    const conditions = ( cond.conditions || [] ).filter( ( c ) => c && c.name );

    if ( ! conditions.length ) {
        return true;
    }

    const results = conditions.map( ( c ) => matches( c, values ) );

    return 'all' === cond.cond_logic ? results.every( Boolean ) : results.some( Boolean );
}
