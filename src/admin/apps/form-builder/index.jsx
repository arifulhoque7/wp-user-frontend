import { createRoot } from '@wordpress/element';
import { ScreenSlots, WpufProviders } from '@wpuf/components';
import deprecated from '@wordpress/deprecated';
import { addAction, doAction, removeAction } from '@wordpress/hooks';
import { BUILDER_SLOTS, settingsSlotName } from './slots';
import { dispatch } from '@wordpress/data';
import { STORE_NAME } from './store';
import {
    registerFieldPreview,
    registerFieldSettingInput,
    registerFieldValidator,
    getFieldPreview,
    getFieldSettingInput,
    getFieldValidators,
    getAllFieldPreviews,
    getAllFieldSettingInputs,
} from './extensions/registry';
import { hasRecaptchaApiKeys, hasTurnstileApiKeys } from './utils/globalHelpers';
import { fireRootInit } from './extensions/hooks';
import { registerFreeFieldPreviews } from './components/FieldPreview';
import { useFieldClasses, formatPrice } from './hooks/useFieldClasses';
import { isPhpTruthy, isRichEditor } from './utils/fieldUtils';
import HelpText from './components/FieldPreview/HelpText';
import SettingHelpText from './components/FieldSettings/inputs/SettingHelpText';
import LegacySlot from './common/LegacySlot';
import FormBuilder from './components/FormBuilder';
import { openHiddenTaxonomies } from './common/BuilderDialogs';

/**
 * Initialize the store from PHP-localized data.
 */
function initializeStore() {
    const data = window.wpuf_form_builder || {};

    const initialState = {
        post: data.post || {},
        formFields: data.form_fields || [],
        panelSections: ( data.panel_sections || [] ).map( ( section ) => ( {
            ...section,
            show: section.show !== undefined ? section.show : true,
        } ) ),
        fieldSettings: data.field_settings || {},
        notifications: data.notifications || [],
        settings: data.form_settings || {},
        integrations: data.integrations || {},
        isProActive: !! data.is_pro_active,
        formType: data.form_type || data.post?.post_type || '',
        i18n: data.i18n || {},
    };

    const store = dispatch( STORE_NAME );

    // Set all state at once, then override with individual setters that
    // have specific reducer logic (e.g. panelSections adds `show` flag).
    store.initializeState( initialState );
    store.setFormFields( initialState.formFields );
    store.setPanelSections( initialState.panelSections );
    store.setFormSettings( initialState.settings );

    // Populate taxonomy section fields based on current post type
    const wpPostTypes = data.wp_post_types || {};
    const currentPostType = ( data.form_settings || {} ).post_type || 'post';
    const taxonomies = wpPostTypes[ currentPostType ];

    if ( taxonomies ) {
        store.setPanelSectionFields( 'taxonomies', Object.keys( taxonomies ) );
    }

    // Update taxonomy section when post type dropdown changes
    const postTypeDropdown = document.querySelector( 'select[name="wpuf_settings[post_type]"]' );

    if ( postTypeDropdown ) {
        postTypeDropdown.addEventListener( 'change', ( e ) => {
            const newTaxonomies = wpPostTypes[ e.target.value ];
            store.setPanelSectionFields( 'taxonomies', newTaxonomies ? Object.keys( newTaxonomies ) : [] );
        } );
    }

    return initialState;
}

/**
 * Expose the global wpuf API for Pro extensions.
 */
window.wpuf = window.wpuf || {};
window.wpuf.registerFieldPreview = registerFieldPreview;
window.wpuf.registerFieldSettingInput = registerFieldSettingInput;
window.wpuf.getFieldPreview = getFieldPreview;
window.wpuf.getFieldSettingInput = getFieldSettingInput;
window.wpuf.getAllFieldPreviews = getAllFieldPreviews;
window.wpuf.getAllFieldSettingInputs = getAllFieldSettingInputs;
window.wpuf.registerFieldValidator = registerFieldValidator;
window.wpuf.getFieldValidators = getFieldValidators;
window.wpuf.storeName = STORE_NAME;
window.wpuf.useFieldClasses = useFieldClasses;
// Preview rules shared with Pro's previews (rich editor as the frontend, PHP truthiness).
window.wpuf.isRichEditor = isRichEditor;
window.wpuf.isPhpTruthy = isPhpTruthy;
window.wpuf.formatPrice = formatPrice;
window.wpuf.HelpText = HelpText;
window.wpuf.SettingHelpText = SettingHelpText;
window.wpuf.LegacySlot = LegacySlot;
window.wpuf.builderSlots = { ...BUILDER_SLOTS, settings: settingsSlotName };

/**
 * Retired Vue globals (4.4g): window.wpuf_mixins stays defined and
 * wpuf_form_builder.event_hub forwards to wp.hooks actions
 * `wpuf.formBuilder.event.<name>`; both warn once (@wordpress/deprecated).
 */
function installRetiredGlobals() {
    const builder = window.wpuf_form_builder || {};
    const eventAction = ( name ) => `wpuf.formBuilder.event.${ name }`;
    const warnHub = () => deprecated( 'wpuf_form_builder.event_hub', { alternative: 'wp.hooks actions wpuf.formBuilder.event.<name>', plugin: 'WP User Frontend' } );

    builder.event_hub = {
        $on( name, callback ) {
            warnHub();
            addAction( eventAction( name ), 'wpuf/event-hub', callback );
        },
        $emit( name, ...args ) {
            warnHub();
            doAction( eventAction( name ), ...args );
        },
        $off( name ) {
            warnHub();
            removeAction( eventAction( name ), 'wpuf/event-hub' );
        },
    };
    window.wpuf_form_builder = builder;

    const mixins = window.wpuf_mixins || {};

    try {
        Object.defineProperty( window, 'wpuf_mixins', {
            configurable: true,
            get() {
                deprecated( 'window.wpuf_mixins', { alternative: 'window.wpuf.registerFieldPreview / registerFieldSettingInput', plugin: 'WP User Frontend' } );
                return mixins;
            },
        } );
    } catch ( e ) {
        window.wpuf_mixins = mixins;
    }
}

/**
 * Mount the React app.
 */
document.addEventListener( 'DOMContentLoaded', () => {
    const container = document.getElementById( 'wpuf-form-builder-app' );

    if ( ! container ) {
        return;
    }

    installRetiredGlobals();
    initializeStore();
    registerFreeFieldPreviews();

    // Register built-in field validators
    registerFieldValidator( 'has_recaptcha_api_keys', hasRecaptchaApiKeys );
    registerFieldValidator( 'has_turnstile_api_keys', hasTurnstileApiKeys );

    fireRootInit();

    // Show "Pro Fields Hidden" warning when form has custom taxonomy fields and Pro is not active
    const builderData = window.wpuf_form_builder || {};

    if ( builderData.has_hidden_taxonomies && ! builderData.is_pro_active ) {
        setTimeout( openHiddenTaxonomies, 500 );
    }

    const root = createRoot( container );
    // The shared layer (design.md D24): `host` keeps the builder's own markup
    // as it is; only the shared wrappers get the plugin-ui styles (D25).
    root.render(
        <WpufProviders host>
            { /* Slots + PluginArea scope `wpuf-form-builder` (4.4g, slots.js). */ }
            <ScreenSlots screen="form-builder">
                <FormBuilder />
            </ScreenSlots>
        </WpufProviders>
    );
} );
