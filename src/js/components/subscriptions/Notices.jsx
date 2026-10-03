/**
 * Toast notices for the subscriptions screen (store `wpuf/subscriptions-notice`),
 * same markup as develop's Notice.vue. The store hides each notice after 3s.
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const ICON_CLASSES = {
    success: 'text-green-500 bg-green-100',
    danger: 'text-red-500 bg-red-100',
};

export default function Notices() {
    const notices = useSelect( ( select ) => select( 'wpuf/subscriptions-notice' ).getNotices(), [] );
    const { removeNotice } = useDispatch( 'wpuf/subscriptions-notice' );

    if ( ! notices || ! notices.length ) {
        return null;
    }

    return (
        <div className="fixed top-20 right-8 z-10">
            { notices.map( ( notice, index ) => (
                <div
                    key={ `notice-${ index }` }
                    id={ `toast-${ notice.type }` }
                    className="flex justify-between items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-sm"
                    role="alert"
                >
                    <div className="flex items-center justify-between">
                        <div className={ `${ ICON_CLASSES[ notice.type ] || '' } mr-2 rounded-lg flex items-center justify-center w-8 h-8` }>
                            { notice.type === 'success' ? (
                                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z" />
                                </svg>
                            ) }
                        </div>
                        <div className="ms-3 text-sm font-normal">{ notice.message }</div>
                    </div>
                    <button
                        type="button"
                        onClick={ () => removeNotice( index ) }
                        className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8"
                        aria-label={ __( 'Close', 'wp-user-frontend' ) }
                    >
                        <span className="sr-only">{ __( 'Close', 'wp-user-frontend' ) }</span>
                        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                        </svg>
                    </button>
                </div>
            ) ) }
        </div>
    );
}
