// DESCRIPTION: Webpack config for the React admin Subscriptions app (wp-scripts based).
// Kept separate from webpack.config.js (Gutenberg blocks) because the output
// naming and CSS handling differ.

const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const RtlCssPlugin = require('rtlcss-webpack-plugin');
const path = require('path');

// Keep wp-scripts' own mini-css-extract-plugin instance (its CSS loader only
// accepts that copy) and point the CSS into assets/css. Its RTL plugin writes
// [name]-rtl.css to the output root, so the standalone one keeps the old path.
const plugins = defaultConfig.plugins.filter(
    (plugin) =>
        plugin.constructor.name !== 'CleanWebpackPlugin' &&
        plugin.constructor.name !== 'RtlCssPlugin'
);
const cssExtract = plugins.find((plugin) => plugin.constructor.name === 'MiniCssExtractPlugin');

if (cssExtract) {
    cssExtract.options.filename = 'css/[name].css';
}

plugins.push(
    new RtlCssPlugin({
        filename: 'css/[name]-rtl.css',
    })
);

module.exports = {
    ...defaultConfig,
    entry: {
        'subscriptions': path.resolve(process.cwd(), 'src/js/subscriptions.jsx'),
    },
    output: {
        filename: 'js/[name].min.js',
        path: path.resolve(process.cwd(), 'assets'),
        // assets/ holds every other build's output: never clean it.
        clean: false,
    },
    plugins,
    watchOptions: {
        ignored: ['**/assets/js/**', '**/assets/css/**', '**/node_modules/**'],
    },
    resolve: {
        ...defaultConfig.resolve,
        alias: {
            ...defaultConfig.resolve.alias,
            'postcss-config$': path.resolve(__dirname, 'postcss.config.react.js'),
        },
    },
};
