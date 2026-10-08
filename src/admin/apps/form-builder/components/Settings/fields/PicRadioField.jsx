import { useCallback } from '@wordpress/element';

/**
 * Get the asset URL for images.
 *
 * @return {string}
 */
function getAssetUrl() {
    return ( window.wpuf_admin_script || window.wpuf_form_builder || {} ).asset_url || '';
}

/**
 * Picture radio field — matches wpuf_render_settings_field() for type="pic-radio".
 * Includes the green checkmark overlay on the selected option.
 */
export default function PicRadioField( { field, name, value, onChange } ) {
    const options = field.options || {};
    const checkedIcon = getAssetUrl() + '/images/checked-green.svg';

    const handleChange = useCallback( ( e ) => {
        onChange( name, e.target.value );
    }, [ name, onChange ] );

    return (
        <>
            { field.label && (
                <div className="flex items-center">
                    <label className="text-sm text-gray-700 my-1.5">
                        { field.label }
                    </label>
                </div>
            ) }
            <div className="grid grid-cols-4 wpuf-pic-radio" id={ name }>
                { Object.entries( options ).map( ( [ optKey, option ] ) => (
                    <div key={ optKey } className="relative text-center p-3 pl-0 pt-0">
                        <label>
                            <input
                                type="radio"
                                name={ `wpuf_settings[${ name }]` }
                                value={ optKey }
                                checked={ value === optKey }
                                onChange={ handleChange }
                                className="absolute opacity-0 peer"
                            />
                            <img
                                className="absolute opacity-0 peer-checked:opacity-100 top-[7%] right-[12%] wpuf-transition-all duration-200 ease-in-out"
                                src={ checkedIcon }
                                alt=""
                            />
                            { option.image && (
                                <img
                                    src={ option.image }
                                    alt={ optKey }
                                    className="hover:cursor-pointer border-transparent border-2 border-solid rounded-lg hover:border-primary peer-checked:border-primary wpuf-transition-all duration-200 ease-in-out mb-2 w-full"
                                />
                            ) }
                        </label>
                        <label className="mr-2 text-sm text-gray-700">
                            { option.label }
                        </label>
                    </div>
                ) ) }
            </div>
        </>
    );
}
