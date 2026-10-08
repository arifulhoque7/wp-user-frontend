/**
 * The three cards under the topics: review, report a bug, contact support.
 *
 * @since WPUF_SINCE
 */
import { Button } from '@wpuf/components';

/**
 * @param {Object}   props
 * @param {Object[]} props.blocks { image, title, text, button, url }.
 */
export default function HelpCards( { blocks } ) {
    return (
        <div className="wpuf-help-cards mt-6 grid gap-6 md:grid-cols-3">
            { blocks.map( ( block ) => (
                <div key={ block.url } className="flex flex-col items-center rounded-[10px] border border-solid border-gray-200 bg-white p-8 text-center shadow-sm">
                    <img src={ block.image } alt="" className="h-14 w-auto" />
                    <h3 className="m-0 mt-4 text-base font-semibold text-gray-900">{ block.title }</h3>
                    <p className="m-0 mt-2 flex-1 text-sm text-gray-500">{ block.text }</p>
                    <Button variant="secondary" className="mt-5" onClick={ () => window.open( block.url, '_blank', 'noopener' ) }>{ block.button }</Button>
                </div>
            ) ) }
        </div>
    );
}
