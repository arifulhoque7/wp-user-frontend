import { __ } from '@wordpress/i18n';

/**
 * Wraps a Pro-only field (when Pro is inactive) in a disabled preview with an
 * "Upgrade to PRO" overlay on hover. Mirrors the Form Builder Settings kit's
 * ProPreviewWrapper design (dashed border, dimmed, emerald hover overlay).
 */
export default function ProPreviewWrapper( { children } ) {
    const wpuf = window.wpuf_settings || {};
    const proLink = wpuf.upgrade_url || 'https://wedevs.com/wp-user-frontend-pro/pricing/';

    return (
        <div className="relative rounded-sm border border-dashed border-transparent hover:border-sky-500 group/pro-item transition-all opacity-60 hover:opacity-100">
            <a
                className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 z-30 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white! opacity-0 group-hover/pro-item:wpuf-opacity-100 transition-all hover:bg-primaryHover"
                target="_blank"
                rel="noopener noreferrer"
                href={ proLink }
            >
                { __( 'Upgrade to PRO', 'wp-user-frontend' ) }
            </a>
            <div className="absolute inset-0 z-20 rounded-sm bg-emerald-50 opacity-0 group-hover/pro-item:wpuf-opacity-60 transition-all" />
            <div className="pointer-events-none">{ children }</div>
        </div>
    );
}
