/**
 * Shared Tailwind class names for settings field controls.
 *
 * Ported verbatim from the Form Builder React Settings kit
 * (admin/form-builder/src/components/Settings/SettingsField.jsx) so the
 * settings screen renders identically to the rest of the React admin.
 * The field components in ./fields import SETTING_CLASS_NAMES from here.
 */
export const SETTING_CLASS_NAMES = {
    text: 'block min-w-full my-0 mb-0 leading-none! py-2.5! px-3.5! text-gray-700 shadow-xs! placeholder:text-gray-400 border border-gray-300! rounded-md! max-w-full focus:ring-transparent!',
    number: 'block min-w-full my-0 mb-0 leading-none! py-2.5! px-3.5! text-gray-700 shadow-xs! placeholder:text-gray-400 border border-gray-300! rounded-md! max-w-full focus:ring-transparent!',
    textarea: 'block min-w-full my-0 mb-0 leading-none! py-2.5! px-3.5! text-gray-700 shadow-xs! placeholder:text-gray-400 border border-gray-300! rounded-md! max-w-full focus:ring-transparent!',
    dropdown: 'block w-full min-w-full text-gray-700 font-normal shadow-xs! border border-gray-300! rounded-md! focus:ring-transparent! focus:checked:ring-transparent! hover:checked:ring-transparent! hover:text-gray-700! text-base! !leading-6',
    checkbox: 'mt-0! mr-2! h-4 w-4 shadow-none! checked:shadow-none! focus:checked:shadow-primary! focus:checked:shadow-none! border-gray-300! checked:border-primary! checked:bg-primary! before:checked:bg-white! hover:checked:bg-primary! focus:ring-transparent! focus:checked:ring-transparent! hover:checked:ring-transparent! focus:checked:bg-primary! focus:shadow-primary checked:focus:bg-primary! checked:hover:bg-primary checked:bg-primary! before:content-none! rounded-sm',
};
