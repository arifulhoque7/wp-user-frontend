/**
 * The taxonomy field in its four looks (`type`: select, multiselect,
 * checkbox, text) plus the ajax select that loads child terms level by
 * level (`/forms/{id}/terms`). Terms come from the schema (`choices`,
 * the exclusions of the field applied server-side).
 *
 * @since WPUF_SINCE
 */
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Field from '../components/Field';
import { getTerms } from '../api';

const selected = ( value ) => ( Array.isArray( value ) ? value.map( String ) : ( value ? [ String( value ) ] : [] ) );

/** Nested options in display order with a depth for indentation. */
const tree = ( choices, parent = 0, depth = 0 ) => {
    const out = [];

    choices.filter( ( term ) => Number( term.parent || 0 ) === Number( parent ) ).forEach( ( term ) => {
        out.push( { ...term, depth } );
        out.push( ...tree( choices, term.id, depth + 1 ) );
    } );

    return out;
};

function AjaxSelect( { field, value, onChange, formId, id } ) {
    const chosen = selected( value );
    const [ levels, setLevels ] = useState( [ ( field.choices || [] ).filter( ( term ) => ! Number( term.parent || 0 ) ) ] );

    const pick = async ( level, termId ) => {
        const next = chosen.slice( 0, level );

        if ( termId ) {
            next.push( String( termId ) );
        }

        onChange( next );

        const kept = levels.slice( 0, level + 1 );

        if ( termId ) {
            try {
                const children = await getTerms( formId, field.name, termId );

                if ( children.length ) {
                    kept.push( children );
                }
            } catch ( e ) {
                // The chosen term stays; no deeper level.
            }
        }

        setLevels( kept );
    };

    useEffect( () => {
        // Edit mode: open the levels of the stored path.
        if ( chosen.length > 1 && 1 === levels.length ) {
            Promise.all( chosen.slice( 0, -1 ).map( ( termId ) => getTerms( formId, field.name, termId ) ) )
                .then( ( lists ) => setLevels( [ levels[ 0 ], ...lists.filter( ( list ) => list.length ) ] ) )
                .catch( () => undefined );
        }
    }, [] ); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="wpuf-category-ajax">
            { levels.map( ( terms, level ) => (
                <select key={ level } id={ 0 === level ? id : undefined } name={ field.name + '[]' } className="wpuf-cat-ajax" value={ chosen[ level ] || '' } onChange={ ( event ) => pick( level, event.target.value ) }>
                    <option value="">{ field.first || __( '- select -', 'wp-user-frontend' ) }</option>
                    { terms.map( ( term ) => (
                        <option key={ term.id } value={ term.id }>{ term.name }</option>
                    ) ) }
                </select>
            ) ) }
        </div>
    );
}

export default function TaxonomyField( { field, value, onChange, onBlur, formId, error } ) {
    const id = `${ field.name }_${ formId }`;
    const choices = tree( field.choices || [] );
    const chosen = selected( value );
    const type = field.type || 'select';
    const indent = ( term ) => '  '.repeat( term.depth ) + term.name;

    let control;

    if ( 'ajax' === type ) {
        control = <AjaxSelect field={ field } value={ value } onChange={ onChange } formId={ formId } id={ id } />;
    } else if ( 'multiselect' === type ) {
        control = (
            <select id={ id } name={ field.name + '[]' } multiple size={ Math.min( 8, Math.max( 3, choices.length ) ) } value={ chosen } onChange={ ( event ) => onChange( Array.from( event.target.selectedOptions ).map( ( option ) => option.value ) ) } onBlur={ onBlur }>
                { choices.map( ( term ) => (
                    <option key={ term.id } value={ term.id }>{ indent( term ) }</option>
                ) ) }
            </select>
        );
    } else if ( 'checkbox' === type ) {
        control = (
            <div className="wpuf-fields-choices wpuf-category-checklist" role="group">
                { choices.map( ( term ) => (
                    <label key={ term.id } className="wpuf-choice" style={ { paddingInlineStart: `${ term.depth * 16 }px` } }>
                        <input type="checkbox" name={ field.name + '[]' } value={ term.id } checked={ chosen.includes( String( term.id ) ) } onChange={ () => onChange( chosen.includes( String( term.id ) ) ? chosen.filter( ( item ) => item !== String( term.id ) ) : [ ...chosen, String( term.id ) ] ) } onBlur={ onBlur } />
                        <span>{ term.name }</span>
                    </label>
                ) ) }
            </div>
        );
    } else if ( 'text' === type ) {
        control = <input id={ id } type="text" name={ field.name } className="textfield" value={ chosen.join( ', ' ) } placeholder={ __( 'Comma separated', 'wp-user-frontend' ) } onChange={ ( event ) => onChange( event.target.value.split( ',' ).map( ( item ) => item.trim() ).filter( Boolean ) ) } onBlur={ onBlur } />;
    } else {
        control = (
            <select id={ id } name={ field.name } value={ chosen[ 0 ] || '' } onChange={ ( event ) => onChange( event.target.value ? [ event.target.value ] : [] ) } onBlur={ onBlur }>
                <option value="">{ field.first || __( '- select -', 'wp-user-frontend' ) }</option>
                { choices.map( ( term ) => (
                    <option key={ term.id } value={ term.id }>{ indent( term ) }</option>
                ) ) }
            </select>
        );
    }

    return (
        <Field field={ field } id={ id } error={ error }>
            { control }
        </Field>
    );
}
