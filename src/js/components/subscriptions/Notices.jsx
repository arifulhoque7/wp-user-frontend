/**
 * Toast notices for the subscriptions screen (store `wpuf/subscriptions-notice`),
 * same markup as develop's Notice.vue. The store hides each notice after 3s.
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const ICON_CLASSES = {
    success: 'wpuf-text-green-500 wpuf-bg-green-100',
    danger: 'wpuf-text-red-500 wpuf-bg-red-100',
};

export default function Notices() {
    const notices = useSelect( ( select ) => select( 'wpuf/subscriptions-notice' ).getNotices(), [] );
    const { removeNotice } = useDispatch( 'wpuf/subscriptions-notice' );

    if ( ! notices || ! notices.length ) {
        return null;
    }

    return (
        <div className="wpuf-fixed wpuf-top-20 wpuf-right-8 wpuf-z-10">
            { notices.map( ( notice, index ) => (
                <div
                    key={ `notice-${ index }` }
                    id={ `toast-${ notice.type }` }
                    className="wpuf-flex wpuf-justify-between wpuf-items-center wpuf-w-full wpuf-max-w-xs wpuf-p-4 wpuf-mb-4 wpuf-text-gray-500 wpuf-bg-white wpuf-rounded-lg wpuf-shadow"
                    role="alert"
                >
                    <div className="wpuf-flex wpuf-items-center wpuf-justify-between">
                        <div className={ `${ ICON_CLASSES[ notice.type ] || '' } wpuf-mr-2 wpuf-rounded-lg wpuf-flex wpuf-items-center wpuf-justify-center wpuf-w-8 wpuf-h-8` }>
                            { notice.type === 'success' ? (
                                <svg className="wpuf-w-5 wpuf-h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                                </svg>
                            ) : (
                                <svg className="wpuf-w-5 wpuf-h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" />
                                </svg>
                            ) }
                        </div>
                        <div className="ms-3 wpuf-text-sm wpuf-font-normal">{ notice.message }</div>
                    </div>
                    <button
                        type="button"
                        onClick={ () => removeNotice( index ) }
                        className="ms-auto wpuf--mx-1.5 wpuf--my-1.5 wpuf-bg-white wpuf-text-gray-400 hover:wpuf-text-gray-900 wpuf-rounded-lg focus:wpuf-ring-2 focus:wpuf-ring-gray-300 wpuf-p-1.5 hover:wpuf-bg-gray-100 wpuf-inline-flex wpuf-items-center wpuf-justify-center wpuf-h-8 wpuf-w-8"
                        aria-label={ __( 'Close', 'wp-user-frontend' ) }
                    >
                        <span className="wpuf-sr-only">{ __( 'Close', 'wp-user-frontend' ) }</span>
                        <svg className="wpuf-w-3 wpuf-h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                        </svg>
                    </button>
                </div>
            ) ) }
        </div>
    );
}
