/**
 * Date picker on `YYYY-MM-DD` strings, the same calendar day in every
 * browser and site timezone. With `withTime` it edits `YYYY-MM-DD HH:mm:ss`
 * (the MySQL post date shape): a time field under the calendar, the stored
 * time kept when only the day changes. Without it, a stored time part is
 * dropped only when the user picks a new date.
 *
 * Built from plugin-ui's Popover + Calendar instead of its DatePicker, whose
 * trigger formats in the site timezone (a stored date can show as the day
 * before) and wraps the trigger in an unstyled button (browser focus
 * outline, nested buttons).
 */
import { Calendar, Input, Popover, PopoverContent, PopoverTrigger, cn } from '@wedevs/plugin-ui';
import { useState } from '@wordpress/element';
import { dateI18n, getSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { ChevronDown } from 'lucide-react';

import { dateToYmd, ymdToDate } from './values';

/**
 * @param {Object}   props
 * @param {string}   [props.value]         Stored date.
 * @param {Function} [props.onChange]      ( value: string ) => void
 * @param {string}   [props.placeholder]   Shown when empty.
 * @param {boolean}  [props.disabled]      Disabled.
 * @param {Object}   [props.calendarProps] Extra Calendar props.
 * @param {boolean}  [props.withTime]      Edit `YYYY-MM-DD HH:mm:ss` (time with seconds).
 */
export default function DateTime( { value, onChange, placeholder, disabled, calendarProps, className, id, withTime = false } ) {
    const [ open, setOpen ] = useState( false );
    const date = ymdToDate( value );
    const ymd = dateToYmd( date );
    const time = withTime ? timePart( value ) : '';
    // The stored day formatted in UTC: no timezone can move it.
    const settings = getSettings().formats;
    const label = ymd
        ? dateI18n( withTime ? settings.datetime : settings.date, ymd + 'T' + ( time || '00:00:00' ) + 'Z', true )
        : placeholder ?? __( 'Select a date', 'wp-user-frontend' );
    const emit = ( day, clock ) => onChange?.( withTime ? `${ day } ${ clock || '00:00:00' }` : day );

    return (
        <Popover open={ open } onOpenChange={ setOpen }>
            <PopoverTrigger
                id={ id }
                disabled={ disabled }
                className={ cn( 'inline-flex w-full min-w-[200px] items-center justify-between h-[38px] px-3 text-sm bg-white border border-gray-300 rounded-md cursor-pointer outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60', ymd ? 'text-gray-900' : 'text-gray-400', className ) }
            >
                <span className="truncate">{ label }</span>
                { /* Same chevron as the Select trigger (plugin-ui: lucide, 16px, gray-500). */ }
                <ChevronDown aria-hidden="true" className="ms-2 size-4 shrink-0 text-gray-500 pointer-events-none" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={ date }
                    defaultMonth={ date }
                    wpTimezone={ false }
                    onSelect={ ( picked ) => {
                        emit( dateToYmd( picked ), time );
                        if ( ! withTime ) {
                            setOpen( false );
                        }
                    } }
                    { ...calendarProps }
                />
                { withTime && (
                    <div data-wpuf-ui="" className="flex items-center gap-2 border-t border-gray-200 p-3">
                        <label htmlFor={ ( id || 'wpuf-date' ) + '-time' } className="text-sm text-gray-600">{ __( 'Time', 'wp-user-frontend' ) }</label>
                        <Input
                            id={ ( id || 'wpuf-date' ) + '-time' }
                            type="time"
                            step="1"
                            value={ time }
                            disabled={ disabled || ! ymd }
                            onChange={ ( event ) => emit( ymd, normalizeTime( event.target.value ) ) }
                            className="h-[34px] w-auto px-2 text-sm bg-white border border-gray-300 rounded-md shadow-none"
                        />
                    </div>
                ) }
            </PopoverContent>
        </Popover>
    );
}

/**
 * `HH:mm:ss` of a `YYYY-MM-DD HH:mm:ss` (or ISO) value, '' when there is none.
 *
 * @param {string} value Stored value.
 *
 * @return {string} Time.
 */
export function timePart( value ) {
    const match = /[ T](\d{2}:\d{2}(?::\d{2})?)/.exec( String( value || '' ) );

    return match ? normalizeTime( match[ 1 ] ) : '';
}

/**
 * `HH:mm` -> `HH:mm:ss`.
 *
 * @param {string} value Time.
 *
 * @return {string} Time with seconds.
 */
function normalizeTime( value ) {
    return /^\d{2}:\d{2}$/.test( value ) ? value + ':00' : value;
}
