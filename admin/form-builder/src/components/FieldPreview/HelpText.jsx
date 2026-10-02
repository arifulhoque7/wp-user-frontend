/**
 * Shared help text component for field previews.
 *
 * Without `className` it is develop's paragraph; templates that printed
 * `<span class="wpuf-help">` pass `className="wpuf-help"`.
 */
export default function HelpText( { text, className } ) {
    if ( ! text ) {
        return null;
    }

    if ( className ) {
        return <span className={ className } dangerouslySetInnerHTML={ { __html: text } } />;
    }

    return (
        <p
            className="wpuf-mt-2 wpuf-mb-0 wpuf-text-sm wpuf-text-gray-500"
            dangerouslySetInnerHTML={ { __html: text } }
        />
    );
}
