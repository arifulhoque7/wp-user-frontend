import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store';
import { isFailedToValidate } from '../../utils/globalHelpers';
import { getFieldValidators } from '../../extensions/registry';

/**
 * Get the icon URL for a field template.
 */
function getIconUrl( template, fieldConfig, isProActive ) {
    if ( ! fieldConfig || ! fieldConfig.icon ) {
        return '';
    }

    const data = window.wpuf_form_builder || {};

    if ( isProActive && fieldConfig.pro_feature ) {
        return ( data.pro_asset_url || '' ) + '/images/' + fieldConfig.icon + '.svg';
    }

    return ( data.asset_url || '' ) + '/images/' + fieldConfig.icon + '.svg';
}

export default function FieldItem( { template, onAdd, onProAlert, onValidationAlert } ) {
    const { fieldConfig, isProActive } = useSelect( ( select ) => {
        const store = select( STORE_NAME );
        const settings = store.getFieldSettings();
        return {
            fieldConfig: settings[ template ] || {},
            isProActive: store.getIsProActive(),
        };
    }, [ template ] );

    const isProPreview = ! isProActive && fieldConfig.pro_feature;
    const failedValidation = isFailedToValidate( template, { [ template ]: fieldConfig }, getFieldValidators() );
    const iconUrl = getIconUrl( template, fieldConfig, isProActive );
    const title = fieldConfig.title || template;

    if ( isProPreview ) {
        return (
            <div
                data-form-field={ template }
                data-source="panel"
                onClick={ () => onProAlert( template ) }
                className="relative group/pro-field"
                role="button"
                tabIndex={ 0 }
                onKeyDown={ ( e ) => e.key === 'Enter' && onProAlert( template ) }
            >
                <div className="opacity-50 wpuf-field-button flex items-center rounded-lg border border-gray-200 bg-white shadow-xs p-4 hover:border-gray-300 hover:cursor-pointer">
                    { iconUrl && (
                        <div className="shrink-0 mr-2 text-gray-400">
                            <img src={ iconUrl } alt="" />
                        </div>
                    ) }
                    <div className="min-w-0 flex-1">
                        <p className="text-base font-normal text-gray-500 m-0">
                            { title }
                        </p>
                    </div>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover/pro-field:opacity-100 wpuf-transition-all">
                    <img src={ `${ ( window.wpuf_form_builder || {} ).asset_url || '' }/images/pro-badge.svg` } alt="" />
                </div>
            </div>
        );
    }

    if ( failedValidation ) {
        return (
            <div
                data-form-field={ template }
                data-source="panel"
                onClick={ () => onValidationAlert( template ) }
                className="relative flex items-center rounded-lg border border-gray-200 bg-white shadow-xs px-3 py-4 hover:border-gray-300 hover:cursor-pointer"
                role="button"
                tabIndex={ 0 }
                onKeyDown={ ( e ) => e.key === 'Enter' && onValidationAlert( template ) }
            >
                { iconUrl && (
                    <div className="shrink-0 mr-2">
                        <img src={ iconUrl } alt="" />
                    </div>
                ) }
                <div className="min-w-0 flex-1">
                    <p className="text-base font-normal text-gray-500 m-0">
                        { title }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            data-form-field={ template }
            data-source="panel"
            data-label={ title }
            draggable="true"
            onDragStart={ ( e ) => {
                e.dataTransfer.setData( 'wpuf/field-template', template );
                e.dataTransfer.effectAllowed = 'copy';
            } }
            onClick={ () => onAdd( template ) }
            className="wpuf-field-button relative flex items-center rounded-lg border border-gray-200 bg-white shadow-sm px-3 py-4 hover:cursor-pointer hover:border-primary"
            role="button"
            tabIndex={ 0 }
            onKeyDown={ ( e ) => e.key === 'Enter' && onAdd( template ) }
        >
            { iconUrl && (
                <div className="shrink-0 mr-2">
                    <img src={ iconUrl } alt="" />
                </div>
            ) }
            <div className="min-w-0 flex-1">
                <p className="text-base font-normal text-gray-500 m-0">
                    { title }
                </p>
            </div>
        </div>
    );
}
