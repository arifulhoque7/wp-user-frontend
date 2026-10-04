/**
 * AIConfigModal component — modal prompting user to configure AI provider.
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';

const AIConfigModal = ( { isOpen, onClose, onGoToSettings } ) => {
    if ( ! isOpen ) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black/50 z-[1000000] flex items-center justify-center">
            <div className="bg-white rounded-md p-8 max-w-xl w-full mx-5 relative">
                { /* Key Icon */ }
                <div className="flex justify-center mb-8">
                    <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="110" height="110" rx="55" fill="#D1FAE5" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M60 41C55.0294 41 51 45.0294 51 50C51 50.525 51.0451 51.0402 51.1317 51.5419C51.2213 52.0604 51.089 52.4967 50.8369 52.7489L42.1716 61.4142C41.4214 62.1644 41 63.1818 41 64.2426V68C41 68.5523 41.4477 69 42 69H47C47.5523 69 48 68.5523 48 68V66H50C50.5523 66 51 65.5523 51 65V63H53C53.2652 63 53.5196 62.8946 53.7071 62.7071L57.2511 59.1631C57.5033 58.911 57.9396 58.7787 58.4581 58.8683C58.9598 58.9549 59.475 59 60 59C64.9706 59 69 54.9706 69 50C69 45.0294 64.9706 41 60 41ZM60 45C59.4477 45 59 45.4477 59 46C59 46.5523 59.4477 47 60 47C61.6569 47 63 48.3431 63 50C63 50.5523 63.4477 51 64 51C64.5523 51 65 50.5523 65 50C65 47.2386 62.7614 45 60 45Z" fill="#065F46" />
                    </svg>
                </div>

                { /* Title */ }
                <h2 className="text-2xl font-medium text-center text-gray-900 mb-4">
                    { __( 'AI Provider Not Configured', 'wp-user-frontend' ) }
                </h2>

                { /* Description */ }
                <p className="text-lg text-center text-gray-400 mb-16">
                    { __( 'To use AI Form Generation, please connect an AI provider by adding your API key in the settings', 'wp-user-frontend' ) }
                </p>

                { /* Buttons */ }
                <div className="flex justify-center gap-3">
                    <button
                        onClick={ onClose }
                        className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-lg transition-colors min-w-[101px]"
                    >
                        { __( 'Cancel', 'wp-user-frontend' ) }
                    </button>
                    <button
                        onClick={ onGoToSettings }
                        className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-lg transition-colors min-w-[158px]"
                    >
                        { __( 'Go to Settings', 'wp-user-frontend' ) }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIConfigModal;
