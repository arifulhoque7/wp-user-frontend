/**
 * Custom hook for fetching forms from the REST API.
 *
 * @since WPUF_SINCE
 */
import { useState, useCallback, useRef } from '@wordpress/element';
import { request, restPath } from '@wpuf/api';

export const PER_PAGE = 10;

/**
 * Parse JSON from a response that may contain PHP notices mixed in.
 *
 * @param {string} responseText Raw response body text.
 *
 * @return {Object} Parsed JSON object.
 */
export const parseJsonFromResponse = ( responseText ) => {
    try {
        return JSON.parse( responseText );
    } catch ( initialError ) {
        // Extract JSON from HTML response with error notices
        const lines = responseText.split( '\n' );

        // Find complete JSON line
        for ( let i = lines.length - 1; i >= 0; i-- ) {
            const line = lines[ i ].trim();
            if ( line.startsWith( '{' ) && line.endsWith( '}' ) ) {
                return JSON.parse( line );
            }
        }

        // Fallback: extract by brace counting
        let startIndex = -1;
        let braceCount = 0;

        for ( let i = 0; i < responseText.length; i++ ) {
            if ( responseText[ i ] === '{' ) {
                if ( startIndex === -1 ) {
                    startIndex = i;
                }
                braceCount++;
            } else if ( responseText[ i ] === '}' ) {
                braceCount--;
                if ( braceCount === 0 && startIndex !== -1 ) {
                    return JSON.parse( responseText.substring( startIndex, i + 1 ) );
                }
            }
        }

        throw new Error( 'Invalid JSON response from server' );
    }
};

/**
 * Hook to fetch and manage forms list data.
 *
 * Requests go through the shared request layer (`@wpuf/api`: WordPress REST
 * root and nonce, timeout, GET retry on a 5xx). The body is read as text so a
 * response with PHP notices in front of the JSON still loads (develop).
 * Only the latest request writes the list: a slower, older answer (search
 * typing, tab switches) is dropped.
 *
 * @param {Object} options
 * @param {string} options.postType Post type slug. Default 'wpuf_forms'.
 *
 * @return {Object} { forms, loading, error, pagination, counts, fetchForms }
 */
const useFormsFetch = ( { postType = 'wpuf_forms' } = {} ) => {
    const [ forms, setForms ] = useState( [] );
    const [ loading, setLoading ] = useState( true );
    const [ pagination, setPagination ] = useState( {
        total_items: 0,
        total_pages: 0,
        current_page: 1,
        per_page: PER_PAGE,
    } );
    const [ error, setError ] = useState( null );
    // Status tab counts from the last list answer (null until one arrives).
    const [ counts, setCounts ] = useState( null );
    const latest = useRef( 0 );

    const fetchForms = useCallback( async ( page = 1, status = 'any', search = '', perPage = PER_PAGE ) => {
        const requestId = ++latest.current;

        setLoading( true );
        setError( null );

        const query = {
            page,
            per_page: perPage,
            status,
            post_type: postType,
        };

        if ( search ) {
            query.s = search;
        }

        try {
            const response = await request( restPath( 'wpuf/v1', '/wpuf_form' ), { query, parse: false } );
            const data = parseJsonFromResponse( await response.text() );

            if ( requestId !== latest.current ) {
                return;
            }

            if ( data.counts && 'object' === typeof data.counts ) {
                setCounts( data.counts );
            }

            if ( data.success && data.result ) {
                setForms( data.result );
                setPagination( {
                    total_items: parseInt( data.pagination?.total_items, 10 ) || 0,
                    total_pages: data.pagination?.total_pages || 0,
                    current_page: page,
                    per_page: perPage,
                } );
            } else {
                setForms( [] );
                setPagination( { total_items: 0, total_pages: 0, current_page: 1, per_page: perPage } );
            }
        } catch ( err ) {
            if ( requestId !== latest.current ) {
                return;
            }

            setError( err );
            setForms( [] );
            setPagination( { total_items: 0, total_pages: 0, current_page: 1, per_page: perPage } );
        } finally {
            if ( requestId === latest.current ) {
                setLoading( false );
            }
        }
    }, [ postType ] );

    return { forms, loading, pagination, error, counts, fetchForms };
};

export default useFormsFetch;
