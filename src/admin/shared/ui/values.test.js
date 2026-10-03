import { normalizeOptions, numberKeyAllowed, selectShownValue } from './values';

test( 'number inputs block "-" unless negatives are allowed', () => {
    expect( numberKeyAllowed( '-', false ) ).toBe( false );
    expect( numberKeyAllowed( '-', true ) ).toBe( true );
    expect( numberKeyAllowed( '5', false ) ).toBe( true );
} );

test( 'select shows a stored value only when it is an option', () => {
    const options = normalizeOptions( { day: 'Day', month: 'Month', 0: 'Zero' } );
    expect( selectShownValue( 'month', options ) ).toBe( 'month' );
    expect( selectShownValue( 0, options ) ).toBe( '0' );
    expect( selectShownValue( 'year', options ) ).toBeNull();
    expect( selectShownValue( '', options ) ).toBeNull();
    expect( selectShownValue( undefined, options ) ).toBeNull();
} );

test( 'options normalize from lists and maps', () => {
    expect( normalizeOptions( [ 'a', { value: 2, label: 'Two' } ] ) ).toEqual( [ { value: 'a', label: 'a' }, { value: '2', label: 'Two' } ] );
    expect( normalizeOptions( { x: 'X' } ) ).toEqual( [ { value: 'x', label: 'X' } ] );
    expect( normalizeOptions( null ) ).toEqual( [] );
} );
