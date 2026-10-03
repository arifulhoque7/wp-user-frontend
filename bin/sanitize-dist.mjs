#!/usr/bin/env node
/**
 * Post-build guard: no generated asset may load a file from another host.
 *
 * wp.org rejects plugins that call files remotely. `@wedevs/plugin-ui` ships
 * one prebuilt CommonJS file whose demo components hardcode a few remote
 * images (e.g. a Google logo on upload.wikimedia.org) in code WPUF never
 * renders; once a bundle imports plugin-ui those literals land in it.
 *
 * This rewrites those known URLs to an inert local data URI, then FAILS when
 * any remote image/font/style/script file load is left in a generated JS or
 * CSS file (bin/build-outputs.mjs), so a dependency bump cannot bring one
 * back silently. Runs in `pnpm build` (FlyHR's bin/sanitize-dist.mjs).
 *
 * XML namespaces (http://www.w3.org/...), documentation and error-message
 * links are not file loads and are left alone. Service calls (an API
 * endpoint without a file extension) are not files either.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { built } from './build-outputs.mjs';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..' );

// 1x1 transparent GIF: inert local stand-in for a remote image in dead code.
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

// Remote hosts whose baked-in asset URLs are neutralised (plugin-ui demo code).
const REMOTE_ASSET = /https?:\/\/upload\.wikimedia\.org\/[^"'`\\)\s]+/g;

// Safety net: no remote file may stay loadable as a `src:`/`src=`/`url(`/
// `@import` value. The prefixes keep plain links (not file loads) out.
const LEFTOVER = /(?:src\s*[:=]\s*|url\(\s*|@import\s+)["'`]?(https?:\/\/[^"'`)\s]+\.(?:png|jpe?g|gif|svg|webp|avif|css|js|woff2?|ttf|otf|eot))/gi;

let total = 0;
const errors = [];
const files = built.filter( ( file ) => /\.(js|css)$/.test( file ) && existsSync( join( root, file ) ) );

for ( const file of files ) {
    const path = join( root, file );
    const before = readFileSync( path, 'utf8' );
    const hits = file.endsWith( '.js' ) ? before.match( REMOTE_ASSET ) : null;
    const after = hits ? before.replace( REMOTE_ASSET, BLANK ) : before;

    if ( hits ) {
        total += hits.length;
        writeFileSync( path, after );
        console.log( `  ${ file }: neutralised ${ hits.length } remote asset URL(s)` );
    }

    for ( const match of after.matchAll( LEFTOVER ) ) {
        errors.push( `${ file }: loads ${ match[ 1 ] }` );
    }
}

if ( errors.length ) {
    for ( const error of errors ) {
        console.error( `::error::${ error }` );
    }
    console.error( `sanitize-dist: ${ errors.length } remote file load(s) left; wp.org does not allow them.` );
    process.exit( 1 );
}

console.log( `sanitize-dist: ${ total } remote asset URL(s) neutralised across ${ files.length } generated file(s).` );
