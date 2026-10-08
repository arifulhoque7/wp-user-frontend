/**
 * One topic: title, body (the shared partial's HTML, kses'd on the server),
 * the docs button and the related articles.
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wpuf/components';

/**
 * @param {Object} props
 * @param {Object} props.topic { id, title, body, button: { label, url }, articles: [{ title, url }] }.
 */
export default function HelpTopic( { topic } ) {
    return (
        <article className="rounded-[10px] border border-solid border-gray-200 bg-white p-8 shadow-sm" data-topic={ topic.id } aria-labelledby={ `wpuf-help-${ topic.id }` }>
            <h2 id={ `wpuf-help-${ topic.id }` } className="m-0 mb-4 text-xl font-semibold text-gray-900">{ topic.title }</h2>

            { /* Plugin's own translated text from views/help/<id>.php, through wp_kses_post. */ }
            <div className="wpuf-help-body text-sm leading-6 text-gray-700" dangerouslySetInnerHTML={ { __html: topic.body } } />

            { topic.button?.url && (
                <div className="mt-6">
                    <Button onClick={ () => window.open( topic.button.url, '_blank', 'noopener' ) }>{ topic.button.label }</Button>
                </div>
            ) }

            { topic.articles?.length > 0 && (
                <div className="mt-8 border-0 border-t border-solid border-gray-200 pt-6">
                    <h3 className="m-0 mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{ __( 'Related Articles:', 'wp-user-frontend' ) }</h3>
                    <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
                        { topic.articles.map( ( article ) => (
                            <li key={ article.url } className="m-0">
                                <a href={ article.url } target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-gray-400 group-hover:text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8M16 17H8M10 9H8" /></svg>
                                    { article.title }
                                </a>
                            </li>
                        ) ) }
                    </ul>
                </div>
            ) }
        </article>
    );
}
