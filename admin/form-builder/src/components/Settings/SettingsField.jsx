import { RawHTML } from '@wordpress/element';
import LegacySlot, { getLegacySlots } from '../../common/LegacySlot';
import ToggleField from './fields/ToggleField';
import TextField from './fields/TextField';
import NumberField from './fields/NumberField';
import TextareaField from './fields/TextareaField';
import SelectField from './fields/SelectField';
import MultiSelectField from './fields/MultiSelectField';
import CheckboxField from './fields/CheckboxField';
import TrailingTextField from './fields/TrailingTextField';
import DateField from './fields/DateField';
import ColorPickerField from './fields/ColorPickerField';
import PicRadioField from './fields/PicRadioField';
import RichTextField from './fields/RichTextField';
import InlineFieldsGroup from './fields/InlineFieldsGroup';
import SubmitConditionalLogic from '../ConditionalLogic/SubmitConditionalLogic';

const FIELD_MAP = {
    toggle: ToggleField,
    text: TextField,
    number: NumberField,
    textarea: TextareaField,
    select: SelectField,
    'multi-select': MultiSelectField,
    checkbox: CheckboxField,
    'trailing-text': TrailingTextField,
    date: DateField,
    'color-picker': ColorPickerField,
    'pic-radio': PicRadioField,
    'rich-text': RichTextField,
};

/**
 * Vue setting_class_names() equivalents.
 * Matches admin/form-builder/assets/js/form-builder.js:1036
 */
export const SETTING_CLASS_NAMES = {
    text: 'block min-w-full my-0 mb-0 leading-none! py-2.5! px-3.5! text-gray-700 shadow-xs! placeholder:text-gray-400 border border-gray-300! rounded-md! max-w-full focus:ring-transparent!',
    number: 'block min-w-full my-0 mb-0 leading-none! py-2.5! px-3.5! text-gray-700 shadow-xs! placeholder:text-gray-400 border border-gray-300! rounded-md! max-w-full focus:ring-transparent!',
    textarea: 'block min-w-full my-0 mb-0 leading-none! py-2.5! px-3.5! text-gray-700 shadow-xs! placeholder:text-gray-400 border border-gray-300! rounded-md! max-w-full focus:ring-transparent!',
    dropdown: 'block w-full min-w-full text-gray-700 font-normal shadow-xs! border border-gray-300! rounded-md! focus:ring-transparent! focus:checked:ring-transparent! hover:checked:ring-transparent! hover:text-gray-700! text-base! !leading-6',
    checkbox: 'mt-0! mr-2! h-4 w-4 shadow-none! checked:shadow-none! focus:checked:shadow-primary! focus:checked:shadow-none! border-gray-300! checked:border-primary! checked:bg-primary! checked:before:bg-white! hover:checked:bg-primary! focus:ring-transparent! focus:checked:ring-transparent! hover:checked:ring-transparent! focus:checked:bg-primary! focus:shadow-primary checked:focus:bg-primary! checked:hover:bg-primary checked:bg-primary! before:content-none! rounded-sm',
};

/**
 * Dispatches to the appropriate field component based on field type.
 *
 * Wraps each field in Vue's `mt-6 wpuf-input-container` div
 * matching the wpuf_render_settings_field() PHP function.
 */
export default function SettingsField( { slotKey, hideControl = false, ...props } ) {
    const row = slotKey ? getLegacySlots().settings[ slotKey ] : null;

    if ( ! row ) {
        return hideControl ? null : <SettingsFieldControl { ...props } />;
    }

    // Output other plugins printed before / after this row (develop's
    // wpuf_before|after_{post,registration}_form_settings_field hooks). It stays
    // when a dependency hides the row: develop hid only the row's input container.
    return (
        <>
            <LegacySlot id={ `setting-before-${ slotKey }` } html={ row.before } />
            { ! hideControl && <SettingsFieldControl { ...props } /> }
            <LegacySlot id={ `setting-after-${ slotKey }` } html={ row.after } />
        </>
    );
}

/**
 * The control for one settings row.
 */
function SettingsFieldControl( { field, name, value, onChange, settings } ) {
    // inline_fields is a special container type — Vue uses mt-6 flex wpuf-input-container
    if ( field.type === 'inline_fields' || ( ! field.type && field.fields ) ) {
        return (
            <div className="mt-6 flex wpuf-input-container">
                <InlineFieldsGroup
                    field={ field }
                    settings={ settings || {} }
                    onChange={ onChange }
                />
            </div>
        );
    }

    // submit-button-conditional-logics is a special Vue component — render React equivalent
    if ( field.type === 'submit-button-conditional-logics' ) {
        return (
            <div className="mt-6 wpuf-input-container">
                <SubmitConditionalLogic label={ field.label } />
            </div>
        );
    }

    // `note`: develop's yellow notice box (e.g. a newsletter module with no API key).
    if ( field.type === 'note' ) {
        return (
            <div className="my-4 wpuf-input-container">
                <RawHTML className="p-4 bg-yellow-50 text-sm text-yellow-800 border-l-4 border-yellow-400 w-full">
                    { field.note || '' }
                </RawHTML>
            </div>
        );
    }

    const FieldComponent = FIELD_MAP[ field.type ];

    if ( ! FieldComponent ) {
        return null;
    }

    // Vue wraps every field in <div class="mt-6 wpuf-input-container"> and
    // prints `long_help` under any field. `note` and `long_help` are filtered
    // with wp_kses_post before they leave PHP.
    return (
        <div className="mt-6 wpuf-input-container">
            <FieldComponent
                field={ field }
                name={ name }
                value={ value }
                onChange={ onChange }
            />
            { field.long_help && (
                <RawHTML className="text-sm mt-4 wpuf-long-help">{ field.long_help }</RawHTML>
            ) }
        </div>
    );
}
