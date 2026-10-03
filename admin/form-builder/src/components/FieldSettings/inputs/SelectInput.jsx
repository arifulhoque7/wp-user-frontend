import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import SettingHelpText from './SettingHelpText';

/**
 * Custom dropdown select for field settings.
 * Replaces Vue field-select component with the custom dropdown UI.
 */
export default function SelectInput( { optionField, value, onChange } ) {
    const [ showOptions, setShowOptions ] = useState( false );
    const wrapperRef = useRef( null );
    const options = optionField.options || {};

    // An empty value shows the option's default, else develop's placeholder. The
    // default is only shown, not stored: opening the panel writes nothing (Q6).
    let selectedLabel = __( 'Select an option', 'wp-user-frontend' );
    if ( value && options[ value ] ) {
        selectedLabel = options[ value ];
    } else if ( ! value && optionField.default && options[ optionField.default ] ) {
        selectedLabel = options[ optionField.default ];
    }

    // Close dropdown on outside click
    useEffect( () => {
        if ( ! showOptions ) {
            return;
        }

        function handleClickOutside( e ) {
            if ( wrapperRef.current && ! wrapperRef.current.contains( e.target ) ) {
                setShowOptions( false );
            }
        }

        document.addEventListener( 'mousedown', handleClickOutside );

        return () => document.removeEventListener( 'mousedown', handleClickOutside );
    }, [ showOptions ] );

    return (
        <div className="panel-field-opt panel-field-opt-select">
            <div className="flex">
                { optionField.title && (
                    <label className="mb-0!">
                        { optionField.title }
                        <SettingHelpText text={ optionField.help_text } />
                    </label>
                ) }
            </div>

            <div className="option-fields-section relative" ref={ wrapperRef }>
                <div
                    className="my-4 w-full min-w-full py-2.5! px-3.5! text-gray-700 font-medium shadow-xs! border border-gray-300! rounded-md! focus:ring-transparent! hover:text-gray-700! flex justify-between items-center text-base!"
                    onClick={ () => setShowOptions( ! showOptions ) }
                    role="button"
                    tabIndex={ 0 }
                    onKeyDown={ ( e ) => e.key === 'Enter' && setShowOptions( ! showOptions ) }
                >
                    { selectedLabel }
                    <i className={ `fa ${ showOptions ? 'fa-angle-up' : 'fa-angle-down' } text-base` } />
                </div>

                { showOptions && (
                    <div className="absolute bg-white border border-gray-300 rounded-lg w-full z-40 -mt-4">
                        <ul>
                            { Object.entries( options ).map( ( [ key, label ] ) => (
                                <li
                                    key={ key }
                                    className="text-sm wpuf-color-gray-900 py-2 px-4 hover:cursor-pointer hover:bg-gray-100"
                                    onClick={ () => {
                                        onChange( key );
                                        setShowOptions( false );
                                    } }
                                    role="option"
                                    aria-selected={ value === key }
                                >
                                    { label }
                                </li>
                            ) ) }
                        </ul>
                    </div>
                ) }
            </div>
        </div>
    );
}
