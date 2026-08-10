// DESCRIPTION: Webpack config for Gutenberg blocks, extending @wordpress/scripts defaults.
// Uses @wordpress/scripts build pipeline for block.json, asset manifests, and editor assets.
// Coexists with Vite (used for Vue admin apps) — different entry points, different output.

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

// The entry key carries the js/blocks/ (or js/) prefix and the output root is `assets`, so
// each bundle lands at assets/<entry-key>.js while block.json — which wp-scripts copies using
// its path relative to the source root — lands alongside it. Setting output.path deeper (e.g.
// assets/js/blocks) instead duplicated that prefix (assets/js/blocks/js/blocks/post-form/…).
module.exports = {
    ...defaultConfig,
    entry: {
        'js/blocks/post-form': './src/js/blocks/post-form/index.js',
        'js/subscription-packs': './src/js/blocks/subscription-packs/index.js',
    },
    output: {
        path: path.resolve( __dirname, 'assets' ),
        filename: '[name].js',
    },
};
