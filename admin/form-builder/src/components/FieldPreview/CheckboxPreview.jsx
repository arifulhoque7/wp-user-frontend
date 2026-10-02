import { useFieldClasses } from '../../hooks/useFieldClasses';
import HelpText from './HelpText';

export default function CheckboxPreview( { field } ) {
    const { builderClassNames } = useFieldClasses( field );
    const options = field.options || {};
    const hasOptions = Object.keys( options ).length > 0;
    const isInline = field.inline === 'yes';
    const selected = Array.isArray( field.selected ) ? field.selected : [ field.selected ];

    return (
        <div className="wpuf-fields">
            <div className={ isInline ? 'wpuf-flex' : 'wpuf-space-y-2' }>
                { hasOptions && Object.entries( options ).map( ( [ val, label ] ) => (
                    isInline ? (
                        <div key={ val } className="wpuf-relative wpuf-flex wpuf-items-center wpuf-mr-4">
                            <input
                                type="checkbox"
                                value={ val }
                                checked={ selected.includes( val ) }
                                className={ `${ builderClassNames( 'checkbox' ) } !wpuf-mt-[.5px] wpuf-rounded wpuf-border-gray-300 wpuf-text-indigo-600` }
                                readOnly
                            />
                            <label>{ label }</label>
                        </div>
                    ) : (
                        // Develop wraps the stacked input and label in one more flex row.
                        <div key={ val } className="wpuf-relative wpuf-flex wpuf-items-center">
                            <div className="wpuf-flex wpuf-items-center">
                                <input
                                    type="checkbox"
                                    value={ val }
                                    checked={ selected.includes( val ) }
                                    className={ builderClassNames( 'checkbox' ) }
                                    readOnly
                                />
                                <label>{ label }</label>
                            </div>
                        </div>
                    )
                ) ) }
            </div>
            <HelpText text={ field.help } />
        </div>
    );
}
