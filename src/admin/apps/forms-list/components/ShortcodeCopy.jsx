/**
 * ShortcodeCopy component — displays a shortcode with a copy-to-clipboard button.
 * Pro gets it through the `wpuf.formsList.shortcodeRender` filter (same props).
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';
import { COPY_SVG_PATH } from '../utils/constants';

const ShortcodeCopy = ( { shortcode, copiedKey, currentCopiedKey, onCopy, compact = false } ) => {
    const isCopied = currentCopiedKey === copiedKey;
    // Compact: the smaller code box develop used for the profile shortcode pair.
    const spacing = compact ? 'mx-2 py-[5px] px-[10px]' : 'mr-2 py-[10px] px-[14px]';

    return (
        <div className="flex items-center">
            <code className={ `${ spacing } bg-gray-50 border border-gray-300 rounded-md shadow-xs` }>
                { isCopied ? __( 'Copied!', 'wp-user-frontend' ) : shortcode }
            </code>
            <button
                type="button"
                onClick={ () => onCopy( shortcode, copiedKey ) }
                className="p-0 bg-transparent border-0 cursor-pointer text-gray-500 hover:text-gray-700 rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
                title={ __( 'Copy shortcode', 'wp-user-frontend' ) }
                aria-label={ __( 'Copy shortcode', 'wp-user-frontend' ) }
            >
                <svg
                    className="block stroke-gray-400"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
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
            <span className="sr-only" aria-live="polite">{ isCopied ? __( 'Copied!', 'wp-user-frontend' ) : '' }</span>
        </div>
    );
};

export default ShortcodeCopy;
