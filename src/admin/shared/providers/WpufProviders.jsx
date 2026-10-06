/**
 * Wraps a WPUF admin React tree in plugin-ui's ThemeProvider (WPUF tokens),
 * one Toaster and an error boundary. Rendered by each screen that uses
 * shared/ui (window.wpuf.components.WpufProviders for Pro), and the host of
 * the `dialogs` API.
 */
import { ThemeProvider, Toaster } from '@wedevs/plugin-ui';

import { wpufDarkTokens, wpufTokens } from '../theme';
import ErrorBoundary from './ErrorBoundary';
import { DialogHost } from '../ui/dialogs';

export const PLUGIN_ID = 'wpuf-admin';

/**
 * @param {Object}  props
 * @param {*}       props.children     Screen tree.
 * @param {boolean} [props.withToaster] Render the Toaster (one per page; default true).
 * @param {boolean} [props.host]        The tree still has legacy markup (a screen being
 *                                      migrated): plugin-ui styles then reach only plugin-ui
 *                                      parts (`[data-slot]`) and wrapper roots
 *                                      (`[data-wpuf-ui]`), so the legacy markup keeps its
 *                                      look (design.md D25). Keep it while the screen renders
 *                                      its own layout markup (headings, tables, grids).
 */
export default function WpufProviders( { children, withToaster = true, host = false } ) {
    return (
        <ThemeProvider pluginId={ PLUGIN_ID } tokens={ wpufTokens } darkTokens={ wpufDarkTokens } mode="light" className={ host ? 'wpuf-pui-host' : '' }>
            <ErrorBoundary>{ children }</ErrorBoundary>
            { /* Where develop showed its toasts: 80px from the top, 32px from the right. */ }
            { withToaster && (
                <div data-wpuf-ui="">
                    <Toaster position="top-right" offset={ { top: 80, right: 32 } } richColors />
                </div>
            ) }
            { /* Dialogs opened through `dialogs` (one host per page, with the Toaster). */ }
            { withToaster && <DialogHost /> }
        </ThemeProvider>
    );
}
