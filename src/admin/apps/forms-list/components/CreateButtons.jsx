/**
 * "AI Form Builder" and "Add New" (title row and the no-forms state).
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wpuf/components';

const AiIcon = () => (
    <svg className="w-5 h-5 pr-1" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M8.17766 13.2532L7.5 15.625L6.82234 13.2532C6.4664 12.0074 5.4926 11.0336 4.24682 10.6777L1.875 10L4.24683 9.32234C5.4926 8.9664 6.4664 7.9926 6.82234 6.74682L7.5 4.375L8.17766 6.74683C8.5336 7.9926 9.5074 8.9664 10.7532 9.32234L13.125 10L10.7532 10.6777C9.5074 11.0336 8.5336 12.0074 8.17766 13.2532Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.2157 7.26211L15 8.125L14.7843 7.26212C14.5324 6.25444 13.7456 5.46764 12.7379 5.21572L11.875 5L12.7379 4.78428C13.7456 4.53236 14.5324 3.74556 14.7843 2.73789L15 1.875L15.2157 2.73788C15.4676 3.74556 16.2544 4.53236 17.2621 4.78428L18.125 5L17.2621 5.21572C16.2544 5.46764 15.4676 6.25444 15.2157 7.26211Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.0785 17.1394L13.75 18.125L13.4215 17.1394C13.2348 16.5795 12.7955 16.1402 12.2356 15.9535L11.25 15.625L12.2356 15.2965C12.7955 15.1098 13.2348 14.6705 13.4215 14.1106L13.75 13.125L14.0785 14.1106C14.2652 14.6705 14.7045 15.1098 15.2644 15.2965L16.25 15.625L15.2644 15.9535C14.7045 16.1402 14.2652 16.5795 14.0785 17.1394Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/**
 * @param {Object}        props
 * @param {Function}      props.onAddNew        Open the templates modal.
 * @param {Function|null} props.onAIFormBuilder Start the AI builder (null hides it).
 */
const CreateButtons = ( { onAddNew, onAIFormBuilder } ) => (
    <div className="flex gap-3 justify-center">
        { onAIFormBuilder && (
            <Button
                onClick={ onAIFormBuilder }
                className="gap-0 bg-gradient-to-r from-purple-600 to-blue-600 enabled:hover:from-purple-700 enabled:hover:to-blue-700"
            >
                <AiIcon />
                { __( 'AI Form Builder', 'wp-user-frontend' ) }
            </Button>
        ) }
        { /* `new-wpuf-form`: legacy scripts open the templates modal from it. */ }
        <Button onClick={ onAddNew } className="new-wpuf-form gap-1">
            <span className="dashicons dashicons-plus-alt2" aria-hidden="true"></span>
            { __( 'Add New', 'wp-user-frontend' ) }
        </Button>
    </div>
);

export default CreateButtons;
