import { __ } from '@wordpress/i18n';
import {
    getOperatorsForType,
    isEmptyOperator,
    isDropdownType,
    getFieldOptions,
    conditionInputType,
    conditionFieldType,
} from './conditionalUtils';

/**
 * Single condition row — field selector, operator selector, value input, remove button.
 *
 * @param {Object}   props
 * @param {Object}   props.condition        - { name, operator, option, option_title, input_type, field_type }
 * @param {number}   props.index
 * @param {Array}    props.availableFields  - fields that support conditional logic
 * @param {Object}   props.wpPostTypes      - post types and their taxonomies (terms for taxonomy fields)
 * @param {Function} props.onChange         - (index, updatedCondition) => void
 * @param {Function} props.onRemove        - (index) => void
 * @param {boolean}  props.canRemove       - whether the remove button is enabled
 */
export default function ConditionRow( {
    condition,
    index,
    availableFields,
    wpPostTypes,
    onChange,
    onRemove,
    canRemove,
} ) {
    const selectedField = availableFields.find( ( f ) => f.name === condition.name );
    const inputType = selectedField ? conditionInputType( selectedField ) : ( condition.input_type || '' );
    const operators = getOperatorsForType( inputType );
    const showDropdown = isDropdownType( inputType ) && selectedField;
    const fieldOptions = showDropdown ? getFieldOptions( selectedField, wpPostTypes ) : [];
    const disabled = isEmptyOperator( condition.operator );

    // Like the Vue builder, picking a field selects its first operator and option.
    function handleFieldChange( e ) {
        const fieldName = e.target.value;
        const field = availableFields.find( ( f ) => f.name === fieldName );
        const newInputType = conditionInputType( field );
        const newOperators = getOperatorsForType( newInputType );
        const firstOption = field && isDropdownType( newInputType ) ? getFieldOptions( field, wpPostTypes )[ 0 ] : null;

        onChange( index, {
            ...condition,
            name: fieldName,
            input_type: newInputType,
            field_type: conditionFieldType( field ),
            operator: newOperators.length > 0 ? newOperators[ 0 ].value : '=',
            option: firstOption ? firstOption.value : '',
            option_title: firstOption ? firstOption.label : '',
        } );
    }

    function handleOperatorChange( e ) {
        const operator = e.target.value;
        onChange( index, {
            ...condition,
            operator,
            option: isEmptyOperator( operator ) ? '' : condition.option,
        } );
    }

    function handleOptionChange( e ) {
        const picked = fieldOptions.find( ( opt ) => opt.value === e.target.value );

        onChange( index, {
            ...condition,
            option: e.target.value,
            option_title: picked ? picked.label : '',
        } );
    }

    return (
        <div className="flex items-center gap-2 mb-2">
            { /* Field selector */ }
            <select
                className="cond-field flex-1 border border-gray-300 rounded-sm px-2 py-1 text-sm"
                value={ condition.name }
                onChange={ handleFieldChange }
            >
                <option value="">{ __( '- select -', 'wp-user-frontend' ) }</option>
                { availableFields.map( ( field ) => (
                    <option
                        key={ field.name }
                        value={ field.name }
                        data-type={ conditionInputType( field ) }
                    >
                        { field.label }
                    </option>
                ) ) }
            </select>

            { /* Operator selector */ }
            <select
                className="cond-operator flex-1 border border-gray-300 rounded-sm px-2 py-1 text-sm"
                value={ condition.operator }
                onChange={ handleOperatorChange }
            >
                { operators.map( ( op ) => (
                    <option key={ op.value } value={ op.value }>
                        { op.label }
                    </option>
                ) ) }
            </select>

            { /* Value input — dropdown or text based on field type */ }
            { showDropdown ? (
                <select
                    className="cond-option flex-1 border border-gray-300 rounded-sm px-2 py-1 text-sm"
                    value={ condition.option }
                    onChange={ handleOptionChange }
                    disabled={ disabled }
                >
                    { fieldOptions.map( ( opt ) => (
                        <option key={ opt.value } value={ opt.value }>
                            { opt.label }
                        </option>
                    ) ) }
                </select>
            ) : (
                <input
                    type="text"
                    className="cond-option flex-1 border border-gray-300 rounded-sm px-2 py-1 text-sm"
                    value={ condition.option }
                    onChange={ handleOptionChange }
                    disabled={ disabled }
                    placeholder={ disabled ? '' : __( 'Enter value', 'wp-user-frontend' ) }
                />
            ) }

            { /* Remove button */ }
            <button
                type="button"
                className="text-red-500 hover:text-red-700 p-1"
                onClick={ () => onRemove( index ) }
                disabled={ ! canRemove }
                title={ __( 'Remove condition', 'wp-user-frontend' ) }
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
