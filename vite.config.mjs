import { defineConfig } from 'vite'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const entries = {
    'frontend-subscriptions': './assets/js/frontend-subscriptions.js',
    // React replaces the Vue admin subscriptions, forms list and AI form
    // builder apps (webpack.admin.config.js).
    'account': './assets/js/account.js',
};

export default defineConfig(() => {
    const entryPoint = process.env.ENTRY;
    const input = entryPoint ? { [entryPoint]: entries[entryPoint] } : entries;

    return {
        build: {
            rollupOptions: {
                input,
                output: {
                    entryFileNames: 'js/[name].min.js',
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name.endsWith('.css')) {
                            return 'css/[name].min.css';
                        }
                        return 'assets/[name]-[hash][extname]';
                    },
                    format: 'iife',
                    name: 'WPUF',
                },
            },
            outDir: './assets',
            emptyOutDir: false,
            sourcemap: true,
            assetsInlineLimit: 0,
            chunkSizeWarningLimit: 1000,
        },
    }
});

