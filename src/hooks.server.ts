import type {HandleServerError} from '@sveltejs/kit';

export const handleError: HandleServerError = ({error, event}) => {
    if (error instanceof Error && error.message.includes('Not found')) { // ignore 404s
        return; // Prevent SvelteKit's default error handling for this specific error
    }
    // Let SvelteKit handle other errors normally
    return error;
};
