#!/usr/bin/env node
/**
 * Fails when a generated asset is missing, empty or half built.
 *
 * Generated assets are gitignored and built fresh (`pnpm build`, then
 * `grunt release` for a release), so a broken build would otherwise ship a
 * plugin whose admin screens do not load. Run after `pnpm build`; pass
 * `--release` after `grunt release` to also check the release-only outputs.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..' );

// Output of `pnpm build`. React bundles also need their `.asset.php`
// (dependencies + content hash, read by includes/Assets.php).
const react = [ 'form-builder', 'forms-list-react', 'settings-react', 'subscriptions' ];
const built = [
    ...react.flatMap( ( name ) => [ `assets/js/${ name }.min.js`, `assets/js/${ name }.min.asset.php` ] ),
    'assets/js/account.min.js',
    'assets/js/ai-form-builder.min.js',
    'assets/js/frontend-form.min.js',
    'assets/js/frontend-subscriptions.min.js',
    'assets/js/upload.min.js',
    'assets/js/wpuf-user-directory-free.js',
    'assets/js/wpuf-user-directory-free.asset.php',
    'assets/css/admin.css',
    'assets/css/admin/form-builder.css',
    'assets/css/ai-form-builder.min.css',
    'assets/css/elementor-frontend-forms.css',
    'assets/css/forms-list.min.css',
    'assets/css/frontend-forms.css',
    'assets/css/frontend-subscriptions.min.css',
    'assets/css/registration-forms.css',
    'assets/css/settings-react.css',
    'assets/css/subscriptions.css',
    'assets/css/subscriptions-rtl.css',
    'assets/css/wpuf-form-builder.css',
];
const release = [ 'languages/wp-user-frontend.pot' ];

const files = process.argv.includes( '--release' ) ? [ ...built, ...release ] : built;
const errors = [];

for ( const file of files ) {
    const path = join( root, file );

    if ( ! existsSync( path ) ) {
        errors.push( `${ file }: missing` );
        continue;
    }

    if ( 0 === statSync( path ).size ) {
        errors.push( `${ file }: empty` );
        continue;
    }

    const text = readFileSync( path, 'utf8' );

    if ( file.endsWith( '.asset.php' ) && ! ( text.includes( "'dependencies'" ) && text.includes( "'version'" ) ) ) {
        errors.push( `${ file }: no dependencies/version` );
    }

    // webpack replaces an import it could not resolve with a throwing stub.
    if ( file.endsWith( '.js' ) && /webpackMissingModule|Cannot find module '/.test( text ) ) {
        errors.push( `${ file }: contains an unresolved import` );
    }
}

if ( errors.length ) {
    for ( const error of errors ) {
        console.error( `::error::${ error }` );
    }
    console.error( `verify-build: ${ errors.length } problem(s); the build is incomplete.` );
    process.exit( 1 );
}

console.log( `verify-build: ${ files.length } generated assets present.` );
