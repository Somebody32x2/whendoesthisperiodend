import adapter from '@sveltejs/adapter-static';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter(),
        prerender: {
            handleHttpError: "warn"
        }
    },
    preprocess: [vitePreprocess()]
};

config.paths = {base: process.argv.includes('dev') ? '' : process.env.BASE_PATH}

export default config;