/**
 * Generated assets: what `pnpm build` (and `grunt release`) must produce.
 * Shared by verify-build.mjs and sanitize-dist.mjs.
 */
// Output of `pnpm build`. React bundles also need their `.asset.php`
// (dependencies + content hash, read by includes/Assets.php).
export const react = [ 'form-builder', 'forms-list-react', 'settings-react', 'subscriptions', 'admin-runtime', 'admin-ui' ];
export const built = [
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
    'assets/css/admin/forms-react.css',
    'assets/css/admin/forms-react-rtl.css',
    'assets/css/admin/forms-list-react.css',
    'assets/css/admin/forms-list-react-rtl.css',
    'assets/css/ai-form-builder.min.css',
    'assets/css/elementor-frontend-forms.css',
    'assets/css/forms-list.min.css',
    'assets/css/frontend-forms.css',
    'assets/css/frontend-subscriptions.min.css',
    'assets/css/registration-forms.css',
    'assets/css/settings-react.css',
    'assets/css/settings-react-rtl.css',
    'assets/css/subscriptions.css',
    'assets/css/subscriptions-rtl.css',
    'assets/css/wpuf-form-builder.css',
];
export const release = [ 'languages/wp-user-frontend.pot' ];

