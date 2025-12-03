import type {HandleServerError} from '@sveltejs/kit';
import {dev} from '$app/environment';

export const handleError: HandleServerError = ({error, event}) => {
    // Always log full error and request so CI / Node logs contain the stack
    console.error('Unhandled server error for', event.url.href);
    console.error(error);

    // In dev you can return the stack to the client; in prod return a safe message
    return {
        message: dev ? error.message : 'Internal Server Error'
        // don't return stack in prod to avoid leaking sensitive info
    };
};