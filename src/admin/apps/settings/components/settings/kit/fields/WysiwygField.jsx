import { WpEditor } from '@wpuf/components';
import SettingLabel from './SettingLabel';
import HelpTextIcon from './HelpTextIcon';

/**
 * Rich text (wysiwyg) setting on the shared WpEditor (4.6a): the WordPress
 * TinyMCE editor as on the legacy screen (guest mail body, gateway
 * instructions). Stores the editor HTML.
 *
 * Email body fields carry their merge tags in `desc` as HTML (`You may use:
 * <code>{username}</code>`); the legacy screen showed that below the editor,
 * so it prints there instead of a stripped tooltip.
 */
export default function WysiwygField( { field, name, value, onChange } ) {
    return (
        <>
            <SettingLabel field={ { label: field.label } }>
                { ! field.desc && field.help_text && <HelpTextIcon text={ field.help_text } /> }
            </SettingLabel>
            <div className="mt-1 wpuf-wysiwyg-wrap">
                <WpEditor
                    id={ name }
                    value={ value || field.default || '' }
                    onChange={ ( content ) => onChange( name, content ) }
                />
            </div>
            { field.desc && (
                <div
                    className="mt-2 text-sm text-gray-500 wpuf-long-help"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={ { __html: field.desc } }
                />
            ) }
        </>
    );
}
