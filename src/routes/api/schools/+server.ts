import {json} from "@sveltejs/kit";
import type {RequestHandler} from "./$types";
import {listSchools, schoolExists, writeSchool} from "$lib/server/data";
import {getSession} from "$lib/server/auth";
import {appendLog} from "$lib/server/log";
import {SCHOOL_ID_RE, validateSchoolConfig} from "$lib/config/schema";
import exampleSchool from "../../../../static/example-school.json";

export const GET: RequestHandler = async () => {
    return json(listSchools(), {headers: {"cache-control": "no-store"}});
};

// Create a new school; global (*) scope only.
export const POST: RequestHandler = async (event) => {
    let ip = "unknown";
    try {
        ip = event.getClientAddress();
    } catch { /* ignore */
    }
    const session = getSession(event.cookies);
    if (!session || session.scope !== "*") {
        appendLog("AUTH_REJECT", "(create)", session, ip, {reason: "create requires global key"});
        return json({ok: false, error: "Creating schools requires the global key."}, {status: session ? 403 : 401});
    }

    const body = await event.request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!SCHOOL_ID_RE.test(id)) {
        return json({ok: false, error: "School id must be 1-32 letters, digits or dashes."}, {status: 400});
    }
    if (!name) {
        return json({ok: false, error: "School name is required."}, {status: 400});
    }
    if (schoolExists(id)) {
        return json({ok: false, error: `School "${id}" already exists.`}, {status: 409});
    }

    // Start from the provided config if any, else from the bundled example template
    const candidate = body?.config ?? structuredClone(exampleSchool);
    candidate.id = id;
    candidate.name = name;
    const result = validateSchoolConfig(candidate);
    if (!result.ok) {
        return json({ok: false, errors: result.errors}, {status: 400});
    }

    writeSchool(id, result.config);
    appendLog("CREATE", id, session, ip, {id, name});
    return json({ok: true, config: result.config}, {status: 201});
};
