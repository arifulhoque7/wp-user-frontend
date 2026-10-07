/**
 * Shell of the single React admin app (task 5d): one admin page, one mount,
 * hash routes, like FlyHR. Moving between the React screens does not reload
 * the page.
 *
 * Screens register a mount API (`window.wpuf.app.registerScreen()`, or the
 * `window.wpufAdminScreens` queue when they load first). The shell mounts the
 * active route's screen into its old container id, after setting the
 * screen's window globals and `window.wpufAdmin` boot data, and unmounts it on
 * the next route. Routes of screens that are not in the app (`mode: 'page'`)
 * open their own page.
 *
 * @since WPUF_SINCE
 */
import { doAction } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

const boot = window.wpufAdmin || {};
const app = boot.app || { routes: [], globals: {}, pageUrl: window.location.href };
const screens = {};
const guards = new Set();
const queryListeners = new Set();

let current = null; // { route, params, query, key, cleanup }
let skipNext = false;

/**
 * `/post-forms/:id/edit` -> { regex, keys }.
 *
 * @param {string} path Route path.
 *
 * @return {Object} Matcher.
 */
const compile = ( path ) => {
    const keys = [];
    const pattern = path.replace( /\/:([A-Za-z_]+)/g, ( match, key ) => {
        keys.push( key );

        return '/([^/]+)';
    } );

    return { regex: new RegExp( `^${ pattern }/?$` ), keys };
};

const routes = ( app.routes || [] ).map( ( route ) => ( { ...route, matcher: compile( route.path ) } ) );

/**
 * Current hash -> { path, query }.
 *
 * @return {Object} Location.
 */
const readHash = () => {
    const hash = window.location.hash.replace( /^#/, '' );
    const [ path, search = '' ] = hash.split( '?' );

    return { path: path || '', query: Object.fromEntries( new URLSearchParams( search ) ) };
};

const buildHash = ( path, query = {} ) => {
    const search = new URLSearchParams(
        Object.entries( query ).filter( ( [ , value ] ) => undefined !== value && null !== value && '' !== value )
    ).toString();

    return `#${ path }${ search ? `?${ search }` : '' }`;
};

/**
 * The route for a path.
 *
 * @param {string} path Path.
 *
 * @return {Object|null} { route, params }.
 */
const match = ( path ) => {
    for ( const route of routes ) {
        const found = route.matcher.regex.exec( path );

        if ( found ) {
            const params = {};

            route.matcher.keys.forEach( ( key, index ) => {
                params[ key ] = decodeURIComponent( found[ index + 1 ] );
            } );

            return { route, params };
        }
    }

    return null;
};

/**
 * Old page URL of a page-mode route, `:name` filled, route query kept.
 *
 * @param {Object} route  Route.
 * @param {Object} params Path params.
 * @param {Object} query  Query.
 *
 * @return {string} URL.
 */
const pageUrl = ( route, params, query ) => {
    const url = new URL( route.page.replace( /:([A-Za-z_]+)/g, ( m, key ) => encodeURIComponent( params[ key ] || '' ) ), window.location.href );

    Object.entries( query ).forEach( ( [ key, value ] ) => url.searchParams.set( key, value ) );

    return url.toString();
};

/**
 * Light the WPUF submenu row of the route and keep WordPress's title suffix.
 *
 * @param {Object} route Route.
 */
const syncChrome = ( route ) => {
    const menu = document.getElementById( 'toplevel_page_wp-user-frontend' );

    if ( menu ) {
        menu.classList.add( 'wp-has-current-submenu', 'wp-menu-open' );
        menu.classList.remove( 'wp-not-current-submenu' );
        menu.querySelectorAll( '.wp-submenu li' ).forEach( ( item ) => {
            const link = item.querySelector( 'a' );
            const href = link ? link.getAttribute( 'href' ) || '' : '';
            const lit = href.endsWith( `#${ route.menuPath || route.path }` ) || href.endsWith( `page=${ route.menu }` );

            item.classList.toggle( 'current', lit );

            if ( link ) {
                link.classList.toggle( 'current', lit );

                if ( lit ) {
                    link.setAttribute( 'aria-current', 'page' );
                } else {
                    link.removeAttribute( 'aria-current' );
                }
            }
        } );
    }

    if ( route.title ) {
        const parts = document.title.split( ' ‹ ' );

        document.title = [ route.title, ...parts.slice( 1 ) ].join( ' ‹ ' );
    }
};

/**
 * Body classes, notices and stylesheets of the active route.
 *
 * @param {Object} route Route.
 */
const syncPage = ( route ) => {
    const body = document.body;

    [ ...body.classList ].filter( ( name ) => name.startsWith( 'wpuf-route-' ) ).forEach( ( name ) => body.classList.remove( name ) );
    body.classList.add( `wpuf-route-${ route.id }` );
    routes.forEach( ( other ) => ( other.bodyClasses || [] ).forEach( ( name ) => body.classList.remove( name ) ) );
    ( route.bodyClasses || [] ).forEach( ( name ) => body.classList.add( name ) );

    const notices = document.getElementById( 'wpuf-admin-app-notices' );

    if ( notices ) {
        notices.hidden = ! route.notices || '' === notices.innerHTML.trim();
    }
};

/**
 * Stylesheets of the active load group on, other groups' sheets off (each
 * screen's Tailwind base differs; a screen's list and builder are separate
 * groups). Held sheets arrive as placeholders and become links the first
 * time their group opens.
 *
 * @param {string} group Load group (route `group`).
 *
 * @return {Promise} Resolves when the group's new sheets have loaded.
 */
const activateStyles = ( group ) => {
    const loads = [];

    document.querySelectorAll( 'template[data-wpuf-route-style]' ).forEach( ( placeholder ) => {
        const owners = ( placeholder.dataset.screens || '' ).split( ' ' );

        if ( ! owners.includes( group ) || document.getElementById( placeholder.dataset.id ) ) {
            return;
        }

        const link = document.createElement( 'link' );

        link.rel = 'stylesheet';
        link.id = placeholder.dataset.id;
        link.href = placeholder.dataset.href;
        link.media = placeholder.dataset.media || 'all';
        loads.push( new Promise( ( resolve ) => {
            link.addEventListener( 'load', resolve, { once: true } );
            link.addEventListener( 'error', resolve, { once: true } );
        } ) );
        placeholder.after( link, ...[ ...placeholder.content.childNodes ].map( ( node ) => node.cloneNode( true ) ) );
    } );

    Object.entries( app.styles || {} ).forEach( ( [ handle, owners ] ) => {
        const on = owners.includes( group );

        [ `${ handle }-css`, `${ handle }-rtl-css`, `${ handle }-inline-css` ].forEach( ( id ) => {
            const node = document.getElementById( id );

            // `disabled` switches a fetched sheet (link or inline style) off and on.
            if ( node ) {
                node.disabled = ! on;
            }
        } );
    } );

    return Promise.all( loads );
};

const container = () => document.getElementById( 'wpuf-admin-app' );

const unmountCurrent = () => {
    if ( current && current.cleanup ) {
        try {
            current.cleanup();
        } catch ( error ) {
            // A failing unmount must not block navigation.
            window.console.error( error ); // eslint-disable-line no-console
        }
    }

    const root = container();

    if ( root ) {
        root.innerHTML = '';
    }
};

const showNotFound = () => {
    const root = container();

    if ( ! root ) {
        return;
    }

    const box = document.createElement( 'div' );
    const text = document.createElement( 'p' );
    const link = document.createElement( 'a' );

    box.className = 'wpuf-admin-app-not-found';
    text.textContent = __( 'This page does not exist.', 'wp-user-frontend' );
    link.href = '#/post-forms';
    link.textContent = __( 'Go to Post Forms', 'wp-user-frontend' );
    box.append( text, link );
    root.append( box );
};

/**
 * Show the route of the current hash.
 */
const render = async () => {
    const { path, query } = readHash();
    const found = match( path );

    if ( ! found ) {
        unmountCurrent();
        current = null;
        showNotFound();

        return;
    }

    const { route, params } = found;

    if ( 'page' === route.mode ) {
        window.location.replace( pageUrl( route, params, query ) );

        return;
    }

    const key = `${ route.id }:${ JSON.stringify( params ) }`;

    // Same route and params: only the query changed (e.g. back/forward inside
    // a screen). The screen follows it without a remount.
    if ( current && current.key === key ) {
        current.query = query;
        queryListeners.forEach( ( listener ) => listener( query ) );

        return;
    }

    const screen = screens[ route.app ];

    if ( ! screen ) {
        window.location.replace( pageUrl( route, params, query ) );

        return;
    }

    unmountCurrent();
    queryListeners.clear();
    guards.clear();

    // The screen reads its window globals and boot data as on its own page.
    const group = route.group || route.screen;

    Object.entries( ( app.globals || {} )[ group ] || {} ).forEach( ( [ name, value ] ) => {
        window[ name ] = value;
    } );
    window.wpufAdmin = { ...( ( boot.screens || {} )[ route.boot ] || boot ), app };

    syncChrome( route );
    syncPage( route );
    await activateStyles( group );

    const element = document.createElement( 'div' );

    element.id = route.container || `wpuf-route-${ route.id }`;
    element.className = route.containerClass || '';
    container().append( element );

    current = { route, params, query, key, cleanup: null };

    const cleanup = screen.mount( element, {
        route,
        params,
        query,
        navigate,
        isAppRoute,
        getQuery,
        setQuery,
        addGuard,
        onQuery: ( listener ) => {
            queryListeners.add( listener );

            return () => queryListeners.delete( listener );
        },
    } );

    current.cleanup = 'function' === typeof cleanup ? cleanup : screen.unmount || null;

    doAction( 'wpuf.admin.routeChanged', { route, params, query } );
};

/**
 * Ask the registered guards before leaving the current route.
 *
 * @param {Object} next Next location.
 *
 * @return {Promise<boolean>} Allowed.
 */
const allowed = async ( next ) => {
    for ( const guard of guards ) {
        const answer = await guard( next );

        if ( false === answer ) {
            return false;
        }
    }

    return true;
};

const onHashChange = async ( event ) => {
    if ( skipNext ) {
        skipNext = false;

        return;
    }

    const next = readHash();
    const found = match( next.path );
    const leaving = current && ( ! found || `${ found.route.id }:${ JSON.stringify( found.params ) }` !== current.key );

    if ( leaving && guards.size ) {
        // Put the old URL back while the screen asks (unsaved changes).
        const previous = event && event.oldURL ? new URL( event.oldURL ).hash : buildHash( current.route.path, current.query );
        const target = window.location.hash;

        window.history.replaceState( null, '', previous );

        if ( ! ( await allowed( next ) ) ) {
            return;
        }

        guards.clear();
        window.history.pushState( null, '', target );
    }

    render();
};

/**
 * Whether a path opens a route inside the app (not a page-mode route).
 *
 * @param {string} path Route path, query allowed.
 *
 * @return {boolean} In the app.
 */
function isAppRoute( path ) {
    const found = match( path.replace( /^#/, '' ).split( '?' )[ 0 ] );

    return !! found && 'page' !== found.route.mode;
}

/**
 * Go to a route.
 *
 * @param {string}  path            Route path (may include `?query`).
 * @param {Object}  options         Options.
 * @param {boolean} options.replace Replace the history entry.
 */
function navigate( path, { replace = false } = {} ) {
    const hash = path.startsWith( '#' ) ? path : `#${ path }`;

    if ( replace ) {
        window.history.replaceState( null, '', hash );
        onHashChange( null );
    } else {
        window.location.hash = hash;
    }
}

/**
 * Query of the current route.
 *
 * @return {Object} Query.
 */
function getQuery() {
    return readHash().query;
}

/**
 * Change the current route's query without a remount.
 *
 * @param {Object}  query           Query (replaces the old one).
 * @param {Object}  options         Options.
 * @param {boolean} options.replace Replace the history entry (default true).
 */
function setQuery( query, { replace = true } = {} ) {
    const { path } = readHash();
    const hash = buildHash( path, query );

    if ( current ) {
        current.query = query;
    }

    if ( replace ) {
        window.history.replaceState( null, '', hash );
    } else {
        skipNext = true;
        window.location.hash = hash;
    }
}

/**
 * Register a guard asked before leaving the route (cleared on route change).
 *
 * @param {Function} guard ( next ) => boolean|Promise<boolean>.
 *
 * @return {Function} Remove the guard.
 */
function addGuard( guard ) {
    guards.add( guard );

    return () => guards.delete( guard );
}

/**
 * Register a screen's mount API.
 *
 * @param {string} id  Screen id (a route's `app`).
 * @param {Object} api { mount( element, context ) => cleanup?, unmount? }.
 */
function registerScreen( id, api ) {
    screens[ id ] = api;
}

window.wpuf = window.wpuf || {};
window.wpuf.app = { registerScreen, navigate, getQuery, setQuery, addGuard, routes: () => routes, current: () => current };

// Screens that loaded before the shell queued their API.
( Array.isArray( window.wpufAdminScreens ) ? window.wpufAdminScreens : [] ).forEach( ( [ id, api ] ) => registerScreen( id, api ) );
window.wpufAdminScreens = { push: ( [ id, api ] ) => registerScreen( id, api ) };

/**
 * Start: the server's route (old page redirect) wins, a legacy `#section`
 * fragment travels as `hash` in the route query, then the URL is made clean
 * (page + hash route) so menu clicks stay hash changes.
 */
const start = () => {
    let initial = app.initialRoute || '';
    // With a server route (old page redirect) any fragment came from the old
    // URL: old pages never used hash routes, so it is a section hash
    // (`#wpuf_ai`, `#/ai`) for the screen.
    const legacyHash = initial && window.location.hash ? window.location.hash.slice( 1 ) : '';

    if ( initial && legacyHash ) {
        initial += `${ initial.includes( '?' ) ? '&' : '?' }hash=${ encodeURIComponent( legacyHash ) }`;
    }

    if ( ! initial ) {
        initial = window.location.hash.startsWith( '#/' ) ? window.location.hash.slice( 1 ) : '/post-forms';
    }

    window.history.replaceState( null, '', `${ app.pageUrl }#${ initial }` );
    window.addEventListener( 'hashchange', onHashChange );
    render();
};

if ( 'loading' === document.readyState ) {
    document.addEventListener( 'DOMContentLoaded', start );
} else {
    start();
}
