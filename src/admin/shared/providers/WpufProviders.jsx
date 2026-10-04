/**
 * Wraps a WPUF admin React tree in plugin-ui's ThemeProvider (WPUF tokens),
 * one Toaster and an error boundary. Rendered by each screen that uses
 * shared/ui (window.wpuf.components.WpufProviders for Pro).
 */
import { ThemeProvider, Toaster } from '@wedevs/plugin-ui';

import { wpufDarkTokens, wpufTokens } from '../theme';
import ErrorBoundary from './ErrorBoundary';

export const PLUGIN_ID = 'wpuf-admin';

/**
 * @param {Object}  props
 * @param {*}       props.children     Screen tree.
 * @param {boolean} [props.withToaster] Render the Toaster (one per page; default true).
 */
export default function WpufProviders( { children, withToaster = true } ) {
    return (
        <ThemeProvider pluginId={ PLUGIN_ID } tokens={ wpufTokens } darkTokens={ wpufDarkTokens } mode="light">
            <ErrorBoundary>{ children }</ErrorBoundary>
            { /* Where develop showed its toasts: 80px from the top, 32px from the right. */ }
            { withToaster && <Toaster position="top-right" offset={ { top: 80, right: 32 } } richColors /> }
        </ThemeProvider>
    );
}
