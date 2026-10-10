/**
 * Image and featured image uploads: a drop zone over `POST /uploads`
 * (progress through XMLHttpRequest), previews, remove (DELETE /uploads/{id}
 * for a file added in this session, `delete_attachments[]` for a stored
 * one, as the classic form does), the field's count and size limits.
 * Value: a list of attachment ids, posted as `wpuf_files[name][]`.
 *
 * @since WPUF_SINCE
 */
import { useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import Field from '../components/Field';
import { Button } from '../components/primitives';
import { Upload as UploadIcon, X } from '../icons';
import { deleteUpload, uploadFile } from '../api';

const IMAGE_TYPES = [ 'image/jpeg', 'image/png', 'image/gif', 'image/webp' ];

export default function UploadField( { field, value, onChange, formId, error, schema, onDeleteStored } ) {
    const id = `${ field.name }_${ formId }`;
    const ids = Array.isArray( value ) ? value.map( String ) : [];
    const [ items, setItems ] = useState( () => ( field.attachments || [] ).map( ( item ) => ( { ...item, id: String( item.id ), stored: true } ) ) );
    const [ progress, setProgress ] = useState( {} );
    const [ message, setMessage ] = useState( '' );
    const input = useRef( null );

    const isFeatured = 'featured_image' === field.template;
    const max = isFeatured ? 1 : Number( field.count || 0 ) || 1;
    const maxSize = ( Number( field.max_size || 0 ) || 1024 ) * 1024;
    const nonce = schema?.nonces?.upload || '';

    const add = async ( files ) => {
        setMessage( '' );

        for ( const file of Array.from( files ) ) {
            if ( ids.length + Object.keys( progress ).length >= max ) {
                /* translators: %d: number of files */
                setMessage( sprintf( __( 'You can upload at most %d files.', 'wp-user-frontend' ), max ) );
                break;
            }

            if ( ! IMAGE_TYPES.includes( file.type ) ) {
                setMessage( __( 'Only images are allowed in this field.', 'wp-user-frontend' ) );
                continue;
            }

            if ( file.size > maxSize ) {
                /* translators: %s: size in kB */
                setMessage( sprintf( __( 'The file is too large. The limit is %s kB.', 'wp-user-frontend' ), Math.round( maxSize / 1024 ) ) );
                continue;
            }

            const key = file.name + ':' + file.size + ':' + Date.now();

            setProgress( ( current ) => ( { ...current, [ key ]: 0 } ) );

            try {
                const result = await uploadFile( '/uploads', file, { form_id: formId, type: field.name, wpuf_nonce: nonce }, ( ratio ) => setProgress( ( current ) => ( { ...current, [ key ]: ratio } ) ) );

                setItems( ( current ) => [ ...current, { id: String( result.attach_id ), url: result.url, thumb: result.thumb, title: result.title, stored: false } ] );
                onChange( [ ...( Array.isArray( value ) ? value.map( String ) : [] ), String( result.attach_id ) ] );
            } catch ( e ) {
                setMessage( e.message );
            } finally {
                setProgress( ( current ) => {
                    const next = { ...current };
                    delete next[ key ];

                    return next;
                } );
            }
        }

        if ( input.current ) {
            input.current.value = '';
        }
    };

    const remove = async ( item ) => {
        if ( item.stored ) {
            onDeleteStored && onDeleteStored( item.id );
        } else {
            try {
                await deleteUpload( item.id, schema?.nonces?.delete || '' );
            } catch ( e ) {
                // The attachment stays orphaned; the server cleans those up later.
            }
        }

        setItems( ( current ) => current.filter( ( entry ) => entry.id !== item.id ) );
        onChange( ids.filter( ( entry ) => entry !== item.id ) );
    };

    const busy = Object.keys( progress ).length > 0;
    const full = ids.length >= max;

    return (
        <Field field={ field } id={ id } error={ error || message }>
            <div
                className={ 'wpuf-upload' + ( full ? ' is-full' : '' ) }
                onDragOver={ ( event ) => event.preventDefault() }
                onDrop={ ( event ) => {
                    event.preventDefault();
                    add( event.dataTransfer.files );
                } }
            >
                <ul className="wpuf-attachment-list">
                    { items.map( ( item ) => (
                        <li key={ item.id } className="wpuf-attachment">
                            { item.thumb || item.url ? <img src={ item.thumb || item.url } alt={ item.title || '' } /> : <span className="wpuf-attachment__name">{ item.title || item.id }</span> }
                            <button type="button" className="wpuf-attachment__remove" aria-label={ __( 'Remove', 'wp-user-frontend' ) } onClick={ () => remove( item ) }>
                                <X size={ 14 } aria-hidden="true" />
                            </button>
                            <input type="hidden" name={ `wpuf_files[${ field.name }][]` } value={ item.id } />
                        </li>
                    ) ) }
                    { Object.entries( progress ).map( ( [ key, ratio ] ) => (
                        <li key={ key } className="wpuf-attachment is-uploading" aria-busy="true">
                            <span className="wpuf-attachment__bar" style={ { width: `${ Math.round( ratio * 100 ) }%` } } />
                            <span className="wpuf-attachment__name">{ Math.round( ratio * 100 ) }%</span>
                        </li>
                    ) ) }
                </ul>
                { ! full && (
                    <div className="wpuf-upload__zone">
                        <input ref={ input } id={ id } type="file" accept={ IMAGE_TYPES.join( ',' ) } multiple={ max > 1 } className="wpuf-sr-only" onChange={ ( event ) => add( event.target.files ) } />
                        <Button variant="secondary" size="sm" busy={ busy } onClick={ () => input.current && input.current.click() }>
                            <UploadIcon size={ 16 } aria-hidden="true" />
                            { field.button_label || __( 'Select Image', 'wp-user-frontend' ) }
                        </Button>
                        <span className="wpuf-upload__hint">
                            { /* translators: 1: number of files, 2: size in kB */ }
                            { sprintf( __( 'Up to %1$d file(s), %2$s kB each. Drop files here.', 'wp-user-frontend' ), max, Math.round( maxSize / 1024 ) ) }
                        </span>
                    </div>
                ) }
            </div>
        </Field>
    );
}
