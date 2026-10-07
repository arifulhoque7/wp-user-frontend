import { useEffect, useCallback, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { dialogs } from '@wpuf/components';
import { STORE_NAME } from '../store';
import { addRouteGuard } from '../../../app/client';

/**
 * Hook that warns users before leaving the page with unsaved changes. In the
 * admin app, leaving the builder route asks first too (no page unload there).
 */
export default function useDirtyState() {
    const isDirty = useSelect( ( select ) => {
        return select( STORE_NAME ).getIsDirty();
    }, [] );
    const dirtyRef = useRef( isDirty );

    dirtyRef.current = isDirty;

    const handleBeforeUnload = useCallback( ( e ) => {
        if ( isDirty ) {
            e.preventDefault();
            e.returnValue = __( 'You have unsaved changes. Are you sure you want to leave?', 'wp-user-frontend' );
        }
    }, [ isDirty ] );

    useEffect( () => {
        window.addEventListener( 'beforeunload', handleBeforeUnload );

        return () => {
            window.removeEventListener( 'beforeunload', handleBeforeUnload );
        };
    }, [ handleBeforeUnload ] );

    useEffect(
        () => addRouteGuard( () => {
            if ( ! dirtyRef.current ) {
                return true;
            }

            return dialogs.confirm( {
                tone: 'danger',
                title: __( 'Unsaved Changes', 'wp-user-frontend' ),
                message: __( 'You have unsaved changes. Are you sure you want to leave?', 'wp-user-frontend' ),
                confirmText: __( 'Discard Changes', 'wp-user-frontend' ),
                cancelText: __( 'Continue Editing', 'wp-user-frontend' ),
            } );
        } ),
        []
    );
}
