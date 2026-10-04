import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store';
import { filterCanvasRender } from '../../extensions/hooks';
import { TOP } from '../../utils/dndTree';
import { usePlaceholder } from '../Dnd/dropTarget';
import { Indicator, dropListProps, indicatorFor } from '../Dnd/DropList';
import SortableField from './SortableField';
import EmptyState from './EmptyState';
import HiddenFieldsList from './HiddenFieldsList';

/**
 * The stage: the form's top level fields as one drop list of the builder's
 * DndContext (components/Dnd, design.md D16). Palette fields and canvas fields
 * dropped here go to the indicator's position, as develop's sortable stage
 * (the whole stage area takes drops; below the rows means the end).
 */
export default function BuilderCanvas() {
    const { formFields, settings } = useSelect( ( select ) => {
        const store = select( STORE_NAME );
        return {
            formFields: store.getFormFields(),
            settings: store.getSettings(),
        };
    }, [] );

    const placeholder = usePlaceholder( TOP );
    const labelType = settings.label_position || 'above';

    // Apply Pro canvas render filter
    const canvasClass = filterCanvasRender( '' );

    if ( ! formFields.length ) {
        return (
            <div id="form-preview-stage" className={ `relative rounded-lg transition-colors ${ placeholder ? 'bg-green-50' : '' }` } { ...dropListProps( TOP, 0 ) }>
                { placeholder && <Indicator blocked={ placeholder.blocked } /> }
                <EmptyState />
            </div>
        );
    }

    return (
        <div id="form-preview-stage" className="h-[70vh]" { ...dropListProps( TOP, formFields.length ) }>
            <ul data-dnd-rows="" className={ `wpuf-form sortable-list py-8 form-label-${ labelType } ${ canvasClass }` }>
                { formFields.map( ( field, index ) => (
                    <SortableField
                        key={ field.id }
                        field={ field }
                        index={ index }
                        indicator={ indicatorFor( placeholder, index, formFields.length ) }
                    />
                ) ) }
            </ul>
            <HiddenFieldsList />
        </div>
    );
}
