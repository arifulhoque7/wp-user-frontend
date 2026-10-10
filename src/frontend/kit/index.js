/**
 * @wpuf/frontend-kit: what the frontend apps share. Published on
 * `window.wpuf.frontend` by the runtime bundle; the apps resolve this
 * module to that global (webpack.wpuf-externals.js FRONTEND_MAP).
 *
 * @since WPUF_SINCE
 */
import * as api from './api';
import * as icons from './icons';
import { Avatar, Button, Notice, Pill, Skeleton, SkeletonFormRows, SkeletonLines, SkeletonRows, Spinner, cx } from './components/primitives';
import { Card, DetailList, Pagination, RailItem, StatCard } from './components/layout';
import Field from './components/Field';
import ServerHtml from './components/ServerHtml';
import confirmDialog from './components/confirm';
import FormRenderer from './form/FormRenderer';
import useForm, { flatten } from './form/useForm';
import { isVisible, submitAllowed, visibleNames } from './form/conditions';
import { validateAll, validateField } from './form/validation';
import { afterSubmit, buildPayload } from './form/payload';
import { fieldComponent, registerField, registry } from './fields';

/**
 * Mount a React app on every root the server rendered for it.
 *
 * @param {string}   app    'forms' | 'account'
 * @param {Function} render ( root, boot ) => void
 */
export function mountAll( app, render ) {
    const mount = () => {
        document.querySelectorAll( `[data-wpuf-react="${ app }"]` ).forEach( ( root ) => {
            if ( root.dataset.mounted ) {
                return;
            }

            root.dataset.mounted = '1';

            const script = root.querySelector( 'script.wpuf-boot' );
            let boot = {};

            try {
                boot = script ? JSON.parse( script.textContent || '{}' ) : {};
            } catch ( e ) {
                boot = {};
            }

            render( root, boot );
        } );
    };

    if ( 'loading' === document.readyState ) {
        document.addEventListener( 'DOMContentLoaded', mount );
    } else {
        mount();
    }

    // Page builders and the account shell add roots later.
    document.addEventListener( 'wpuf:frontend:html', mount );
}

export {
    api,
    icons,
    Avatar,
    Button,
    Notice,
    Pill,
    Skeleton,
    SkeletonFormRows,
    SkeletonLines,
    SkeletonRows,
    Spinner,
    cx,
    Card,
    DetailList,
    Pagination,
    RailItem,
    StatCard,
    Field,
    ServerHtml,
    confirmDialog,
    FormRenderer,
    useForm,
    flatten,
    isVisible,
    submitAllowed,
    visibleNames,
    validateAll,
    validateField,
    afterSubmit,
    buildPayload,
    fieldComponent,
    registerField,
    registry,
};
