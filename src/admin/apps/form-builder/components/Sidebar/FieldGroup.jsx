import { useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../../store';

export default function FieldGroup( { section, index, children } ) {
    const { togglePanelSection } = useDispatch( STORE_NAME );

    if ( ! section.fields || section.fields.length === 0 ) {
        return null;
    }

    return (
        <div className="panel-form-field-group mb-5">
            <h3
                className={ `flex items-center justify-between hover:cursor-pointer text-xs! uppercase tracking-wide m-0 font-semibold! ${ section.show ? 'text-gray-700' : 'text-gray-500' }` }
                onClick={ () => togglePanelSection( index ) }
                role="button"
                tabIndex={ 0 }
                onKeyDown={ ( e ) => e.key === 'Enter' && togglePanelSection( index ) }
            >
                { section.title }
                <i className={ `text-base leading-none ${ section.show ? 'fa fa-angle-down text-gray-500' : 'fa fa-angle-right text-gray-400' }` } />
            </h3>
            { section.show && (
                <div
                    id={ `panel-form-field-buttons-${ section.id }` }
                    className="panel-form-field-buttons grid grid-cols-2 gap-2 mt-2.5"
                >
                    { children }
                </div>
            ) }
        </div>
    );
}
