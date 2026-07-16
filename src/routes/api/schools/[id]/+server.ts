import {json} from "@sveltejs/kit";
import type {RequestHandler} from "./$types";
import {readSchool, schoolExists, writeSchool} from "$lib/server/data";
import {canEdit, getSession} from "$lib/server/auth";
import {appendLog} from "$lib/server/log";
import {validateSchoolConfig} from "$lib/config/schema";

export const GET: RequestHandler = async ({params}) => {
    const config = readSchool(params.id);
    if (!config) return json({error: "school not found"}, {status: 404});
    return json(config, {headers: {"cache-control": "no-store"}});
};

// Save a school's full config; requires a session scoped to this school (or global).
export const PUT: RequestHandler = async (event) => {
    const id = event.params.id;
    let ip = "unknown";
    try {
        ip = event.getClientAddress();
    } catch { /* ignore */
    }

    const session = getSession(event.cookies);
    if (!canEdit(session, id)) {
        appendLog("AUTH_REJECT", id, session, ip, {reason: session ? "wrong scope" : "no session"});
        return json({ok: false, error: "Not authorized for this school."}, {status: session ? 403 : 401});
    }

    if (!schoolExists(id)) {
        return json({ok: false, error: "school not found"}, {status: 404});
    }

    const body = await event.request.json().catch(() => null);
    if (!body) return json({ok: false, error: "invalid JSON body"}, {status: 400});

    // Server-side validation with the SAME schema the client uses
    const result = validateSchoolConfig(body);
    if (!result.ok) {
        return json({ok: false, errors: result.errors}, {status: 400});
    }
    if (result.config.id !== id) {
        return json({ok: false, error: `config id "${result.config.id}" does not match school "${id}"`}, {status: 400});
    }

    writeSchool(id, result.config);
    appendLog("SAVE", id, session, ip, result.config);
    return json({ok: true});
};
