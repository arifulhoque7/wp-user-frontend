import { conditionInputType, conditionFieldType, getFieldOptions } from './conditionalUtils';

/**
 * Condition values a rule stores, matching the Vue builder (task 1.5, B11).
 */
describe( 'conditional logic shape', () => {
    test( 'input type comes from the field, else from the template', () => {
        expect( conditionInputType( { template: 'dropdown_field', input_type: 'select' } ) ).toBe( 'select' );
        expect( conditionInputType( { template: 'multiple_select', input_type: 'multiselect' } ) ).toBe( 'multiselect' );
        expect( conditionInputType( { template: 'radio_field' } ) ).toBe( 'radio' );
        expect( conditionInputType( undefined ) ).toBe( '' );
    } );

    test( 'field type: rich textarea, then field type, then input type', () => {
        expect( conditionFieldType( { template: 'textarea_field', input_type: 'textarea', rich: 'teeny' } ) ).toBe( 'teeny' );
        expect( conditionFieldType( { template: 'taxonomy', input_type: 'taxonomy', type: 'select' } ) ).toBe( 'select' );
        expect( conditionFieldType( { template: 'dropdown_field', input_type: 'select' } ) ).toBe( 'select' );
    } );

    test( 'options come from the field, or from the terms of a hierarchical taxonomy', () => {
        expect( getFieldOptions( { template: 'radio_field', options: { red: 'Red', blue: 'Blue' } } ) ).toEqual( [
            { value: 'red', label: 'Red' },
            { value: 'blue', label: 'Blue' },
        ] );

        const postTypes = { post: { category: { hierarchical: true, terms: [ { term_id: 3, name: 'News' } ] } } };
        expect( getFieldOptions( { template: 'taxonomy', name: 'category' }, postTypes ) ).toEqual( [ { value: '3', label: 'News' } ] );
        expect( getFieldOptions( { template: 'taxonomy', name: 'post_tag' }, postTypes ) ).toEqual( [] );
    } );
} );
