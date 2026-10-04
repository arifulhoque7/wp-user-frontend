import { useCallback, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import { STORE_NAME } from '../../store';
import SettingsField from './SettingsField';
import ProPreviewWrapper from './ProPreviewWrapper';
import { useFieldVisibility, MUTUAL_EXCLUSIONS } from './useFieldDependencies';

/**
 * Where a setting is stored, from its input `name` as PHP parses the posted
 * form (develop): `wpuf_settings[key]` -> [ key ], `wpuf_settings[group][key]`
 * -> [ group, key ]; any other name is the key itself.
 *
 * @param {string} name Input name (`field.name`) or the field key.
 * @return {Array<string>} [ key ] or [ group, key ].
 */
export function settingPath( name ) {
    const match = /^wpuf_settings\[(\w+)\](?:\[(\w+)\])?(?:\[\])?$/.exec( name || '' );

    if ( ! match ) {
        return [ name ];
    }

    return match[ 2 ] ? [ match[ 1 ], match[ 2 ] ] : [ match[ 1 ] ];
}

/**
 * The value a settings row shows (develop's wpuf_render_settings_field): the
 * stored value when it is set (`''` included), else the field's `value`, else
 * its `default`, else `''`. A key switched off in this session (set to
 * undefined, left out of the save) shows as off, not as its default.
 *
 * @param {Object} settings  Store settings.
 * @param {string} fieldName Field key.
 * @param {Object} fieldDef  Field definition.
 * @return {*} Value to show.
 */
export function resolveSettingValue( settings, fieldName, fieldDef ) {
    const path = settingPath( fieldDef.name || fieldName );
    const owner = 2 === path.length ? settings[ path[ 0 ] ] : settings;
    const key = path[ path.length - 1 ];

    if ( owner && 'object' === typeof owner && Object.prototype.hasOwnProperty.call( owner, key ) && null !== owner[ key ] ) {
        return owner[ key ];
    }

    return fieldDef.value || fieldDef.default || '';
}

/**
 * Renders a settings section content area — mirrors post-form-settings.php Vue template.
 *
 * Handles conditional field visibility via useFieldVisibility hook,
 * mirroring Vue's FormDependencyHandler class.
 */
export default function SettingsSection( { sectionKey, sectionData } ) {
    const settings = useSelect( ( select ) => select( STORE_NAME ).getSettings(), [] );
    const { updateFormSetting } = useDispatch( STORE_NAME );

    // Build a merged settings view that includes flattened nested values
    // so field dependencies (e.g. new_to depends on "new") can resolve correctly.
    const resolvedSettings = useMemo( () => {
        const merged = { ...settings };

        for ( const key of Object.keys( settings ) ) {
            const val = settings[ key ];

            if ( val && typeof val === 'object' && ! Array.isArray( val ) ) {
                for ( const subKey of Object.keys( val ) ) {
                    if ( merged[ subKey ] === undefined ) {
                        merged[ subKey ] = val[ subKey ];
                    }
                }
            }
        }

        return merged;
    }, [ settings ] );

    const isFieldVisible = useFieldVisibility( resolvedSettings );

    // An inline group (guest Name / E-Mail labels, schedule From / To) shares
    // one row: develop hid that row whenever a sub-field with a rule failed
    // (sub-fields without a rule never touch it).
    const isVisible = ( fieldName, fieldDef ) => {
        if ( ! isFieldVisible( fieldName ) ) {
            return false;
        }

        const inner = fieldDef && ( 'inline_fields' === fieldDef.type || ( ! fieldDef.type && fieldDef.fields ) ) ? Object.keys( fieldDef.fields || {} ) : [];

        return inner.every( ( key ) => isFieldVisible( key ) );
    };

    // Stores under the key the input name points at (develop: PHP parses
    // `wpuf_settings[key]` / `wpuf_settings[group][key]` from the posted form).
    const handleChange = useCallback( ( name, value ) => {
        const path = settingPath( name );
        const key = path[ path.length - 1 ];

        if ( 2 === path.length ) {
            const currentGroup = settings[ path[ 0 ] ] || {};
            updateFormSetting( path[ 0 ], { ...currentGroup, [ key ]: value } );
        } else {
            updateFormSetting( key, value );
        }

        // Handle mutual exclusivity (e.g. payment_options <-> enable_pricing_payment)
        const exclusion = MUTUAL_EXCLUSIONS[ key ];
        if ( exclusion ) {
            // If turning ON this toggle, turn OFF the other
            const isOn = value === 'on' || value === 'yes' || value === true;
            if ( isOn ) {
                updateFormSetting( exclusion, 'off' );
            }
        }
    }, [ updateFormSetting, settings ] );

    if ( ! sectionData ) {
        return null;
    }

    // Apply wp.hooks filter for Pro extensions to inject/modify fields
    const filteredData = applyFilters( 'wpuf.formBuilder.settingsFields', sectionData, sectionKey );

    // Check if section has sub-sections (section.before_post_settings, etc.)
    if ( filteredData.section ) {
        const sectionEntries = Object.entries( filteredData.section );

        return (
            <div className="wpuf-settings-section">
                { sectionEntries.map( ( [ subKey, subSection ], index ) => {
                    const isFirst = index === 0;
                    const isLast = index === sectionEntries.length - 1 && sectionEntries.length > 1;

                    let classList = 'wpuf-settings-body pb-8';
                    if ( ! isFirst ) {
                        classList = 'wpuf-settings-body pb-8 pt-6 border-t border-gray-200';
                    }
                    if ( isLast ) {
                        classList = 'wpuf-settings-body pt-6 border-t border-gray-200';
                    }

                    return (
                        <div
                            key={ subKey }
                            className={ classList }
                            data-settings-body={ sectionKey }
                        >
                            { subSection.label && (
                                <p className="text-lg font-medium mb-3 mt-0 leading-none">
                                    { subSection.label }
                                </p>
                            ) }
                            { subSection.desc && (
                                <p className="text-gray-500 text-[13px] leading-5 mb-4! mt-0!">
                                    { subSection.desc }
                                </p>
                            ) }
                            { subSection.fields && Object.entries( subSection.fields ).map( ( [ fieldName, fieldDef ] ) => {
                                const settingName = fieldDef.name || fieldName;
                                const settingValue = resolveSettingValue( settings, fieldName, fieldDef );

                                return (
                                    <SettingsField
                                        key={ fieldName }
                                        slotKey={ fieldName }
                                        hideControl={ ! isVisible( fieldName, fieldDef ) }
                                        field={ fieldDef }
                                        name={ settingName }
                                        value={ settingValue }
                                        onChange={ handleChange }
                                        settings={ resolvedSettings }
                                        resolveValue={ ( subName, subDef ) => resolveSettingValue( settings, subName, subDef ) }
                                    />
                                );
                            } ) }
                            { subSection.pro_preview && (
                                <ProPreviewWrapper
                                    proPreview={ subSection.pro_preview }
                                    onChange={ handleChange }
                                    settings={ settings }
                                />
                            ) }
                        </div>
                    );
                } ) }
            </div>
        );
    }

    // Direct fields at top level (no section prop) — Vue uses wpuf-settings-body -mt-6
    return (
        <div className="wpuf-settings-section">
            <div
                className="wpuf-settings-body -mt-6"
                data-settings-body={ sectionKey }
            >
                { Object.entries( filteredData ).map( ( [ fieldName, fieldDef ] ) => {
                    if ( fieldName === 'pro_preview' ) {
                        return null;
                    }
                    if ( ! fieldDef || typeof fieldDef !== 'object' ) {
                        return null;
                    }
                    const settingName = fieldDef.name || fieldName;
                    const settingValue = resolveSettingValue( settings, fieldName, fieldDef );

                    return (
                        <SettingsField
                            key={ fieldName }
                            slotKey={ fieldName }
                            hideControl={ ! isVisible( fieldName, fieldDef ) }
                            field={ fieldDef }
                            name={ settingName }
                            value={ settingValue }
                            onChange={ handleChange }
                            settings={ resolvedSettings }
                            resolveValue={ ( subName, subDef ) => resolveSettingValue( settings, subName, subDef ) }
                        />
                    );
                } ) }
                { filteredData.pro_preview && (
                    <ProPreviewWrapper
                        proPreview={ filteredData.pro_preview }
                        onChange={ handleChange }
                        settings={ settings }
                    />
                ) }
            </div>
        </div>
    );
}
