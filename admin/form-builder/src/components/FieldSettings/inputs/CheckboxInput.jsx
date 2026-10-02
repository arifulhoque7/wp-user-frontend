import { useCallback } from '@wordpress/element';
import SettingHelpText from './SettingHelpText';

/**
 * Checkbox input for field settings.
 * Replaces Vue field-checkbox component.
 *
 * Single-option checkboxes (is_single_opt) toggle between the first option key
 * and ''. Multi-option checkboxes store a list of keys when the stored value is
 * a list; a single box with any other stored value is on/off, stored as true/false
 * (how the Vue v-model stored `read_only`). The store keeps `read_only` and
 * `required` mutually exclusive.
 */
export default function CheckboxInput( { optionField, value, onChange, builderClassNames } ) {
    const isSingleOpt = !! optionField.is_single_opt;
    const options = optionField.options || {};
    const optionKeys = Object.keys( options );

    // For single-option checkboxes, compute checked state
    const isChecked = isSingleOpt
        ? value === optionKeys[ 0 ]
        : false;

    const handleSingleOptChange = useCallback( ( e ) => {
        onChange( e.target.checked ? optionKeys[ 0 ] : '' );
    }, [ optionKeys, onChange ] );

    // One box whose stored value is not a list is a boolean box (`read_only`).
    const isBooleanBox = optionKeys.length === 1 && ! Array.isArray( value );
    const isBoxChecked = value === true || value === 'true' || value === 'yes';

    const handleMultiChange = useCallback( ( key, checked ) => {
        if ( isBooleanBox ) {
            onChange( checked );
            return;
        }

        const current = Array.isArray( value ) ? [ ...value ] : [];

        if ( checked ) {
            if ( ! current.includes( key ) ) {
                current.push( key );
            }
        } else {
            const idx = current.indexOf( key );
            if ( idx > -1 ) {
                current.splice( idx, 1 );
            }
        }

        onChange( current );
    }, [ value, onChange, isBooleanBox ] );

    // Single option checkbox (toggle)
    if ( isSingleOpt ) {
        return (
            <div className="panel-field-opt panel-field-opt-checkbox wpuf-mb-6">
                <div className="wpuf-flex">
                    <label className="wpuf-block text-sm/6 wpuf-font-medium wpuf-text-gray-900 !wpuf-mb-0">
                        <input
                            type="checkbox"
                            className={ `${ builderClassNames( 'checkbox' ) } !wpuf-mr-2` }
                            checked={ isChecked }
                            onChange={ handleSingleOptChange }
                        />
                        { optionField.title }
                        <SettingHelpText text={ optionField.help_text } />
                    </label>
                </div>
            </div>
        );
    }

    // Multi-option checkboxes
    return (
        <div className="panel-field-opt panel-field-opt-checkbox wpuf-mb-6">
            <div className="wpuf-flex">
                { optionField.title && (
                    <label className="wpuf-option-field-title wpuf-font-sm wpuf-text-gray-700 wpuf-font-medium">
                        { optionField.title }
                        <SettingHelpText text={ optionField.help_text } />
                    </label>
                ) }
            </div>
            <ul className={ optionField.inline ? 'list-inline' : '' }>
                { optionKeys.map( ( key ) => (
                    <li key={ key }>
                        <label className="wpuf-block text-sm/6 wpuf-font-medium wpuf-text-gray-900 !wpuf-mb-0">
                            <input
                                type="checkbox"
                                className={ `${ builderClassNames( 'checkbox' ) } !wpuf-mr-2` }
                                value={ key }
                                checked={ isBooleanBox ? isBoxChecked : Array.isArray( value ) && value.includes( key ) }
                                onChange={ ( e ) => handleMultiChange( key, e.target.checked ) }
                            />
                            { options[ key ] }
                        </label>
                    </li>
                ) ) }
            </ul>
        </div>
    );
}
