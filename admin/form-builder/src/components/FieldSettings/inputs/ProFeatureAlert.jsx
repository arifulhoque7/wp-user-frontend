import { __ } from '@wordpress/i18n';

/**
 * A Pro-only option shown as a teaser row with the Pro badge (e.g. Conditional
 * Logic while Pro is off). Replaces Vue field-option-pro-feature-alert.
 */
export default function ProFeatureAlert( { optionField } ) {
    const data = window.wpuf_form_builder || {};

    return (
        <div className="panel-field-opt panel-field-opt-pro-feature wpuf-flex wpuf-items-center wpuf-text-sm wpuf-text-gray-700 wpuf-font-medium">
            <label>{ optionField.title } </label>
            <br />
            <label
                className="wpuf-pro-text-alert wpuf-ml-2 wpuf-tooltip-top"
                data-tip={ __( 'Available in PRO version', 'wp-user-frontend' ) }
            >
                <a href={ data.pro_link || '' } target="_blank" rel="noopener noreferrer">
                    <img src={ `${ data.asset_url || '' }/images/pro-badge.svg` } alt="pro icon" />
                </a>
            </label>
        </div>
    );
}
