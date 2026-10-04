/**
 * ShortcodeCopy component — displays a shortcode with a copy-to-clipboard button.
 *
 * @since WPUF_SINCE
 */
import { COPY_SVG_PATH } from '../utils/constants';

const ShortcodeCopy = ( { shortcode, copiedKey, currentCopiedKey, onCopy, compact = false } ) => {
    const isCopied = currentCopiedKey === copiedKey;
    // Compact: the smaller code box develop used for the profile shortcode pair.
    const spacing = compact ? 'mx-2 py-[5px] px-[10px]' : 'mr-2 py-[10px] px-[14px]';

    return (
        <div className="flex items-center">
            <code className={ `${ spacing } bg-gray-50 border border-gray-300 rounded-md shadow-xs` }>
                { isCopied ? 'Copied!' : shortcode }
            </code>
            <button
                onClick={ () => onCopy( shortcode, copiedKey ) }
                className="text-gray-500 hover:text-gray-700 wpuf-focus:outline-none"
                title="Copy shortcode"
            >
                <svg
                    className="stroke-gray-400"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d={ COPY_SVG_PATH }
                        stroke="#6B7280"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </div>
    );
};

export default ShortcodeCopy;
