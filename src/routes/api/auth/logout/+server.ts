import {json} from "@sveltejs/kit";
import type {RequestHandler} from "./$types";
import {base} from "$app/paths";
import {destroySession, SESSION_COOKIE} from "$lib/server/auth";

export const POST: RequestHandler = async (event) => {
    destroySession(event.cookies);
    event.cookies.delete(SESSION_COOKIE, {path: base || "/"});
    return json({ok: true});
};
