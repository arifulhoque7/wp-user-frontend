/**
 * The frontend post form app: mounts on every `[data-wpuf-react="forms"]`
 * root the shortcode rendered (several forms per page allowed), with the
 * schema the server put in the root's boot script.
 *
 * @since WPUF_SINCE
 */
import { createRoot } from '@wordpress/element';
import { mountAll } from '@wpuf/frontend-kit';
import PostForm from './PostForm';
import './forms.css';

mountAll( 'forms', ( root, schema ) => {
    createRoot( root ).render( <PostForm schema={ schema } root={ root } /> );
} );
