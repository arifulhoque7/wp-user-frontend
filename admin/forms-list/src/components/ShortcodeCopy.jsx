/**
 * ShortcodeCopy component — displays a shortcode with a copy-to-clipboard button.
 *
 * @since WPUF_SINCE
 */
import { COPY_SVG_PATH } from '../utils/constants';

const ShortcodeCopy = ( { shortcode, copiedKey, currentCopiedKey, onCopy, compact = false } ) => {
    const isCopied = currentCopiedKey === copiedKey;
    // Compact: the smaller code box develop used for the profile shortcode pair.
    const spacing = compact ? 'wpuf-mx-2 wpuf-py-[5px] wpuf-px-[10px]' : 'wpuf-mr-2 wpuf-py-[10px] wpuf-px-[14px]';

    return (
        <div className="wpuf-flex wpuf-items-center">
            <code className={ `${ spacing } wpuf-bg-gray-50 wpuf-border wpuf-border-gray-300 wpuf-rounded-md wpuf-shadow-sm` }>
                { isCopied ? 'Copied!' : shortcode }
            </code>
            <button
                onClick={ () => onCopy( shortcode, copiedKey ) }
                className="wpuf-text-gray-500 hover:wpuf-text-gray-700 wpuf-focus:outline-none"
                title="Copy shortcode"
            >
                <svg
                    className="wpuf-stroke-gray-400"
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
