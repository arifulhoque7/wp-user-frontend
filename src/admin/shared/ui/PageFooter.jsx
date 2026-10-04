/**
 * Page footer of the WPUF admin screens (FlyHR AppFooter, owner 2026-10-04,
 * design.md D26): a white band at the bottom of the gray page with the WP
 * User Frontend wordmark centered (20px, 70% opacity). Spans the screen
 * root's 20px side padding like PageHeader, 24px below the content (FlyHR's
 * panel padding); `mt-auto` keeps it at the bottom of a PageShell. WordPress's own #wpfooter is hidden on these screens.
 */
import { __ } from '@wordpress/i18n';
import { cn } from '@wedevs/plugin-ui';

import { useBoot } from '../hooks';

/**
 * @param {Object} props
 * @param {*}      [props.children] A small line under the logo (e.g. a classic view link).
 */
export default function PageFooter( { children, className } ) {
    const boot = useBoot();

    // The wrapper keeps FlyHR's 24px gap (its main panel's bottom padding)
    // between the content and the footer, and pushes it to the bottom.
    return (
        <div className={ cn( 'mt-auto pt-6', className ) }>
            <footer
                data-wpuf-ui=""
                className="-ml-5 w-[calc(100%+40px)] flex flex-col flex-wrap items-center justify-center gap-2 bg-white px-5 py-6"
            >
                { boot.assetUrl && (
                    <img
                        src={ boot.assetUrl + '/images/onboarding-logo.svg' }
                        alt={ __( 'WP User Frontend', 'wp-user-frontend' ) }
                        className="h-5 w-auto opacity-70"
                        height="20"
                    />
                ) }
                { children && <p className="m-0 text-xs text-gray-500">{ children }</p> }
            </footer>
        </div>
    );
}

/**
 * Full-height column for a screen (FlyHR shell): header, content, footer at
 * the bottom even when the content is short.
 *
 * @param {Object} props
 * @param {*}      props.children Header, content and PageFooter.
 */
export function PageShell( { children, className } ) {
    return <div className={ cn( 'flex min-h-[calc(100vh-32px)] flex-col', className ) }>{ children }</div>;
}
