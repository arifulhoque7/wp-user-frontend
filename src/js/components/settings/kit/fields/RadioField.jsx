import { useCallback } from '@wordpress/element';
import HelpTextIcon from './HelpTextIcon';

/**
 * Radio group field — covers legacy `radio` and `radio_inline` types.
 * Net-new for the settings screen (the Form Builder kit only ships pic-radio).
 */
export default function RadioField( { field, name, value, onChange, inline = false } ) {
    const options = field.options || {};
    const current = value || field.default || '';

    const handleChange = useCallback(
        ( optValue ) => onChange( name, optValue ),
        [ name, onChange ]
    );

    return (
        <>
            <div className="flex items-center">
                { field.label && (
                    <label className="text-sm text-gray-700 my-2">{ field.label }</label>
                ) }
                { field.help_text && <HelpTextIcon text={ field.help_text } /> }
            </div>
            <div className={ inline ? 'flex gap-6' : '[&>:not([hidden])~:not([hidden])]:mt-2' }>
                { Object.entries( options ).map( ( [ optValue, optLabel ] ) => (
                    <label key={ optValue } className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name={ name }
                            value={ optValue }
                            checked={ current === optValue }
                            onChange={ () => handleChange( optValue ) }
                            className="mt-0! h-4 w-4 border-gray-300! checked:border-primary! checked:bg-primary! focus:ring-transparent!"
                        />
                        <span className="text-sm text-gray-700">
                            { typeof optLabel === 'object' && optLabel !== null
                                ? ( optLabel.label || optLabel.name || optValue )
                                : optLabel }
                        </span>
                    </label>
                ) ) }
            </div>
        </>
    );
}
