import { __ } from '@wordpress/i18n';
import { openProFeature } from './BuilderDialogs';

/**
 * Show a Pro feature upgrade dialog (shared dialogs).
 * Replaces the Vue form-field-option-pro-feature-alert component.
 *
 * @param {string} featureName  Name of the Pro feature
 *
 * @return {Promise<boolean>} Upgrade chosen.
 */
export function showProFeatureAlert( featureName ) {
    return openProFeature( featureName );
}

/**
 * ProFeatureAlert component that renders an inline upgrade badge.
 *
 * @param {Object} props
 * @param {string} props.featureName
 */
export default function ProFeatureAlert( { featureName } ) {
    return (
        <span
            className="wpuf-pro-feature-badge"
            onClick={ () => showProFeatureAlert( featureName ) }
            role="button"
            tabIndex={ 0 }
            onKeyDown={ ( e ) => {
                if ( e.key === 'Enter' || e.key === ' ' ) {
                    showProFeatureAlert( featureName );
                }
            } }
        >
            <img
                src={
                    ( window.wpuf_form_builder?.lock_icon ) ||
                    ''
                }
                alt={ __( 'Pro feature', 'wp-user-frontend' ) }
                className="wpuf-pro-lock-icon"
            />
        </span>
    );
}
