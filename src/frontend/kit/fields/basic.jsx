/**
 * The free text, choice and static fields of a post form. Each component
 * gets the field settings as stored by the builder, the current value,
 * `onChange( value )`, `onBlur()`, the form id and the error, and renders
 * inside the classic `li.wpuf-el` row (Field).
 *
 * @since WPUF_SINCE
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Field from '../components/Field';

const controlId = ( field, formId ) => `${ field.name }_${ formId }`;

/** Options stored as { value: label } or as a list of { value, label }. */
export const optionsOf = ( field ) => {
    const options = field.options || {};

    if ( Array.isArray( options ) ) {
        return options.map( ( option ) => ( 'object' === typeof option ? { value: String( option.value ), label: option.label } : { value: String( option ), label: String( option ) } ) );
    }

    return Object.entries( options ).map( ( [ value, label ] ) => ( { value: String( value ), label: String( label ) } ) );
};

/** Live counter for a content restriction. */
function Counter( { field, value } ) {
    const limit = Number( field.content_restriction );

    if ( ! ( limit > 0 ) ) {
        return null;
    }

    const text = String( value || '' );
    const count = 'word' === field.restriction_type ? text.trim().split( /\s+/ ).filter( Boolean ).length : text.length;
    const unit = 'word' === field.restriction_type ? __( 'words', 'wp-user-frontend' ) : __( 'characters', 'wp-user-frontend' );
    const over = ( 'min' === field.restriction_to ? count < limit : count > limit ) && count > 0;

    return (
        <span className={ 'wpuf-wordlimit-message wpuf-help' + ( over ? ' is-over' : '' ) }>
            { count } / { limit } { unit }
        </span>
    );
}

export function TextField( { field, value, onChange, onBlur, formId, error, type = 'text' } ) {
    const id = controlId( field, formId );
    const inputType = 'email_address' === field.template ? 'email' : ( 'website_url' === field.template ? 'url' : ( 'numeric_text_field' === field.template ? 'number' : type ) );

    return (
        <Field field={ field } id={ id } error={ error }>
            <input
                id={ id }
                className={ `textfield wpuf_${ field.name }_${ formId }` }
                type={ inputType }
                name={ field.name }
                value={ value ?? '' }
                placeholder={ field.placeholder || '' }
                size={ field.size || 40 }
                min={ 'number' === inputType && '' !== field.min_value_field ? field.min_value_field : undefined }
                max={ 'number' === inputType && '' !== field.max_value_field ? field.max_value_field : undefined }
                step={ 'number' === inputType ? field.step_text_field || 'any' : undefined }
                required={ 'yes' === field.required }
                aria-invalid={ error ? 'true' : undefined }
                onChange={ ( event ) => onChange( event.target.value ) }
                onBlur={ onBlur }
            />
            <Counter field={ field } value={ value } />
        </Field>
    );
}

export function HiddenField( { field, value } ) {
    return <input type="hidden" name={ field.name } value={ value ?? field.meta_value ?? '' } />;
}

export function TextareaField( { field, value, onChange, onBlur, formId, error } ) {
    const id = controlId( field, formId );

    return (
        <Field field={ field } id={ id } error={ error }>
            <textarea
                id={ id }
                className={ `textareafield wpuf_${ field.name }_${ formId }` }
                name={ field.name }
                value={ value ?? '' }
                placeholder={ field.placeholder || '' }
                rows={ field.rows || 5 }
                cols={ field.cols || 25 }
                required={ 'yes' === field.required }
                aria-invalid={ error ? 'true' : undefined }
                onChange={ ( event ) => onChange( event.target.value ) }
                onBlur={ onBlur }
            />
            <Counter field={ field } value={ value } />
        </Field>
    );
}

export function SelectField( { field, value, onChange, onBlur, formId, error } ) {
    const id = controlId( field, formId );
    const options = optionsOf( field );

    return (
        <Field field={ field } id={ id } error={ error }>
            <select id={ id } className={ `wpuf_${ field.name }_${ formId }` } name={ field.name } value={ value ?? '' } required={ 'yes' === field.required } aria-invalid={ error ? 'true' : undefined } onChange={ ( event ) => onChange( event.target.value ) } onBlur={ onBlur }>
                { field.first && <option value="">{ field.first }</option> }
                { options.map( ( option ) => (
                    <option key={ option.value } value={ option.value }>{ option.label }</option>
                ) ) }
            </select>
        </Field>
    );
}

export function MultiSelectField( { field, value, onChange, onBlur, formId, error } ) {
    const id = controlId( field, formId );
    const options = optionsOf( field );
    const selected = Array.isArray( value ) ? value : [];

    return (
        <Field field={ field } id={ id } error={ error }>
            <select
                id={ id }
                className={ `wpuf_${ field.name }_${ formId }` }
                name={ field.name + '[]' }
                multiple
                value={ selected }
                size={ Math.min( 8, Math.max( 3, options.length ) ) }
                required={ 'yes' === field.required }
                aria-invalid={ error ? 'true' : undefined }
                onChange={ ( event ) => onChange( Array.from( event.target.selectedOptions ).map( ( option ) => option.value ) ) }
                onBlur={ onBlur }
            >
                { field.first && <option value="">{ field.first }</option> }
                { options.map( ( option ) => (
                    <option key={ option.value } value={ option.value }>{ option.label }</option>
                ) ) }
            </select>
        </Field>
    );
}

export function RadioField( { field, value, onChange, onBlur, formId, error } ) {
    const id = controlId( field, formId );
    const inline = 'yes' === field.inline;

    return (
        <Field field={ field } error={ error }>
            <div className={ 'wpuf-fields-choices' + ( inline ? ' wpuf-fields-choices--inline' : '' ) } role="radiogroup" aria-labelledby={ id + '_label' }>
                { optionsOf( field ).map( ( option, index ) => (
                    <label key={ option.value } className="wpuf-choice">
                        <input type="radio" name={ field.name } value={ option.value } checked={ String( value ?? '' ) === option.value } id={ `${ id }_${ index }` } onChange={ () => onChange( option.value ) } onBlur={ onBlur } />
                        <span>{ option.label }</span>
                    </label>
                ) ) }
            </div>
        </Field>
    );
}

export function CheckboxField( { field, value, onChange, onBlur, formId, error } ) {
    const id = controlId( field, formId );
    const inline = 'yes' === field.inline;
    const selected = Array.isArray( value ) ? value : [];

    const toggle = ( option ) => {
        onChange( selected.includes( option ) ? selected.filter( ( item ) => item !== option ) : [ ...selected, option ] );
    };

    return (
        <Field field={ field } error={ error }>
            <div className={ 'wpuf-fields-choices' + ( inline ? ' wpuf-fields-choices--inline' : '' ) } role="group">
                { optionsOf( field ).map( ( option, index ) => (
                    <label key={ option.value } className="wpuf-choice">
                        <input type="checkbox" name={ field.name + '[]' } value={ option.value } checked={ selected.includes( option.value ) } id={ `${ id }_${ index }` } onChange={ () => toggle( option.value ) } onBlur={ onBlur } />
                        <span>{ option.label }</span>
                    </label>
                ) ) }
            </div>
        </Field>
    );
}

/** The HTML field: the builder's own markup (admin-authored), as the classic form prints it. */
export function HtmlField( { field } ) {
    const ref = useRef( null );

    useEffect( () => {
        if ( ref.current ) {
            ref.current.innerHTML = field.html || ''; // eslint-disable-line no-unsanitized/property -- admin-authored field markup, printed as is by the classic form.
        }
    }, [ field.html ] );

    return (
        <li className={ `wpuf-el ${ field.name } ${ field.css || '' }` } data-label={ field.label }>
            { field.label && (
                <div className="wpuf-label"><label>{ field.label }</label></div>
            ) }
            <div className="wpuf-fields wpuf-html-field" ref={ ref } />
        </li>
    );
}

export function SectionBreakField( { field } ) {
    return (
        <li className={ `wpuf-el wpuf-section-break ${ field.css || '' }` }>
            <div className="wpuf-section-wrap">
                <h2 className="wpuf-section-title">{ field.label }</h2>
                { field.description && <div className="wpuf-section-details">{ field.description }</div> }
            </div>
        </li>
    );
}

/** Post tags: a comma-separated list (the classic field posts `tags`). */
export function TagsField( props ) {
    return <TextField { ...props } />;
}
