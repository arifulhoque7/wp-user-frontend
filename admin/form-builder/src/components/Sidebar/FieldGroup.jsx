import { useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../store';

export default function FieldGroup( { section, index, children } ) {
    const { togglePanelSection } = useDispatch( STORE_NAME );

    if ( ! section.fields || section.fields.length === 0 ) {
        return null;
    }

    return (
        <div className="panel-form-field-group mb-8">
            <h3
                className={ `flex justify-between hover:cursor-pointer text-base m-0 font-medium! ${ section.show ? 'text-primary' : 'text-gray-500' }` }
                onClick={ () => togglePanelSection( index ) }
                role="button"
                tabIndex={ 0 }
                onKeyDown={ ( e ) => e.key === 'Enter' && togglePanelSection( index ) }
            >
                { section.title }
                <i className={ `text-2xl ${ section.show ? 'fa fa-angle-down text-primary' : 'fa fa-angle-right text-gray-500' }` } />
            </h3>
            { section.show && (
                <div
                    id={ `panel-form-field-buttons-${ section.id }` }
                    className="panel-form-field-buttons grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3"
                >
                    { children }
                </div>
            ) }
        </div>
    );
}
