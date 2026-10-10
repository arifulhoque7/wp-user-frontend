/**
 * The rich textarea (post content, excerpt, textarea with `rich` = yes or
 * teeny): WordPress' own editor through `wp.editor` (enqueued by the server
 * when the schema needs it), the same TinyMCE + quicktags the classic form
 * shows. Falls back to a plain textarea when wp.editor is not on the page.
 *
 * @since WPUF_SINCE
 */
import { useEffect, useRef } from '@wordpress/element';
import Field from '../components/Field';

export default function RichTextField( { field, value, onChange, onBlur, formId, error } ) {
    const id = `${ field.name }_${ formId }`;
    const ref = useRef( null );
    const latest = useRef( onChange );
    latest.current = onChange;

    const teeny = 'teeny' === field.rich || 'teeny' === field.editor;
    const editorAvailable = 'function' === typeof window.wp?.editor?.initialize;

    useEffect( () => {
        if ( ! editorAvailable ) {
            return undefined;
        }

        const settings = {
            tinymce: {
                wpautop: true,
                toolbar1: teeny
                    ? 'bold,italic,underline,blockquote,strikethrough,bullist,numlist,alignleft,aligncenter,alignright,undo,redo,link,unlink,fullscreen'
                    : 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,wp_more,spellchecker,fullscreen,wp_adv',
                toolbar2: teeny ? '' : 'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
                setup: ( editor ) => {
                    editor.on( 'change keyup blur', () => latest.current( editor.getContent() ) );
                },
            },
            quicktags: true,
            mediaButtons: 'yes' === field.insert_image,
        };

        window.wp.editor.initialize( id, settings );

        return () => {
            window.wp.editor.remove( id );
        };
        // The editor mounts once; value changes come back through setup().
    }, [ id, teeny, field.insert_image, editorAvailable ] );

    return (
        <Field field={ field } id={ id } error={ error }>
            <div className="wpuf-rich-editor">
                <textarea
                    ref={ ref }
                    id={ id }
                    className={ `textareafield wpuf_${ field.name }_${ formId }` }
                    name={ field.name }
                    rows={ field.rows || 10 }
                    defaultValue={ value ?? '' }
                    required={ 'yes' === field.required && ! editorAvailable }
                    aria-invalid={ error ? 'true' : undefined }
                    onChange={ editorAvailable ? undefined : ( event ) => onChange( event.target.value ) }
                    onBlur={ onBlur }
                />
            </div>
        </Field>
    );
}
