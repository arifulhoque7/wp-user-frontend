import { useState, useMemo, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../store';
import ConditionRow from './ConditionRow';
import { RULE_OPTIONS, templateToInputType } from './conditionalUtils';

const ALLOWED_TEMPLATES = [
    'radio_field',
    'checkbox_field',
    'dropdown_field',
    'text_field',
    'textarea_field',
    'email_address',
    'numeric_text_field',
];

/**
 * Submit button conditional logic (Pro).
 *
 * Stores data in `settings.submit_button_cond` using the object-array format:
 * { condition_status, cond_logic, conditions: [{ name, operator, option, input_type }] }
 *
 * @param {Object} props
 * @param {string} props.label  - Section heading label
 */
export default function SubmitConditionalLogic( { label } ) {
    const { settings, formFields } = useSelect( ( select ) => {
        const store = select( STORE_NAME );
        return {
            settings: store.getSettings(),
            formFields: store.getFormFields(),
        };
    }, [] );

    const { updateFormSetting } = useDispatch( STORE_NAME );

    const currentSettings = settings.submit_button_cond || {
        condition_status: 'no',
        cond_logic: 'any',
        conditions: [ { name: '', operator: '=', option: '', input_type: '' } ],
    };

    const availableFields = useMemo( () => {
        const fields = [];

        formFields.forEach( ( field ) => {
            if (
                ALLOWED_TEMPLATES.includes( field.template ) &&
                field.name &&
                field.label
            ) {
                fields.push( field );
            }
        } );

        return fields;
    }, [ formFields ] );

    const conditions = currentSettings.conditions && currentSettings.conditions.length
        ? currentSettings.conditions
        : [ { name: '', operator: '=', option: '', input_type: '' } ];

    const isEnabled = currentSettings.condition_status === 'yes';

    const persist = useCallback( ( updates ) => {
        updateFormSetting( 'submit_button_cond', {
            ...currentSettings,
            ...updates,
        } );
    }, [ currentSettings, updateFormSetting ] );

    function handleToggle( status ) {
        persist( { condition_status: status } );
    }

    function handleLogicChange( e ) {
        persist( { cond_logic: e.target.value } );
    }

    function handleConditionChange( index, updated ) {
        const newConditions = [ ...conditions ];
        newConditions[ index ] = {
            name: updated.name,
            operator: updated.operator,
            option: updated.option,
            input_type: updated.input_type,
        };
        persist( { conditions: newConditions } );
    }

    function handleAddCondition() {
        persist( {
            conditions: [
                ...conditions,
                { name: '', operator: '=', option: '', input_type: '' },
            ],
        } );
    }

    function handleRemoveCondition( index ) {
        if ( conditions.length <= 1 ) {
            return;
        }
        persist( { conditions: conditions.filter( ( _, i ) => i !== index ) } );
    }

    return (
        <div className="wpuf-conditional-logic border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                { label || __( 'Conditional Logic on Submit Button', 'wp-user-frontend' ) }
            </h4>

            <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                    <input
                        type="radio"
                        name="wpuf_submit_cond_status"
                        value="yes"
                        checked={ isEnabled }
                        onChange={ () => handleToggle( 'yes' ) }
                    />
                    { __( 'Enable', 'wp-user-frontend' ) }
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                    <input
                        type="radio"
                        name="wpuf_submit_cond_status"
                        value="no"
                        checked={ ! isEnabled }
                        onChange={ () => handleToggle( 'no' ) }
                    />
                    { __( 'Disable', 'wp-user-frontend' ) }
                </label>
            </div>

            { isEnabled && (
                <div className="conditional-rules-wrap">
                    <div className="flex items-center gap-2 mb-3 text-sm">
                        <span>{ __( 'Show submit button when', 'wp-user-frontend' ) }</span>
                        <select
                            className="border border-gray-300 rounded-sm px-2 py-1 text-sm"
                            value={ currentSettings.cond_logic || 'any' }
                            onChange={ handleLogicChange }
                        >
                            { RULE_OPTIONS.map( ( opt ) => (
                                <option key={ opt.value } value={ opt.value }>
                                    { opt.label }
                                </option>
                            ) ) }
                        </select>
                        <span>{ __( 'of these rules match', 'wp-user-frontend' ) }</span>
                    </div>

                    { conditions.map( ( condition, i ) => (
                        <ConditionRow
                            key={ i }
                            condition={ condition }
                            index={ i }
                            availableFields={ availableFields }
                            onChange={ handleConditionChange }
                            onRemove={ handleRemoveCondition }
                            canRemove={ conditions.length > 1 }
                        />
                    ) ) }

                    <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                        onClick={ handleAddCondition }
                    >
                        + { __( 'Add condition', 'wp-user-frontend' ) }
                    </button>
                </div>
            ) }
        </div>
    );
}
