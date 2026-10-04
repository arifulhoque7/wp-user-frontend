/**
 * ActionMenu component — three-dot dropdown menu for per-row actions.
 *
 * @since WPUF_SINCE
 */
import { useState, useRef, useEffect } from '@wordpress/element';

const ActionMenu = ( { items, onAction } ) => {
    const [ isOpen, setIsOpen ] = useState( false );
    const menuRef = useRef( null );

    useEffect( () => {
        const handleClickOutside = ( event ) => {
            if ( menuRef.current && ! menuRef.current.contains( event.target ) ) {
                setIsOpen( false );
            }
        };

        if ( isOpen ) {
            document.addEventListener( 'mousedown', handleClickOutside );
        }

        return () => {
            document.removeEventListener( 'mousedown', handleClickOutside );
        };
    }, [ isOpen ] );

    return (
        <div ref={ menuRef } className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    onClick={ () => setIsOpen( ! isOpen ) }
                    className="inline-flex w-full justify-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/75"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600">
                        <path d="M5 12H5.01M12 12H12.01M19 12H19.01M6 12C6 12.5523 5.55228 13 5 13C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11C5.55228 11 6 11.4477 6 12ZM13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12ZM20 12C20 12.5523 19.5523 13 19 13C18.4477 13 18 12.5523 18 12C18 11.4477 18.4477 11 19 11C19.5523 11 20 11.4477 20 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            { isOpen && (
                <div className="absolute right-0 mt-2 w-40 origin-top-right [&>:not([hidden])~:not([hidden])]:border-t [&>:not([hidden])~:not([hidden])]:border-b-0 [&>:not([hidden])~:not([hidden])]:border-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-hidden z-10">
                    <div className="px-1 py-1">
                        { items.map( ( item ) => (
                            <button
                                key={ item.action }
                                onClick={ () => {
                                    onAction( item.action );
                                    setIsOpen( false );
                                } }
                                className={
                                    'group flex w-full items-center rounded-md px-2 py-2 text-sm bg-transparent border-0 cursor-pointer ' +
                                    ( item.className || 'text-gray-900!' ) + ' ' +
                                    ( item.hoverClassName || 'hover:bg-primary! hover:text-white!' )
                                }
                            >
                                { item.label }
                            </button>
                        ) ) }
                    </div>
                </div>
            ) }
        </div>
    );
};

export default ActionMenu;
