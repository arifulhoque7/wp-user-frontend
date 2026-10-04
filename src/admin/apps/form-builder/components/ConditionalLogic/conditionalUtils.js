import { __ } from '@wordpress/i18n';

export const RULE_OPTIONS = [
    { label: __( 'All', 'wp-user-frontend' ), value: 'all' },
    { label: __( 'Any', 'wp-user-frontend' ), value: 'any' },
];

export const OPERATORS = {
    radio: [
        { label: __( 'is', 'wp-user-frontend' ), value: '=' },
        { label: __( 'is not', 'wp-user-frontend' ), value: '!=' },
        { label: __( 'any selection', 'wp-user-frontend' ), value: '!=empty' },
        { label: __( 'no selection', 'wp-user-frontend' ), value: '==empty' },
    ],
    text: [
        { label: __( 'is', 'wp-user-frontend' ), value: '=' },
        { label: __( 'is not', 'wp-user-frontend' ), value: '!=' },
        { label: __( 'contains', 'wp-user-frontend' ), value: '==contains' },
        { label: __( 'has any value', 'wp-user-frontend' ), value: '!=empty' },
        { label: __( 'has no value', 'wp-user-frontend' ), value: '==empty' },
    ],
    number: [
        { label: __( 'is', 'wp-user-frontend' ), value: '=' },
        { label: __( 'is not', 'wp-user-frontend' ), value: '!=' },
        { label: __( 'contains', 'wp-user-frontend' ), value: '==contains' },
        { label: __( 'has any value', 'wp-user-frontend' ), value: '!=empty' },
        { label: __( 'has no value', 'wp-user-frontend' ), value: '==empty' },
        { label: __( 'value is greater than', 'wp-user-frontend' ), value: 'greater' },
        { label: __( 'value is less than', 'wp-user-frontend' ), value: 'less' },
    ],
    others: [
        { label: __( 'has any value', 'wp-user-frontend' ), value: '!=empty' },
        { label: __( 'has no value', 'wp-user-frontend' ), value: '==empty' },
    ],
};

/**
 * Get operators for a given input type.
 *
 * @param {string} inputType
 * @return {Array}
 */
export function getOperatorsForType( inputType ) {
    switch ( inputType ) {
        case 'select':
        case 'radio':
        case 'category':
        case 'taxonomy':
        case 'checkbox':
            return OPERATORS.radio;
        case 'text':
        case 'textarea':
        case 'email':
        case 'url':
        case 'password':
            return OPERATORS.text;
        case 'numeric_text':
            return OPERATORS.number;
        default:
            return OPERATORS.others;
    }
}

/**
 * Map field template to input type string.
 *
 * @param {string} template
 * @return {string}
 */
export function templateToInputType( template ) {
    switch ( template ) {
        case 'radio_field':
            return 'radio';
        case 'checkbox_field':
            return 'checkbox';
        case 'dropdown_field':
            return 'select';
        case 'text_field':
            return 'text';
        case 'textarea_field':
            return 'textarea';
        case 'email_address':
            return 'email';
        case 'numeric_text_field':
            return 'numeric_text';
        case 'website_url':
            return 'url';
        case 'password':
            return 'password';
        default:
            return template ? template.replace( '_field', '' ) : '';
    }
}

/**
 * Whether the operator makes the value input unnecessary.
 *
 * @param {string} operator
 * @return {boolean}
 */
export function isEmptyOperator( operator ) {
    return operator === '==empty' || operator === '!=empty';
}

/**
 * Whether the input type should show a dropdown (has discrete options).
 *
 * @param {string} inputType
 * @return {boolean}
 */
export function isDropdownType( inputType ) {
    return [ 'select', 'radio', 'category', 'taxonomy', 'checkbox' ].includes( inputType );
}

/**
 * Input type a condition stores for a dependency field: the field's own
 * `input_type`, as the Vue builder stored it, else one derived from the template.
 *
 * @param {Object} field
 * @return {string}
 */
export function conditionInputType( field ) {
    if ( ! field ) {
        return '';
    }

    return field.input_type || templateToInputType( field.template );
}

/**
 * Field type a condition stores: a rich textarea stores its `rich` value, else
 * the field's `type`, else the input type (same order as the Vue builder).
 *
 * @param {Object} field
 * @return {string}
 */
export function conditionFieldType( field ) {
    const inputType = conditionInputType( field );

    if ( inputType === 'textarea' && field && Object.prototype.hasOwnProperty.call( field, 'rich' ) ) {
        return field.rich;
    }

    return field && field.type !== undefined ? field.type : inputType;
}

/**
 * Get the options a condition can match for a field: the field's own options,
 * or the terms of a hierarchical taxonomy field.
 *
 * @param {Object} field
 * @param {Object} wpPostTypes `wpuf_form_builder.wp_post_types`.
 * @return {Array<{value: string, label: string}>}
 */
export function getFieldOptions( field, wpPostTypes = {} ) {
    if ( ! field ) {
        return [];
    }

    const options = [];

    if ( field.template === 'taxonomy' ) {
        // Two post types never share a taxonomy, so the first match is the one.
        const owner = Object.values( wpPostTypes ).find( ( taxonomies ) =>
            taxonomies && Object.prototype.hasOwnProperty.call( taxonomies, field.name )
        );
        const terms = owner && owner[ field.name ] && owner[ field.name ].hierarchical ? owner[ field.name ].terms : null;

        if ( Array.isArray( terms ) ) {
            terms.forEach( ( term ) => options.push( { value: String( term.term_id ), label: term.name } ) );
            return options;
        }
    }

    if ( field.options && typeof field.options === 'object' && ! Array.isArray( field.options ) ) {
        for ( const key in field.options ) {
            if ( Object.prototype.hasOwnProperty.call( field.options, key ) ) {
                options.push( { value: key, label: field.options[ key ] } );
            }
        }
    }

    return options;
}
