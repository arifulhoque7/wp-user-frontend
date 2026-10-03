import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import HelpTextIcon from './HelpTextIcon';

/**
 * File / media field — a URL input plus a "Select" button that opens the
 * WordPress media library (wp.media, enqueued on the settings page). Stores the
 * chosen attachment URL, matching the legacy `type=file` settings field
 * (Invoice `set_logo`, Email `header_image`).
 */
export default function FileField( { field, name, value, onChange } ) {
    const current = value || field.default || '';

    const handleInput = useCallback( ( e ) => onChange( name, e.target.value ), [ name, onChange ] );

    const openLibrary = useCallback( () => {
        const media = window.wp && window.wp.media;
        if ( ! media ) {
            return;
        }
        const frame = media( {
            title: __( 'Select or Upload', 'wp-user-frontend' ),
            button: { text: __( 'Use this file', 'wp-user-frontend' ) },
            multiple: false,
        } );
        frame.on( 'select', () => {
            const attachment = frame.state().get( 'selection' ).first().toJSON();
            onChange( name, attachment.url );
        } );
        frame.open();
    }, [ name, onChange ] );

    return (
        <>
            <div className="flex items-center">
                { field.label && (
                    <label htmlFor={ name } className="text-sm text-gray-700 my-2">
                        { field.label }
                    </label>
                ) }
                { field.help_text && <HelpTextIcon text={ field.help_text } /> }
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    id={ name }
                    value={ current }
                    onChange={ handleInput }
                    className="min-w-0 flex-1 py-2.5! px-3.5! text-gray-700 shadow-xs! placeholder:text-gray-400 border border-gray-300! rounded-md!"
                    placeholder={ field.placeholder || __( 'No file selected', 'wp-user-frontend' ) }
                />
                <button
                    type="button"
                    onClick={ openLibrary }
                    className="shrink-0 rounded-md border border-gray-300! bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    { __( 'Select', 'wp-user-frontend' ) }
                </button>
            </div>
            { current && /\.(png|jpe?g|gif|svg|webp)$/i.test( current ) && (
                <img src={ current } alt="" className="mt-2 max-h-16 rounded-sm border border-gray-200" />
            ) }
        </>
    );
}
