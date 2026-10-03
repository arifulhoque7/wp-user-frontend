/**
 * Date picker on `YYYY-MM-DD` strings, the same calendar day in every
 * browser and site timezone. Times are not edited here yet; a stored time
 * part is dropped only when the user picks a new date.
 *
 * Built from plugin-ui's Popover + Calendar instead of its DatePicker, whose
 * trigger formats in the site timezone (a stored date can show as the day
 * before) and wraps the trigger in an unstyled button (browser focus
 * outline, nested buttons).
 */
import { Calendar, Popover, PopoverContent, PopoverTrigger, cn } from '@wedevs/plugin-ui';
import { useState } from '@wordpress/element';
import { dateI18n, getSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';

import { dateToYmd, ymdToDate } from './values';

/**
 * @param {Object}   props
 * @param {string}   [props.value]         Stored date.
 * @param {Function} [props.onChange]      ( value: string ) => void
 * @param {string}   [props.placeholder]   Shown when empty.
 * @param {boolean}  [props.disabled]      Disabled.
 * @param {Object}   [props.calendarProps] Extra Calendar props.
 */
export default function DateTime( { value, onChange, placeholder, disabled, calendarProps, className, id } ) {
    const [ open, setOpen ] = useState( false );
    const date = ymdToDate( value );
    const ymd = dateToYmd( date );
    // The stored day formatted in UTC: no timezone can move it.
    const label = ymd ? dateI18n( getSettings().formats.date, ymd + 'T00:00:00Z', true ) : placeholder ?? __( 'Select a date', 'wp-user-frontend' );

    return (
        <Popover open={ open } onOpenChange={ setOpen }>
            <PopoverTrigger
                id={ id }
                disabled={ disabled }
                className={ cn( 'inline-flex w-full min-w-[200px] items-center justify-between h-[38px] px-3 text-sm bg-white border border-gray-300 rounded-md cursor-pointer outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60', ymd ? 'text-gray-900' : 'text-gray-400', className ) }
            >
                <span className="truncate">{ label }</span>
                <span aria-hidden="true" className="ms-2 text-gray-400">▾</span>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={ date }
                    defaultMonth={ date }
                    wpTimezone={ false }
                    onSelect={ ( picked ) => {
                        onChange?.( dateToYmd( picked ) );
                        setOpen( false );
                    } }
                    { ...calendarProps }
                />
            </PopoverContent>
        </Popover>
    );
}
