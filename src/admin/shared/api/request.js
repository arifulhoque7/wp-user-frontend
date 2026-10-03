/**
 * Request layer for the WPUF React admin.
 *
 * A wrapper over `@wordpress/api-fetch`, not a global middleware: WordPress
 * core already sets the REST root and nonce on `wp-api-fetch`, and a global
 * `apiFetch.use()` would also change errors, timeouts and retries for core
 * and other plugins on the same page (design.md D24).
 *
 * - 30 s timeout per attempt (chained to the caller's signal);
 * - GET/HEAD retried on a 5xx (twice, short back-off), never a mutation;
 * - every failure rejects with `{ code, message, status, data }`.
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

export const REQUEST_TIMEOUT_MS = 30000;
export const MAX_RETRIES = 2;

/**
 * @typedef {Object} ApiError
 * @property {string} code    Error code (`wpuf_*`, WP REST code, `timeout`, `network`).
 * @property {string} message Human readable message.
 * @property {number} status  HTTP status (0 when the request never got one).
 * @property {*}      [data]  Extra data from the response.
 */

/**
 * Normalize anything apiFetch can throw.
 *
 * @param {*} raw Thrown value.
 *
 * @return {ApiError} Normalized error.
 */
export function normalizeError( raw ) {
    if ( raw && 'object' === typeof raw && 'code' in raw && 'status' in raw && 'message' in raw && 'number' === typeof raw.status ) {
        return raw;
    }

    if ( raw && 'AbortError' === raw.name ) {
        return { code: 'timeout', message: raw.message || 'The request was aborted.', status: 0 };
    }

    const status = Number( raw?.data?.status ?? raw?.status ?? 0 ) || 0;

    return {
        code: String( raw?.code || ( status ? 'http_' + status : 'network' ) ),
        message: String( raw?.message || 'The request failed.' ),
        status,
        data: raw?.data,
    };
}

/**
 * Build a REST path: `restPath( 'wpuf/v1', '/forms', { page: 2 } )`.
 *
 * @param {string} namespace REST namespace.
 * @param {string} path      Route.
 * @param {Object} [query]   Query args.
 *
 * @return {string} Path for apiFetch.
 */
export function restPath( namespace, path, query ) {
    const base = '/' + String( namespace ).replace( /^\/+|\/+$/g, '' ) + '/' + String( path ).replace( /^\/+/, '' );

    return query ? addQueryArgs( base, query ) : base;
}

const wait = ( ms ) => new Promise( ( resolve ) => setTimeout( resolve, ms ) );

/**
 * Call a REST route.
 *
 * @param {string} path              Route (see restPath()).
 * @param {Object} [options]         apiFetch options (method, data, body, headers, signal, parse).
 * @param {Object} [options.query]   Query args added to the path.
 *
 * @return {Promise<*>} Response body.
 */
export async function request( path, options = {} ) {
    const { query, signal: callerSignal, ...rest } = options;
    const method = String( rest.method || 'GET' ).toUpperCase();
    const idempotent = 'GET' === method || 'HEAD' === method;
    const url = query ? addQueryArgs( path, query ) : path;

    const once = () => {
        const controller = new AbortController();
        const timer = setTimeout( () => controller.abort(), REQUEST_TIMEOUT_MS );

        if ( callerSignal ) {
            if ( callerSignal.aborted ) {
                controller.abort();
            } else {
                callerSignal.addEventListener( 'abort', () => controller.abort(), { once: true } );
            }
        }

        return Promise.resolve( apiFetch( { ...rest, method, path: url, signal: controller.signal } ) ).finally( () => clearTimeout( timer ) );
    };

    for ( let attempt = 0; ; attempt++ ) {
        try {
            return await once();
        } catch ( raw ) {
            const error = normalizeError( raw );
            const retry = idempotent && error.status >= 500 && attempt < MAX_RETRIES && ! callerSignal?.aborted;

            if ( ! retry ) {
                throw error;
            }

            await wait( 300 * ( attempt + 1 ) );
        }
    }
}
