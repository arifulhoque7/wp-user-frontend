import { RawHTML } from '@wordpress/element';

/**
 * Static HTML field: the legacy `html` type (informational blocks). Like the
 * legacy row it shows the label, then the `desc` markup (filtered with
 * `wp_kses_post` on the server).
 */
export default function HtmlField( { field } ) {
    const html = field.desc || '';

    if ( ! html && ! field.label ) {
        return null;
    }

    return (
        <div>
            { field.label && (
                <p className="wpuf-text-sm wpuf-font-medium wpuf-text-gray-700 wpuf-m-0 wpuf-mb-1">{ field.label }</p>
            ) }
            { html && <RawHTML className="wpuf-text-sm wpuf-text-gray-600">{ html }</RawHTML> }
        </div>
    );
}
