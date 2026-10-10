/**
 * One post form (create or edit): state through the kit's useForm, submit
 * through the REST routes, the classic after-submit behaviour (message in
 * place of the form, or redirect), drafts, the login-required answer, the
 * exit warning while a form has unsaved changes.
 *
 * @since WPUF_SINCE
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { applyFilters, doAction } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { FormRenderer, Notice, ServerHtml, afterSubmit, api, buildPayload, confirmDialog, submitAllowed, useForm } from '@wpuf/frontend-kit';

export default function PostForm( { schema: boot, root } ) {
    const schema = applyFilters( 'wpuf.frontend.form.schema', boot );
    const form = useForm( schema );
    const [ guest, setGuest ] = useState( { guest_name: '', guest_email: '' } );
    const [ featured, setFeatured ] = useState( !! schema.featured?.checked );
    const [ deleted, setDeleted ] = useState( [] );
    const [ busy, setBusy ] = useState( false );
    const [ draftBusy, setDraftBusy ] = useState( false );
    const [ error, setError ] = useState( '' );
    const [ done, setDone ] = useState( '' );
    const [ draftId, setDraftId ] = useState( 0 );
    const [ saved, setSaved ] = useState( '' );
    const dirty = useRef( false );

    useEffect( () => {
        dirty.current = Object.keys( form.touched ).length > 0;
    }, [ form.touched ] );

    // The exit warning of the classic form.
    useEffect( () => {
        const warn = ( event ) => {
            if ( dirty.current && ! busy && ! done ) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        window.addEventListener( 'beforeunload', warn );

        return () => window.removeEventListener( 'beforeunload', warn );
    }, [ busy, done ] );

    useEffect( () => {
        doAction( 'wpuf.frontend.form.mounted', schema, root );
    }, [] ); // eslint-disable-line react-hooks/exhaustive-deps

    const extras = () => {
        const out = { ...guest };

        if ( schema.featured?.enabled ) {
            out.is_featured_item = featured ? '1' : '';
        }

        if ( deleted.length ) {
            out.delete_attachments = deleted;
        }

        form.all.forEach( ( field ) => {
            if ( 'recaptcha' === field.template && form.values[ field.name ] ) {
                out[ 'g-recaptcha-response' ] = form.values[ field.name ];
            }

            if ( 'cloudflare_turnstile' === field.template && form.values[ field.name ] ) {
                out[ 'cf-turnstile-response' ] = form.values[ field.name ];
            }
        } );

        return out;
    };

    const payload = ( withDraft = false ) => {
        const body = buildPayload( schema, form.values, form.visible, form.all, extras() );

        if ( withDraft && draftId ) {
            body.post_id = draftId;
        }

        return body;
    };

    const showError = ( e ) => {
        setError( e.message || __( 'Something went wrong', 'wp-user-frontend' ) );

        if ( e.data && e.data.errors && 'object' === typeof e.data.errors ) {
            form.setErrors( ( current ) => ( { ...current, ...e.data.errors } ) );
        }

        root.scrollIntoView( { behavior: 'smooth', block: 'start' } );
    };

    const onSubmit = async () => {
        setError( '' );

        const errors = form.validate();

        if ( schema.guest?.fields ) {
            if ( ! guest.guest_name.trim() ) {
                errors.guest_name = __( 'This field is required.', 'wp-user-frontend' );
            }

            if ( ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( guest.guest_email ) ) {
                errors.guest_email = __( 'Please enter a valid email address.', 'wp-user-frontend' );
            }

            form.setErrors( ( current ) => ( { ...current, ...errors } ) );
        }

        if ( Object.keys( errors ).length ) {
            const first = root.querySelector( '.has-error input, .has-error select, .has-error textarea' );

            if ( first ) {
                first.focus();
            }

            return;
        }

        if ( ! applyFilters( 'wpuf.frontend.form.beforeSubmit', true, schema, form.values ) ) {
            return;
        }

        setBusy( true );

        try {
            const body = payload( true );
            const response = body.post_id && ( 'edit' === schema.mode || draftId )
                ? await api.updateForm( schema.id, body.post_id, body )
                : await api.submitForm( schema.id, body );

            dirty.current = false;
            afterSubmit( response, schema, ( message ) => {
                setDone( message );
                window.setTimeout( () => root.scrollIntoView( { behavior: 'smooth', block: 'start' } ), 0 );
            } );
        } catch ( e ) {
            if ( e.data && 'login' === e.data.type && e.data.redirect_to ) {
                const go = await confirmDialog( { title: e.message, confirmText: __( 'OK', 'wp-user-frontend' ), danger: false } );

                if ( go ) {
                    window.location.assign( e.data.redirect_to );
                }
            } else {
                showError( e );
            }
        } finally {
            setBusy( false );
        }
    };

    const onDraft = async () => {
        setError( '' );
        setDraftBusy( true );

        try {
            const response = await api.saveDraft( schema.id, payload( true ) );

            setDraftId( response.post_id );
            setDone( '' );
            doAction( 'wpuf.frontend.form.draftSaved', response, schema );
            setError( '' );
            setSaved( response.message || __( 'Post Saved', 'wp-user-frontend' ) );
        } catch ( e ) {
            showError( e );
        } finally {
            setDraftBusy( false );
        }
    };

    useEffect( () => {
        if ( ! saved ) {
            return undefined;
        }

        const timer = window.setTimeout( () => setSaved( '' ), 2500 );

        return () => window.clearTimeout( timer );
    }, [ saved ] );

    if ( done ) {
        return <ServerHtml html={ done } className="wpuf-success" slug="success" />;
    }

    if ( ! schema.state?.open ) {
        return <ServerHtml html={ schema.state?.message || '' } className="wpuf-message" />;
    }

    return (
        <>
            { error && <Notice kind="error" onClose={ () => setError( '' ) }>{ error }</Notice> }
            { saved && <span className="wpuf-draft-saved" role="status">{ saved }</span> }
            <FormRenderer
                schema={ schema }
                form={ form }
                guest={ guest }
                setGuest={ setGuest }
                featured={ featured }
                setFeatured={ setFeatured }
                onSubmit={ onSubmit }
                onDraft={ onDraft }
                onDeleteStored={ ( id ) => setDeleted( ( current ) => [ ...current, id ] ) }
                busy={ busy }
                draftBusy={ draftBusy }
                submitAllowed={ submitAllowed( schema.settings, form.values ) }
            />
        </>
    );
}
