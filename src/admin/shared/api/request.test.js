jest.mock( '@wordpress/api-fetch', () => jest.fn() );

import apiFetch from '@wordpress/api-fetch';

import { MAX_RETRIES, REQUEST_TIMEOUT_MS, normalizeError, request, restPath } from './request';

beforeEach( () => {
    apiFetch.mockReset();
} );

test( 'restPath joins namespace, route and query', () => {
    expect( restPath( 'wpuf/v1', '/forms' ) ).toBe( '/wpuf/v1/forms' );
    expect( restPath( '/wpuf/v1/', 'forms', { page: 2 } ) ).toBe( '/wpuf/v1/forms?page=2' );
} );

test( 'normalizeError gives one shape', () => {
    expect( normalizeError( { code: 'rest_forbidden', message: 'No', data: { status: 403 } } ) ).toEqual( { code: 'rest_forbidden', message: 'No', status: 403, data: { status: 403 } } );
    expect( normalizeError( new TypeError( 'Failed to fetch' ) ) ).toMatchObject( { code: 'network', status: 0, message: 'Failed to fetch' } );
    const abort = new Error( 'aborted' );
    abort.name = 'AbortError';
    expect( normalizeError( abort ) ).toMatchObject( { code: 'timeout', status: 0 } );
} );

test( 'GET is retried on a 5xx, then resolves', async () => {
    jest.useFakeTimers();
    apiFetch
        .mockRejectedValueOnce( { code: 'http_500', message: 'x', data: { status: 500 } } )
        .mockResolvedValueOnce( { ok: true } );

    const done = request( '/wpuf/v1/forms', { query: { page: 1 } } );
    await jest.advanceTimersByTimeAsync( 1000 );

    await expect( done ).resolves.toEqual( { ok: true } );
    expect( apiFetch ).toHaveBeenCalledTimes( 2 );
    expect( apiFetch.mock.calls[ 0 ][ 0 ] ).toMatchObject( { method: 'GET', path: '/wpuf/v1/forms?page=1' } );
    jest.useRealTimers();
} );

test( 'GET gives up after MAX_RETRIES and rejects normalized', async () => {
    jest.useFakeTimers();
    apiFetch.mockRejectedValue( { code: 'http_503', message: 'down', data: { status: 503 } } );

    const done = request( '/wpuf/v1/forms' );
    const assertion = expect( done ).rejects.toMatchObject( { code: 'http_503', status: 503 } );
    await jest.advanceTimersByTimeAsync( 5000 );
    await assertion;
    expect( apiFetch ).toHaveBeenCalledTimes( MAX_RETRIES + 1 );
    jest.useRealTimers();
} );

test( 'a POST is never retried', async () => {
    apiFetch.mockRejectedValue( { code: 'http_500', message: 'x', data: { status: 500 } } );

    await expect( request( '/wpuf/v1/forms', { method: 'POST', data: { a: 1 } } ) ).rejects.toMatchObject( { status: 500 } );
    expect( apiFetch ).toHaveBeenCalledTimes( 1 );
    expect( apiFetch.mock.calls[ 0 ][ 0 ] ).toMatchObject( { method: 'POST', data: { a: 1 } } );
} );

test( 'a request that hangs is aborted after the timeout', async () => {
    jest.useFakeTimers();
    apiFetch.mockImplementation( ( { signal } ) => new Promise( ( resolve, reject ) => {
        signal.addEventListener( 'abort', () => {
            const error = new Error( 'aborted' );
            error.name = 'AbortError';
            reject( error );
        } );
    } ) );

    const done = request( '/wpuf/v1/slow', { method: 'POST' } );
    const assertion = expect( done ).rejects.toMatchObject( { code: 'timeout' } );
    await jest.advanceTimersByTimeAsync( REQUEST_TIMEOUT_MS + 1 );
    await assertion;
    jest.useRealTimers();
} );
