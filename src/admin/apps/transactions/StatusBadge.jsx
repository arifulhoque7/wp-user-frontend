/**
 * Status of a payment row.
 *
 * @since WPUF_SINCE
 */
import { __ } from '@wordpress/i18n';

const LOOK = {
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
};

const LABEL = {
    completed: __( 'Completed', 'wp-user-frontend' ),
    pending: __( 'Pending', 'wp-user-frontend' ),
};

/**
 * @param {Object} props
 * @param {string} props.status Row status.
 */
export default function StatusBadge( { status } ) {
    return (
        <span className={ `inline-flex items-center rounded-[5px] border border-solid px-3 py-0.5 text-xs font-medium ${ LOOK[ status ] || 'border-gray-200 bg-gray-50 text-gray-600' }` }>
            { LABEL[ status ] || ( status ? status.charAt( 0 ).toUpperCase() + status.slice( 1 ) : '' ) }
        </span>
    );
}
