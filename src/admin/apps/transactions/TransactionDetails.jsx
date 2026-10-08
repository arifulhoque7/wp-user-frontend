/**
 * Every field of one payment, with its actions.
 *
 * @since WPUF_SINCE
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, Modal } from '@wpuf/components';

import StatusBadge from './StatusBadge';

/**
 * @param {Object} props
 * @param {*}      props.label Label.
 * @param {*}      props.children Value.
 */
const Row = ( { label, children } ) => (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2 text-sm">
        <dt className="text-gray-500">{ label }</dt>
        <dd className="m-0 break-words text-gray-900">{ children || <span className="text-gray-400">–</span> }</dd>
    </div>
);

const Linked = ( { item } ) => ( item ? ( item.url ? <a href={ item.url } className="text-primary no-underline hover:underline">{ item.title || item.code || item.name }</a> : ( item.title || item.code || item.name ) ) : null );

/**
 * @param {Object}   props
 * @param {Object}   props.row       Payment row (null: closed).
 * @param {Function} props.onClose   () => void
 * @param {Function} props.onAction  ( action, rows ) => void
 * @param {boolean}  props.canManage Actions allowed.
 */
export default function TransactionDetails( { row, onClose, onAction, canManage } ) {
    if ( ! row ) {
        return null;
    }

    const address = Object.values( row.payer_address || {} ).filter( Boolean ).join( ', ' );

    return (
        /* translators: %d: payment ID */
        <Modal open onClose={ onClose } title={ sprintf( __( 'Payment #%d', 'wp-user-frontend' ), row.id ) } className="max-w-xl">
            <div className="flex items-center gap-3">
                <StatusBadge status={ row.status } />
                <span className="text-sm text-gray-500">{ row.date }</span>
            </div>

            <dl className="m-0 mt-4">
                <Row label={ __( 'User', 'wp-user-frontend' ) }><Linked item={ row.user } /></Row>
                <Row label={ __( 'Subscription', 'wp-user-frontend' ) }><Linked item={ row.pack } /></Row>
                <Row label={ __( 'Post', 'wp-user-frontend' ) }><Linked item={ row.post } /></Row>
                <Row label={ __( 'Subtotal', 'wp-user-frontend' ) }>{ row.amounts.subtotal }</Row>
                <Row label={ __( 'Coupon', 'wp-user-frontend' ) }>
                    { row.coupon && <Linked item={ row.coupon } /> }
                    { row.amounts.discount && <span className="ms-2 text-gray-500">−{ row.amounts.discount }</span> }
                </Row>
                <Row label={ __( 'Tax', 'wp-user-frontend' ) }>{ row.amounts.tax }</Row>
                <Row label={ __( 'Total', 'wp-user-frontend' ) }><strong>{ row.amounts.cost }</strong></Row>
                <Row label={ __( 'Gateway', 'wp-user-frontend' ) }>{ row.gateway }</Row>
                <Row label={ __( 'Transaction ID', 'wp-user-frontend' ) }>{ row.transaction_id }</Row>
                <Row label={ __( 'Payer', 'wp-user-frontend' ) }>{ row.payer }</Row>
                <Row label={ __( 'Email', 'wp-user-frontend' ) }>{ row.payer_email }</Row>
                <Row label={ __( 'Address', 'wp-user-frontend' ) }>{ address }</Row>
            </dl>

            { canManage && (
                <div className="mt-6 flex justify-end gap-2">
                    { 'order' === row.kind && (
                        <>
                            <Button variant="secondary" onClick={ () => onAction( 'reject', [ row ] ) }>{ __( 'Reject', 'wp-user-frontend' ) }</Button>
                            <Button onClick={ () => onAction( 'accept', [ row ] ) }>{ __( 'Accept', 'wp-user-frontend' ) }</Button>
                        </>
                    ) }
                    { 'transaction' === row.kind && (
                        <Button variant="destructive" onClick={ () => onAction( 'delete', [ row ] ) }>{ __( 'Delete', 'wp-user-frontend' ) }</Button>
                    ) }
                </div>
            ) }
        </Modal>
    );
}
