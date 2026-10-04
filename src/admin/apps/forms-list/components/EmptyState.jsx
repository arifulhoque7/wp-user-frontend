/**
 * EmptyState component — shown when there are no forms to display
 * (develop cases on the shared EmptyState).
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';
import { EmptyState as SharedEmptyState } from '@wpuf/components';
import CreateButtons from './CreateButtons';

const EmptyState = ( { type, onAddNew, onAIFormBuilder } ) => {
    if ( type === 'search' ) {
        return <SharedEmptyState size="compact" title={ __( 'No forms found matching your search!', 'wp-user-frontend' ) } />;
    }

    if ( type === 'tab-empty' ) {
        return <SharedEmptyState title={ __( 'No Items Here!', 'wp-user-frontend' ) } />;
    }

    return (
        <SharedEmptyState
            image={ window.wpuf_admin_script.asset_url + '/images/form-blank-state.svg' }
            title={ __( 'No Post Forms Created Yet', 'wp-user-frontend' ) }
            description={ __( 'Start building a post form to let users submit content from the frontend.', 'wp-user-frontend' ) }
            actions={ <CreateButtons onAddNew={ onAddNew } onAIFormBuilder={ onAIFormBuilder } /> }
        />
    );
};

export default EmptyState;
