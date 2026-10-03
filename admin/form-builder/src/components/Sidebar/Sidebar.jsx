import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../store';
import FieldPanel from './FieldPanel';
import FieldOptionsPanel from '../FieldSettings/FieldOptionsPanel';

export default function Sidebar() {
    const currentPanel = useSelect( ( select ) => {
        return select( STORE_NAME ).getCurrentPanel();
    }, [] );

    const { setCurrentPanel } = useDispatch( STORE_NAME );

    const isAddFields = currentPanel === 'form-fields-v4-1';
    const isFieldOptions = currentPanel === 'field-options';

    return (
        <div className="p-6 pb-0 mb-8">
            <div
                role="tablist"
                className="wpuf-tabs wpuf-tabs-boxed text-gray-500 rounded-xl px-3 py-2 text-base font-medium bg-gray-100"
            >
                <a
                    role="tab"
                    className={ `wpuf-tab h-10 hover:bg-white hover:text-gray-800 hover:shadow-xs focus:shadow-none wpuf-transition-all ${ isAddFields ? 'bg-white text-gray-800 shadow-xs' : '' }` }
                    href="#add-fields"
                    onClick={ ( e ) => {
                        e.preventDefault();
                        setCurrentPanel( 'form-fields-v4-1' );
                    } }
                >
                    { __( 'Add Fields', 'wp-user-frontend' ) }
                </a>
                <a
                    role="tab"
                    className={ `wpuf-tab h-10 hover:bg-white hover:text-gray-800 hover:shadow-xs focus:shadow-none ml-1 wpuf-transition-all ${ isFieldOptions ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500' }` }
                    href="#field-options"
                    onClick={ ( e ) => {
                        e.preventDefault();
                        setCurrentPanel( 'field-options' );
                    } }
                >
                    { __( 'Field Options', 'wp-user-frontend' ) }
                </a>
            </div>
            <section>
                <div className="wpuf-form-builder-panel mt-6 mb-32">
                    { isAddFields && <FieldPanel /> }
                    { isFieldOptions && <FieldOptionsPanel /> }
                </div>
            </section>
        </div>
    );
}
