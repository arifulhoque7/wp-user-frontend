/**
 * Entry point for the Forms List React application.
 *
 * @since WPUF_SINCE
 */
import { createRoot } from '@wordpress/element';
import { doAction } from '@wordpress/hooks';
import FormsListApp from './FormsListApp';
import { registerScreen } from '../../app/client';

// On its own page it mounts into the list container; in the admin app the
// shell mounts it on the post or registration list route (task 5d), after
// writing that list's window globals.
registerScreen( 'forms-list', [ 'wpuf-post-forms-list-table-view', 'wpuf-profile-forms-list-table-view' ], ( container ) => {
    const root = createRoot( container );

    root.render( <FormsListApp /> );

    return () => root.unmount();
} );

doAction( 'wpuf.formsList.init' );
