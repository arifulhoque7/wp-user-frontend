import { useCallback } from '@wordpress/element';
import HelpTextIcon from './HelpTextIcon';

/**
 * Fields that show a Pro badge icon next to their label when Pro is not active.
 * Matches Vue's $badge_fields in wpuf_render_settings_field().
 */
const BADGE_FIELDS = [ 'enable_multistep', 'notification_edit' ];

/**
 * Toggle switch field — matches Vue wpuf_render_settings_field() for type="toggle".
 *
 * Vue structure: label + help_text on left, checkbox-based toggle on right,
 * all inside a flex row with justify-between and w-2/5.
 * Uses sr-only checkbox + peer classes for the toggle visual.
 */
export default function ToggleField( { field, name, value, onChange } ) {
    const isOn = value === 'yes' || value === true || value === 'on';
    const data = window.wpuf_form_builder || {};
    const isProActive = !! data.is_pro_active;
    const showProBadge = ! isProActive && BADGE_FIELDS.includes( name );
    const proBadgeUrl = ( data.asset_url || '' ) + '/images/pro-badge.svg';

    const handleToggle = useCallback( () => {
        onChange( name, isOn ? 'off' : 'on' );
    }, [ name, isOn, onChange ] );

    return (
        <div className="flex items-center justify-between w-2/5">
            <div className="flex items-center">
                { field.label && (
                    <label htmlFor={ name } className="text-sm text-gray-700 my-2">
                        { field.label }
                    </label>
                ) }
                { field.help_text && <HelpTextIcon text={ field.help_text } /> }
                { showProBadge && (
                    <img className="ml-2" src={ proBadgeUrl } alt="" />
                ) }
            </div>
            <label
                htmlFor={ name }
                className="relative inline-flex items-center cursor-pointer ml-2"
            >
                <input
                    type="checkbox"
                    id={ name }
                    checked={ isOn }
                    onChange={ handleToggle }
                    className="sr-only peer"
                />
                <span className="flex items-center w-10 h-4 bg-gray-300 rounded-full peer peer-checked:bg-primary after:w-6 after:h-6 after:bg-white after:rounded-full after:shadow-md after:duration-300 peer-checked:after:translate-x-4 after:border after:border-solid after:border-gray-50" />
            </label>
        </div>
    );
}
