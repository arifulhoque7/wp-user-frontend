/**
 * reCAPTCHA (v2 checkbox, invisible) and Cloudflare Turnstile: the widget
 * script loads on demand with the site key from the schema, the token is
 * posted under the name the server validates (`g-recaptcha-response`,
 * `cf-turnstile-response`).
 *
 * @since WPUF_SINCE
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Field from '../components/Field';

const loadScript = ( src, ready ) => new Promise( ( resolve ) => {
    if ( ready() ) {
        resolve();

        return;
    }

    let script = document.querySelector( `script[src^="${ src }"]` );

    if ( ! script ) {
        script = document.createElement( 'script' );
        script.src = src;
        script.async = true;
        script.defer = true;
        document.head.appendChild( script );
    }

    const wait = () => ( ready() ? resolve() : window.setTimeout( wait, 50 ) );

    wait();
} );

export function RecaptchaField( { field, onChange, formId, error, schema } ) {
    const ref = useRef( null );
    const key = schema?.needs?.recaptcha_key || '';
    const invisible = 'invisible_recaptcha' === field.recaptcha_type;

    useEffect( () => {
        if ( ! key || ! ref.current ) {
            return;
        }

        loadScript( 'https://www.google.com/recaptcha/api.js?render=explicit', () => window.grecaptcha && window.grecaptcha.render ).then( () => {
            if ( ref.current && ! ref.current.dataset.widget ) {
                ref.current.dataset.widget = String( window.grecaptcha.render( ref.current, {
                    sitekey: key,
                    size: invisible ? 'invisible' : 'normal',
                    callback: ( token ) => onChange( token ),
                    'expired-callback': () => onChange( '' ),
                } ) );

                if ( invisible ) {
                    window.grecaptcha.execute( Number( ref.current.dataset.widget ) );
                }
            }
        } );
    }, [ key, invisible ] ); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Field field={ { ...field, label: field.label || __( 'Verification', 'wp-user-frontend' ) } } error={ error } noLabel={ invisible }>
            { key ? <div ref={ ref } className="wpuf-recaptcha" data-form={ formId } /> : <span className="wpuf-help">{ __( 'reCAPTCHA is not configured (Settings > General).', 'wp-user-frontend' ) }</span> }
        </Field>
    );
}

export function TurnstileField( { field, onChange, error, schema } ) {
    const ref = useRef( null );
    const key = schema?.needs?.turnstile_key || '';

    useEffect( () => {
        if ( ! key || ! ref.current ) {
            return;
        }

        loadScript( 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', () => window.turnstile && window.turnstile.render ).then( () => {
            if ( ref.current && ! ref.current.dataset.widget ) {
                ref.current.dataset.widget = window.turnstile.render( ref.current, {
                    sitekey: key,
                    theme: field.turnstile_theme || 'light',
                    size: field.turnstile_size || 'normal',
                    callback: ( token ) => onChange( token ),
                    'expired-callback': () => onChange( '' ),
                } );
            }
        } );
    }, [ key ] ); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Field field={ { ...field, label: field.label || __( 'Verification', 'wp-user-frontend' ) } } error={ error }>
            { key ? <div ref={ ref } className="wpuf-turnstile" /> : <span className="wpuf-help">{ __( 'Turnstile is not configured (Settings > General).', 'wp-user-frontend' ) }</span> }
        </Field>
    );
}
