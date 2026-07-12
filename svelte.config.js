import adapter from '@sveltejs/adapter-node';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter(),
        paths: {
            // Serve the whole app under a path prefix (e.g. /whendoesthisperiodend) without
            // any proxy-side prefix stripping.
            base: process.argv.includes('dev') ? '' : (process.env.BASE_PATH ?? '')
        }
    },
    preprocess: [vitePreprocess()]
};

export default config;
