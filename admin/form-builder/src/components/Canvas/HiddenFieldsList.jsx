import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../store';
import FieldActions from './FieldActions';

/**
 * Hidden fields are hidden on the stage, so they are listed under it with their
 * key and value and the field actions, as develop's builder stage did.
 */
export default function HiddenFieldsList() {
    const { formFields, editingFieldId } = useSelect( ( select ) => ( {
        formFields: select( STORE_NAME ).getFormFields(),
        editingFieldId: select( STORE_NAME ).getEditingFieldId(),
    } ), [] );

    const hidden = formFields
        .map( ( field, index ) => ( { field, index } ) )
        .filter( ( { field } ) => 'custom_hidden_field' === field.template );

    if ( ! hidden.length ) {
        return null;
    }

    return (
        <div className="wpuf-border-t wpuf-border-dashed wpuf-border-gray-300 wpuf-mt-2">
            <h4>{ __( 'Hidden Fields', 'wp-user-frontend' ) }</h4>
            <ul className="wpuf-form">
                { hidden.map( ( { field, index } ) => {
                    const isEditing = parseInt( editingFieldId ) === parseInt( field.id );

                    return (
                        <li key={ field.id } className="field-items wpuf-group wpuf-group/hidden-fields !wpuf-m-0 !wpuf-p-0 hover:wpuf-cursor-pointer">
                            <div className={ `wpuf-flex wpuf-rounded-t-lg wpuf-border-t wpuf-border-r wpuf-border-l wpuf-border-dashed group-hover/hidden-fields:wpuf-border-primaryHover group-hover/hidden-fields:wpuf-bg-green-50 ${ isEditing ? 'wpuf-bg-green-50 wpuf-border-primaryHover' : 'wpuf-border-transparent' }` }>
                                <div className="wpuf-bg-primary wpuf-m-4 wpuf-py-2 wpuf-px-4 wpuf-w-full wpuf-rounded-lg">
                                    <strong>{ __( 'key', 'wp-user-frontend' ) }</strong>: { field.name } |{ ' ' }
                                    <strong>{ __( 'value', 'wp-user-frontend' ) }</strong>: { field.meta_value }
                                </div>
                            </div>
                            <FieldActions field={ field } index={ index } showMove={ false } />
                        </li>
                    );
                } ) }
            </ul>
        </div>
    );
}
