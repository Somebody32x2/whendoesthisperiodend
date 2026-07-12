import {json} from "@sveltejs/kit";
import type {RequestHandler} from "./$types";
import {getSession} from "$lib/server/auth";

export const GET: RequestHandler = async (event) => {
    const session = getSession(event.cookies);
    return json(
        {authenticated: !!session, scope: session?.scope ?? null},
        {headers: {"cache-control": "no-store"}}
    );
};
