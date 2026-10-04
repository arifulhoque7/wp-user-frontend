/**
 * FormsListApp — root component for the Forms List page.
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';
import { WpufProviders, PageHeader } from '@wpuf/components';
import FormsList from './components/FormsList';

const FormsListApp = () => {
    const postType = window.wpuf_forms_list.post_type
        ? window.wpuf_forms_list.post_type
        : 'wpuf_forms';

    const formType = postType === 'wpuf_forms' ? 'post' : 'profile';
    const pageSlug = formType === 'post' ? 'wpuf-post-forms' : 'wpuf-profile-forms';
    const pageTitle = formType === 'post'
        ? __( 'Post Forms', 'wp-user-frontend' )
        : __( 'Profile Forms', 'wp-user-frontend' );

    // `host`: the screen keeps its own layout markup (title row, table), design.md D25.
    return (
        <WpufProviders host>
            <PageHeader utm="wpuf-form-builder" />
            <FormsList
                postType={ postType }
                formType={ formType }
                pageSlug={ pageSlug }
                pageTitle={ pageTitle }
            />
        </WpufProviders>
    );
};

export default FormsListApp;
