/**
 * FormsTable component — renders the forms data table with columns and rows.
 *
 * @since WPUF_SINCE
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

import { CHECKBOX_CLASSES, STATUS_BADGE_CLASSES } from '../utils/constants';
import ShortcodeCopy from './ShortcodeCopy';
import ActionMenu from './ActionMenu';

const STATUS_LABELS = {
    publish: 'Published',
    pending: 'Pending Review',
    private: 'Private',
    draft: 'Draft',
};

const FormsTable = ( {
    forms,
    currentTab,
    selectedForms,
    selectAllChecked,
    onSelectAll,
    onSelectForm,
    onAction,
    postType,
    formType,
    getShortcode,
    copiedKey,
    onCopyShortcode,
    menuItems,
} ) => {
    const indeterminate = selectedForms.length > 0 && selectedForms.length < forms.length;

    const defaultColumns = useMemo( () => [
        {
            key: 'form_name',
            label: __( 'Form Name', 'wp-user-frontend' ),
            thClassName: 'py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6',
            render: ( form ) => (
                <td key="form_name" className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    <input
                        type="checkbox"
                        value={ form.ID }
                        checked={ selectedForms.includes( form.ID ) }
                        onChange={ () => onSelectForm( form.ID ) }
                        className={ CHECKBOX_CLASSES }
                    />
                    <span
                        onClick={ () => onAction( 'edit', form.ID ) }
                        className="hover:cursor-pointer"
                    >
                        { form.post_title }
                    </span>
                    { form.form_status === 'draft' && (
                        <span className="text-gray-400">
                            { ' ' }&mdash; { __( 'Draft', 'wp-user-frontend' ) }
                        </span>
                    ) }
                </td>
            ),
            renderHeader: () => (
                <th key="form_name" scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    <input
                        type="checkbox"
                        checked={ selectAllChecked }
                        onChange={ onSelectAll }
                        ref={ ( el ) => {
                            if ( el ) {
                                el.indeterminate = indeterminate;
                            }
                        } }
                        className={ CHECKBOX_CLASSES }
                    />
                    { __( 'Form Name', 'wp-user-frontend' ) }
                </th>
            ),
        },
        {
            key: 'post_type',
            label: __( 'Post Type', 'wp-user-frontend' ),
            thClassName: 'px-3 py-3.5 text-left text-sm font-semibold text-gray-900',
            render: ( form ) => (
                <td key="post_type" className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    { form.settings_post_type }
                </td>
            ),
        },
        {
            key: 'post_status',
            label: __( 'Post Status', 'wp-user-frontend' ),
            thClassName: 'px-3 py-3.5 text-left text-sm font-semibold text-gray-900',
            render: ( form ) => (
                <td key="post_status" className="whitespace-nowrap px-3 py-4 text-sm">
                    <span
                        className={
                            'inline-flex items-center py-[2px] px-[12px] rounded-[5px] text-xs font-medium border ' +
                            ( STATUS_BADGE_CLASSES[ form.post_status ] || STATUS_BADGE_CLASSES.draft )
                        }
                    >
                        { STATUS_LABELS[ form.post_status ] || form.post_status }
                    </span>
                </td>
            ),
        },
        {
            key: 'shortcode',
            label: __( 'Shortcode', 'wp-user-frontend' ),
            thClassName: 'px-3 py-3.5 text-left text-sm font-semibold text-gray-900',
            render: ( form ) => (
                <td key="shortcode" className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-500">
                    { /* Pro swaps in the registration + edit profile pair on profile forms. */ }
                    { applyFilters(
                        'wpuf.formsList.shortcodeRender',
                        <ShortcodeCopy
                            shortcode={ getShortcode( form.ID ) }
                            copiedKey={ `shortcode-${ form.ID }` }
                            currentCopiedKey={ copiedKey }
                            onCopy={ onCopyShortcode }
                        />,
                        form,
                        formType,
                        ShortcodeCopy,
                        copiedKey,
                        onCopyShortcode
                    ) }
                </td>
            ),
        },
        {
            key: 'guest_post',
            label: __( 'Guest Post', 'wp-user-frontend' ),
            thClassName: 'px-3 py-3.5 text-left text-sm font-semibold text-gray-900',
            render: ( form ) => (
                <td key="guest_post" className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-500">
                    { form.settings_guest_post ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="size-4 w-6">
                            <path fill="#059669" fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="size-4 w-6">
                            <path fill="#ef4444" d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                        </svg>
                    ) }
                </td>
            ),
        },
        {
            key: 'menu',
            label: '',
            thClassName: 'px-3 py-3.5 text-left text-sm font-semibold text-gray-900',
            renderHeader: () => (
                <th key="menu" scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <span className="sr-only">Menu</span>
                </th>
            ),
            render: ( form ) => (
                <td key="menu" className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-500 text-right">
                    <ActionMenu
                        items={ menuItems }
                        onAction={ ( action ) => onAction( action, form.ID ) }
                    />
                </td>
            ),
        },
    ], [ selectAllChecked, indeterminate, selectedForms, onSelectAll, onSelectForm, onAction, formType, getShortcode, copiedKey, onCopyShortcode, menuItems ] );

    const columns = applyFilters( 'wpuf.formsList.tableColumns', defaultColumns, postType );

    return (
        <div className="flow-root">
            <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="shadow-sm border border-gray-200 sm:rounded-lg">
                        <table className="min-w-full [&>:not([hidden])~:not([hidden])]:border-t [&>:not([hidden])~:not([hidden])]:border-b-0 [&>:not([hidden])~:not([hidden])]:border-gray-200">
                            <thead>
                                <tr>
                                    { columns.map( ( col ) =>
                                        col.renderHeader
                                            ? col.renderHeader()
                                            : (
                                                <th
                                                    key={ col.key }
                                                    scope="col"
                                                    className={ col.thClassName || 'px-3 py-3.5 text-left text-sm font-semibold text-gray-900' }
                                                >
                                                    { col.label }
                                                </th>
                                            )
                                    ) }
                                </tr>
                            </thead>
                            <tbody className="[&>:not([hidden])~:not([hidden])]:border-t [&>:not([hidden])~:not([hidden])]:border-b-0 [&>:not([hidden])~:not([hidden])]:border-gray-200">
                                { forms.map( ( form ) => (
                                    <tr key={ form.ID } className="relative group">
                                        { columns.map( ( col ) => col.render( form ) ) }
                                    </tr>
                                ) ) }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormsTable;
