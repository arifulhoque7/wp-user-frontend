import { useCallback } from '@wordpress/element';
import TextEditor from '../../../common/TextEditor';
import HelpTextIcon from './HelpTextIcon';

/**
 * Rich text (TinyMCE) settings field, like develop's `rich-text` type
 * (registration email bodies). Shows `field.default` while nothing is stored;
 * only an edit writes a value.
 */
export default function RichTextField( { field, name, value, onChange } ) {
    const handleChange = useCallback( ( content ) => {
        onChange( name, content );
    }, [ name, onChange ] );

    // Text (HTML) tab edits the textarea directly; TinyMCE reports visual edits.
    const handleTextTab = useCallback( ( e ) => {
        if ( e.target && e.target.tagName === 'TEXTAREA' ) {
            onChange( name, e.target.value );
        }
    }, [ name, onChange ] );

    const editorKey = String( name ).replace( /\W+/g, '_' );

    return (
        <>
            <div className="flex items-center">
                { field.label && (
                    <label htmlFor={ `wpuf-editor-${ editorKey }` } className="text-sm text-gray-700 my-2">
                        { field.label }
                    </label>
                ) }
                { field.help_text && <HelpTextIcon text={ field.help_text } /> }
            </div>
            <div onInput={ handleTextTab }>
                <TextEditor
                    id={ editorKey }
                    value={ value !== undefined && value !== null ? value : ( field.default || '' ) }
                    onChange={ handleChange }
                    teeny
                />
            </div>
        </>
    );
}
