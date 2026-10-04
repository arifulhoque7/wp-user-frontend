/**
 * Toasts (replaces the builder's toastr `showToast( message, type )` and the
 * subscriptions notice store): plugin-ui's sonner, rendered by the Toaster in
 * WpufProviders (80px from the top, 32px from the right, like develop).
 * Types: success, error / danger, warning, info.
 */
import { toast } from '@wedevs/plugin-ui';

/**
 * @param {*}      message Message.
 * @param {string} [type]  success|error|danger|warning|info
 *
 * @return {*} Toast id.
 */
export default function notify( message, type = 'success' ) {
    const kind = 'danger' === type ? 'error' : type;
    const show = toast[ kind ] || toast;

    return show( message );
}
