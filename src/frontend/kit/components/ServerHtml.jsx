/**
 * Server-produced markup inside a React tree: the slots a form's printing
 * hooks produce and the account sections served as PHP output
 * (frontend-react-architecture.md 4.3, 5.4). The HTML comes from our own
 * REST routes or the boot data the server rendered, never from user input.
 * Inline scripts are re-created so they run (the browser does not run
 * scripts inserted through innerHTML), and a DOM event tells other scripts
 * the section is on the page.
 *
 * @since WPUF_SINCE
 */
import { useEffect, useRef } from '@wordpress/element';

const runScripts = ( root ) => {
    root.querySelectorAll( 'script' ).forEach( ( old ) => {
        const script = document.createElement( 'script' );

        Array.from( old.attributes ).forEach( ( attribute ) => script.setAttribute( attribute.name, attribute.value ) );
        script.text = old.text;
        old.parentNode.replaceChild( script, old );
    } );
};

/**
 * @param {Object} props
 * @param {string} props.html      Markup.
 * @param {string} [props.as]      Wrapper element (div by default; 'li' inside a form list).
 * @param {string} [props.slug]    Account section slug, sent with the DOM event.
 * @param {string} [props.className]
 */
export default function ServerHtml( { html = '', as: Tag = 'div', slug = '', className = '' } ) {
    const ref = useRef( null );

    useEffect( () => {
        const root = ref.current;

        if ( ! root ) {
            return;
        }

        root.innerHTML = html; // eslint-disable-line no-unsanitized/property -- server markup from our own routes.
        runScripts( root );

        if ( window.jQuery ) {
            window.jQuery( document ).trigger( 'wpuf:frontend:html', [ root, slug ] );
        }

        document.dispatchEvent( new window.CustomEvent( 'wpuf:frontend:html', { detail: { root, slug } } ) );
    }, [ html, slug ] );

    return <Tag ref={ ref } className={ className || undefined } data-wpuf-slot={ slug || undefined } />;
}
