/**
 * One wp-scripts config for the React admin apps (builder, forms list,
 * subscriptions, settings).
 *
 * Output names are unchanged (assets/js/<name>.min.js + .min.asset.php,
 * assets/css/<name>.css + -rtl.css), so the registered handles keep working.
 * Build one app with `WPUF_ENTRY=<name>`, e.g. `WPUF_ENTRY=form-builder`.
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const RtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const path = require( 'path' );

const entries = {
    'form-builder': './admin/form-builder/src/index.jsx',
    'forms-list-react': './admin/forms-list/src/index.jsx',
    subscriptions: './src/js/subscriptions.jsx',
    'settings-react': './src/js/settings.jsx',
};

const only = process.env.WPUF_ENTRY;

if ( only && ! entries[ only ] ) {
    throw new Error( `WPUF_ENTRY "${ only }" is not one of: ${ Object.keys( entries ).join( ', ' ) }` );
}

// Keep wp-scripts' own mini-css-extract-plugin instance (its CSS loader only
// accepts that copy). Its RTL plugin writes [name]-rtl.css to the output root,
// so the standalone one keeps the css/ path. The block-only plugins (block.json
// copy, render PHP paths) and the cleaner do not belong to these apps.
const plugins = defaultConfig.plugins.filter(
    ( plugin ) =>
        ! [ 'CleanWebpackPlugin', 'RtlCssPlugin', 'CopyPlugin', 'PhpFilePathsPlugin' ].includes( plugin.constructor.name )
);
const cssExtract = plugins.find( ( plugin ) => 'MiniCssExtractPlugin' === plugin.constructor.name );

if ( cssExtract ) {
    cssExtract.options.filename = 'css/[name].css';
}

plugins.push( new RtlCssPlugin( { filename: 'css/[name]-rtl.css' } ) );

module.exports = {
    ...defaultConfig,
    entry: only ? { [ only ]: entries[ only ] } : entries,
    output: {
        filename: 'js/[name].min.js',
        path: path.resolve( __dirname, 'assets' ),
        // assets/ holds every other build's output and tracked sources: never clean it.
        clean: false,
    },
    plugins,
    resolve: {
        ...defaultConfig.resolve,
        alias: {
            ...defaultConfig.resolve.alias,
            'postcss-config$': path.resolve( __dirname, 'postcss.config.react.js' ),
        },
    },
    watchOptions: {
        ignored: [ '**/assets/js/**', '**/assets/css/**', '**/node_modules/**' ],
    },
};
