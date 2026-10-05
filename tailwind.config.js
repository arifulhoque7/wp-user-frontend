const colors = require('tailwindcss/colors');

const { scopedPreflightStyles, isolateInsideOfContainer } = require('tailwindcss-scoped-preflight');

/** @type {import('tailwindcss').Config} */
module.exports = {
    prefix: 'wpuf-',
    content: [
        // Sources only: generated bundles live next to the hand-written JS in
        // assets/js, and scanning them made the CSS depend on build order and
        // on stale files left on disk.
        './assets/**/*.{js,jsx,ts,tsx,vue,html}',
        '!./assets/js/**/*.min.js',
        '!./assets/js/wpuf-user-directory-free.js',
        '!./assets/vendor/**',
        './includes/Admin/**/*.php',
        './includes/Free/Free_Loader.php',
        './includes/Admin/template-parts/*.php',
        './admin/form-builder/views/*.php',
        // Classes of the removed Vue settings view (task 5.1c), kept so the
        // sheet does not change.
        './tools/admin-css/src/legacy/*.classes.txt',
        // Vue cleanup: old Vue component PHP templates deleted
        // './admin/form-builder/assets/js/**/*.php',
        './src/admin/apps/form-builder/**/*.{js,jsx}',
        './src/admin/apps/forms-list/**/*.{js,jsx}',
        './templates/**/*.php',
        'wpuf-functions.php',
        './src/**/*.{js,jsx,css}',
        // Free User Directory module templates
        './modules/user-directory/**/*.php',
        './modules/user-directory/views/**/*.php',
    ],
    theme: {
        extend: {
            colors: {
                primary: colors.emerald[600],
                primaryHover: colors.emerald[500],
            },
            spacing: {
                '1.75': '7px',
                '3.75': '15px',
                '4.5': '18px',
                '13': '52px',
            },
            fontSize: {
                '2xs': '13px',
            },
            minWidth: {
                'btn-cancel': '101px',
                'btn-save': '158px',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms')({ strategy: 'class' }),
        require('daisyui'),
        scopedPreflightStyles({
            isolationStrategy: isolateInsideOfContainer(
                [
                    '.wpuf_packs',
                    '#wpuf-subscription-page',
                    '#wpuf-form-builder',
                    '#wpuf-profile-forms-list-table-view',
                    '#wpuf-post-forms-list-table-view',
                    '#wpuf-ai-form-builder',
                    '.wpuf-ai-form-wrapper',
                    '.swal2-container',
                    '.wpuf-account-container',
                    '.wpuf-form-template-modal'
                ], {}
            ),
        } ),
    ],
    daisyui: {
        themes: []
    },
}
