/**
 * Help page: title row, newsletter card, topics (nav + content card), help
 * cards. The open topic is in the route query (`#/help?topic=<id>`).
 *
 * @since WPUF_SINCE
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, PageFooter, PageHeader, PageShell } from '@wpuf/components';

import HelpCards from './HelpCards';
import HelpNewsletter from './HelpNewsletter';
import HelpTopic from './HelpTopic';
import HelpTopicNav from './HelpTopicNav';

const data = () => window.wpufHelp || {};

/**
 * @param {Object} props
 * @param {Object} [props.context] App route context.
 */
export default function HelpPage( { context } ) {
    const help = data();
    const topics = help.topics || [];
    const fromQuery = context?.getQuery?.().topic;
    const [ current, setCurrent ] = useState( topics.some( ( topic ) => topic.id === fromQuery ) ? fromQuery : topics[ 0 ]?.id );
    const topic = topics.find( ( item ) => item.id === current ) || topics[ 0 ];

    const open = ( id ) => {
        setCurrent( id );
        context?.setQuery?.( { topic: id } );
    };

    return (
        <PageShell>
            <PageHeader utm="wpuf-help" helpUrl={ help.docsUrl } helpLabel={ __( 'View all documentation', 'wp-user-frontend' ) } />

            <div className="wpuf-help mt-9 pb-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="m-0 p-0 text-2xl font-bold leading-none text-gray-900">{ __( 'Help', 'wp-user-frontend' ) }</h1>
                        <p className="m-0 mt-2 text-sm text-gray-500">{ __( 'Guides for every part of User Frontend, and where to get help.', 'wp-user-frontend' ) }</p>
                    </div>
                    <Button variant="secondary" onClick={ () => window.open( help.docsUrl, '_blank', 'noopener' ) }>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg>
                        { __( 'View all Documentations', 'wp-user-frontend' ) }
                    </Button>
                </div>

                <HelpNewsletter newsletter={ help.newsletter || {} } />

                <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
                    <HelpTopicNav topics={ topics } current={ topic?.id } onOpen={ open } />
                    { topic && <HelpTopic topic={ topic } /> }
                </div>

                <HelpCards blocks={ help.blocks || [] } />
            </div>
            <PageFooter />
        </PageShell>
    );
}
