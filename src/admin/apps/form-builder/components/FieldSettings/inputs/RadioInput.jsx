import SettingHelpText from './SettingHelpText';

/**
 * Radio button input for field settings.
 * Replaces Vue field-radio component.
 */
export default function RadioInput( { optionField, value, onChange, builderClassNames } ) {
    const options = optionField.options || {};
    const optionEntries = Object.entries( options );
    const isInline = !! optionField.inline;

    return (
        <div className="panel-field-opt panel-field-opt-radio">
            <div className="flex">
                <label className="wpuf-option-field-title wpuf-font-sm text-gray-700 font-medium">
                    { optionField.title }
                    <SettingHelpText text={ optionField.help_text } />
                </label>
            </div>

            { isInline ? (
                <div className="flex">
                    { optionEntries.map( ( [ key, label ], index ) => (
                        <div key={ key } className="items-center">
                            <label
                                className={ `block text-sm/6 font-medium text-gray-900 mb-0!${ index !== 0 ? ' ml-8' : '' }` }
                            >
                                <input
                                    type="radio"
                                    value={ key }
                                    checked={ value === key }
                                    onChange={ () => onChange( key ) }
                                    className={ builderClassNames( 'radio' ) }
                                />
                                { label }
                            </label>
                        </div>
                    ) ) }
                </div>
            ) : (
                optionEntries.map( ( [ key, label ], index ) => (
                    <div
                        key={ key }
                        className={ `flex items-center${ index < optionEntries.length - 1 ? ' mb-3' : '' }` }
                    >
                        <label className="mb-0!">
                            <input
                                type="radio"
                                value={ key }
                                checked={ value === key }
                                onChange={ () => onChange( key ) }
                                className={ builderClassNames( 'radio' ) }
                            />
                            { label }
                        </label>
                    </div>
                ) )
            ) }
        </div>
    );
}
