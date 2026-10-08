/**
 * The topics list beside the content card.
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';

/**
 * @param {Object}   props
 * @param {Object[]} props.topics  { id, label, icon }.
 * @param {string}   props.current Open topic id.
 * @param {Function} props.onOpen  ( id ) => void
 */
export default function HelpTopicNav( { topics, current, onOpen } ) {
    return (
        <nav aria-label={ __( 'Help topics', 'wp-user-frontend' ) } className="self-start rounded-[10px] border border-solid border-gray-200 bg-white p-2 shadow-sm">
            <ul className="m-0 list-none p-0">
                { topics.map( ( topic ) => {
                    const active = topic.id === current;

                    return (
                        <li key={ topic.id } className="m-0">
                            <button
                                type="button"
                                onClick={ () => onOpen( topic.id ) }
                                aria-current={ active ? 'page' : undefined }
                                data-topic={ topic.id }
                                className={ `wpuf-help-topic flex w-full cursor-pointer items-center gap-3 rounded-md border-0 px-3 py-2.5 text-start text-sm transition-colors ${ active ? 'bg-emerald-50 font-semibold text-primary' : 'bg-transparent font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900' }` }
                            >
                                <span aria-hidden="true" className={ `dashicons ${ topic.icon } ${ active ? 'text-primary' : 'text-gray-400' }` } />
                                { topic.label }
                            </button>
                        </li>
                    );
                } ) }
            </ul>
        </nav>
    );
}
