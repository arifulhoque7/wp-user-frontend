/**
 * The post form from its schema: the classic wrapper and list
 * (`form.wpuf-form-add.wpuf-form-<layout> > ul.wpuf-form.form-label-<pos>`),
 * the server slots in their classic places, guest fields, the fields
 * through the registry under conditional logic, the featured checkbox,
 * steps with a progress bar, the submit row with the draft button. The
 * parent owns the state (useForm) and the submit.
 *
 * @since WPUF_SINCE
 */
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import Field from '../components/Field';
import ServerHtml from '../components/ServerHtml';
import { Button, cx } from '../components/primitives';
import { fieldComponent } from '../fields';

export default function FormRenderer( {
    schema,
    form,
    guest,
    setGuest,
    featured,
    setFeatured,
    extras,
    setExtra,
    onSubmit,
    onDraft,
    onDeleteStored,
    busy,
    draftBusy,
    submitAllowed = true,
} ) {
    const { values, setValue, errors, touch, visible, steps, validate } = form;
    const [ step, setStep ] = useState( 0 );
    const slots = schema.slots || {};
    const layout = schema.layout || {};
    const multistep = layout.multistep && steps.length > 1;
    const current = multistep ? steps[ step ] : null;
    const fieldsToRender = multistep ? current.fields : schema.fields;

    const renderField = ( field ) => {
        if ( ! field || ! field.name && 'section_break' !== field.template && 'custom_html' !== field.template ) {
            return null;
        }

        if ( ! visible.has( field.name ) && field.name ) {
            return null;
        }

        const Component = fieldComponent( field.template );

        return (
            <Component
                key={ field.id || field.name }
                field={ field }
                formId={ schema.id }
                schema={ schema }
                value={ values[ field.name ] }
                error={ errors[ field.name ] }
                onChange={ ( value ) => setValue( field.name, value ) }
                onBlur={ () => touch( field.name ) }
                renderField={ renderField }
                onDeleteStored={ onDeleteStored }
            />
        );
    };

    const next = () => {
        if ( Object.keys( validate( current.fields ) ).length ) {
            return;
        }

        setStep( ( s ) => Math.min( steps.length - 1, s + 1 ) );
    };

    const submitLabel = 'edit' === schema.mode ? layout.update_text : layout.submit_text;

    return (
        <>
            { slots.before_form && <ServerHtml html={ slots.before_form } slug="before_form" /> }
            <form
                className={ cx( 'wpuf-form-add', `wpuf-form-${ layout.layout || 'layout1' }`, layout.use_theme_css && 'layout1' === layout.layout && 'wpuf-theme-style', multistep && 'wpuf-multistep' ) }
                action=""
                method="post"
                noValidate
                onSubmit={ ( event ) => {
                    event.preventDefault();

                    if ( multistep && step < steps.length - 1 ) {
                        next();

                        return;
                    }

                    onSubmit();
                } }
            >
                { layout.show_title && schema.title && <h2 className="wpuf-form-title">{ schema.title }</h2> }
                { layout.description && <ServerHtml html={ layout.description } className="wpuf-form-description" /> }

                { multistep && (
                    <div className={ cx( 'wpuf-multistep-progressbar', `wpuf-progress-${ layout.progress || 'progressive' }` ) } role="progressbar" aria-valuemin={ 1 } aria-valuemax={ steps.length } aria-valuenow={ step + 1 }>
                        { 'step_by_step' === layout.progress ? (
                            <ul className="wpuf-step-indicator">
                                { steps.map( ( s, index ) => (
                                    <li key={ index } className={ cx( index === step && 'active', index < step && 'done' ) }>
                                        <span className="wpuf-step-indicator__number">{ index + 1 }</span>
                                        { s.title && <span className="wpuf-step-indicator__title">{ s.title }</span> }
                                    </li>
                                ) ) }
                            </ul>
                        ) : (
                            <div className="wpuf-progress-track">
                                <div className="wpuf-progress-fill" style={ { width: `${ Math.round( ( ( step + 1 ) / steps.length ) * 100 ) }%` } }>
                                    { /* translators: 1: current step, 2: total steps */ }
                                    { sprintf( __( 'Step %1$d of %2$d', 'wp-user-frontend' ), step + 1, steps.length ) }
                                </div>
                            </div>
                        ) }
                    </div>
                ) }

                <ul className={ cx( 'wpuf-form', `form-label-${ layout.label_position || 'left' }` ) }>
                    { slots.fields_top && <ServerHtml as="li" html={ slots.fields_top } slug="fields_top" className="wpuf-el wpuf-slot" /> }
                    { slots.form_top && <ServerHtml as="li" html={ slots.form_top } slug="form_top" className="wpuf-el wpuf-slot" /> }

                    { schema.guest?.fields && ( ! multistep || 0 === step ) && (
                        <>
                            <Field field={ { name: 'guest_name', label: schema.guest.name_label, required: 'yes', template: 'guest_name' } } id={ `guest_name_${ schema.id }` } error={ errors.guest_name } className="el-name">
                                <input id={ `guest_name_${ schema.id }` } type="text" name="guest_name" value={ guest.guest_name || '' } size={ 40 } required onChange={ ( event ) => setGuest( { ...guest, guest_name: event.target.value } ) } />
                            </Field>
                            <Field field={ { name: 'guest_email', label: schema.guest.email_label, required: 'yes', template: 'guest_email' } } id={ `guest_email_${ schema.id }` } error={ errors.guest_email } className="el-email">
                                <input id={ `guest_email_${ schema.id }` } type="email" name="guest_email" value={ guest.guest_email || '' } size={ 40 } required onChange={ ( event ) => setGuest( { ...guest, guest_email: event.target.value } ) } />
                            </Field>
                        </>
                    ) }

                    { schema.featured?.enabled && ( ! multistep || 0 === step ) && (
                        <li className="wpuf-el field-size-large" data-label={ __( 'Is featured', 'wp-user-frontend' ) }>
                            <div className="wpuf-label">
                                <label htmlFor={ `wpuf_is_featured_${ schema.id }` }>{ __( 'Featured', 'wp-user-frontend' ) }</label>
                            </div>
                            <div className="wpuf-fields">
                                <label className="wpuf-choice">
                                    <input id={ `wpuf_is_featured_${ schema.id }` } type="checkbox" className="wpuf_is_featured" name="is_featured_item" value="1" checked={ !! featured } onChange={ ( event ) => setFeatured( event.target.checked ) } />
                                    <span className="wpuf-message-box">
                                        { /* translators: 1: post type, 2: remaining featured items */ }
                                        { sprintf( __( 'Mark the %1$s as featured (remaining %2$d)', 'wp-user-frontend' ), schema.featured.post_type, Math.max( 0, schema.featured.remaining - ( featured && ! schema.featured.checked ? 1 : 0 ) ) ) }
                                    </span>
                                </label>
                            </div>
                        </li>
                    ) }

                    { ( fieldsToRender || [] ).map( renderField ) }

                    { ( ! multistep || step === steps.length - 1 ) && (
                        <li className="wpuf-submit">
                            <div className="wpuf-label">&nbsp;</div>
                            { multistep && (
                                <Button variant="secondary" className="wpuf-step-prev" onClick={ () => setStep( ( s ) => Math.max( 0, s - 1 ) ) }>
                                    { __( 'Previous', 'wp-user-frontend' ) }
                                </Button>
                            ) }
                            { slots.submit && <ServerHtml html={ slots.submit } slug="submit" className="wpuf-slot-inline" /> }
                            <Button type="submit" className={ `wpuf-submit-button wpuf_submit_${ schema.id }` } busy={ busy } disabled={ ! submitAllowed }>
                                { busy ? __( 'Submitting…', 'wp-user-frontend' ) : submitLabel }
                            </Button>
                            { layout.draft && 'create' === schema.mode && onDraft && (
                                <Button variant="link" id="wpuf-post-draft" className="wpuf-draft-button" busy={ draftBusy } onClick={ onDraft }>
                                    { __( 'Save Draft', 'wp-user-frontend' ) }
                                </Button>
                            ) }
                        </li>
                    ) }

                    { multistep && step < steps.length - 1 && (
                        <li className="wpuf-submit wpuf-step-nav">
                            <div className="wpuf-label">&nbsp;</div>
                            { step > 0 && (
                                <Button variant="secondary" className="wpuf-step-prev" onClick={ () => setStep( ( s ) => Math.max( 0, s - 1 ) ) }>
                                    { __( 'Previous', 'wp-user-frontend' ) }
                                </Button>
                            ) }
                            <Button className="wpuf-step-next" onClick={ next }>
                                { __( 'Next', 'wp-user-frontend' ) }
                            </Button>
                        </li>
                    ) }

                    { slots.form_bottom && <ServerHtml as="li" html={ slots.form_bottom } slug="form_bottom" className="wpuf-el wpuf-slot" /> }
                </ul>
            </form>
            { slots.after_form && <ServerHtml html={ slots.after_form } slug="after_form" /> }
        </>
    );
}
