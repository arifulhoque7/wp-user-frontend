import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../../../../stores-react/settings/constants';
import SelectDropdown from './SelectDropdown';

/**
 * Tax settings — Base Country/State selector + the Tax Rates table. Replaces the
 * legacy jQuery callbacks (`wpuf_base_country_state`, `wpuf_tax_rates`) that
 * stored to their OWN options via a custom `init` POST handler the React REST
 * route never triggered.
 *
 * Countries, states, the base address and rate rows arrive in the `tax`
 * side-channel (`extra`); edits write back there and persist server-side via
 * `wpuf_settings_saved` (Pro Tax.php). One field renders the base selector, the
 * other the rate table — routed by field name.
 */
const KEY = 'tax';

function useTax() {
    const data = useSelect( ( select ) => select( STORE_NAME ).getExtraValue( KEY ) || {}, [] );
    const { setExtraValue } = useDispatch( STORE_NAME );
    const set = ( patch ) => setExtraValue( KEY, { ...data, ...patch } );
    return { data, set };
}

function BaseCountry() {
    const { data, set } = useTax();
    const countries = data.countries || {};
    const states = data.states || {};
    const base = data.base || {};

    const stateOptions = { '': __( '— Select —', 'wp-user-frontend' ), ...( states[ base.country ] || {} ) };

    return (
        <div className="mt-2 flex flex-wrap gap-4">
            <div className="min-w-0 flex-1">
                <SelectDropdown
                    field={ { label: __( 'Base Country', 'wp-user-frontend' ), options: { '': __( '— Select —', 'wp-user-frontend' ), ...countries } } }
                    name="tax_base_country"
                    value={ base.country || '' }
                    onChange={ ( n, val ) => set( { base: { country: val, state: '' } } ) }
                />
            </div>
            <div className="min-w-0 flex-1">
                <SelectDropdown
                    field={ { label: __( 'Base State', 'wp-user-frontend' ), options: stateOptions } }
                    name="tax_base_state"
                    value={ base.state || '' }
                    onChange={ ( n, val ) => set( { base: { ...base, state: val } } ) }
                />
            </div>
        </div>
    );
}

function Rates() {
    const { data, set } = useTax();
    const countries = data.countries || {};
    const states = data.states || {};
    const rates = Array.isArray( data.rates ) ? data.rates : [];

    const setRates = ( next ) => set( { rates: next } );
    const update = ( i, patch ) => setRates( rates.map( ( r, idx ) => ( idx === i ? { ...r, ...patch } : r ) ) );
    const add = () => setRates( [ ...rates, { country: '', state: '', rate: 0 } ] );
    const remove = ( i ) => setRates( rates.filter( ( _, idx ) => idx !== i ) );

    return (
        <div className="mt-2">
            { rates.map( ( row, i ) => {
                const stateOptions = { country_wide: __( 'Country Wide', 'wp-user-frontend' ), ...( states[ row.country ] || {} ) };
                return (
                    <div key={ i } className="mb-3 flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <SelectDropdown
                                field={ { options: { '': __( '— Country —', 'wp-user-frontend' ), ...countries } } }
                                name={ `tax_rate_country_${ i }` }
                                value={ row.country || '' }
                                onChange={ ( n, val ) => update( i, { country: val, state: '' } ) }
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <SelectDropdown
                                field={ { options: stateOptions } }
                                name={ `tax_rate_state_${ i }` }
                                value={ row.state || '' }
                                onChange={ ( n, val ) => update( i, { state: val } ) }
                            />
                        </div>
                        <div className="relative w-24 shrink-0">
                            <input
                                type="number"
                                step="0.0001"
                                min="0"
                                max="100"
                                value={ row.rate || 0 }
                                onChange={ ( e ) => update( i, { rate: e.target.value } ) }
                                className="wpuf-no-spinner w-full rounded-md border border-gray-300 py-2.5 pl-3 pr-7 text-gray-700 shadow-xs focus:border-gray-300"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">%</span>
                        </div>
                        <button
                            type="button"
                            onClick={ () => remove( i ) }
                            className="shrink-0 text-sm font-medium text-red-600 hover:text-red-700"
                        >
                            { __( 'Remove', 'wp-user-frontend' ) }
                        </button>
                    </div>
                );
            } ) }
            <button
                type="button"
                onClick={ add }
                className="rounded-md border border-gray-300! bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                + { __( 'Add Rate', 'wp-user-frontend' ) }
            </button>
        </div>
    );
}

export default function TaxSettings( { field } ) {
    return field.name === 'wpuf_tax_rates' ? <Rates /> : <BaseCountry />;
}
