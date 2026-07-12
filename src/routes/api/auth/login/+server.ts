import {json} from "@sveltejs/kit";
import type {RequestHandler} from "./$types";
import {base} from "$app/paths";
import {
    checkPassword,
    COOKIE_MAX_AGE_S,
    createSession,
    recordFailure,
    SESSION_COOKIE,
    throttled
} from "$lib/server/auth";
import {appendLog} from "$lib/server/log";

export const POST: RequestHandler = async (event) => {
    let ip = "unknown";
    try {
        ip = event.getClientAddress();
    } catch { /* not available in some contexts */
    }

    if (throttled(ip)) {
        return json({ok: false, error: "Too many failed attempts — try again later."}, {status: 429});
    }

    const body = await event.request.json().catch(() => null);
    const school = typeof body?.school === "string" ? body.school.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!school || !password) {
        return json({ok: false, error: "school and password are required"}, {status: 400});
    }

    const scope = checkPassword(school, password);
    if (!scope) {
        recordFailure(ip);
        // Log the attempt without recording the full guessed password
        appendLog("LOGIN_FAIL", school, null, ip, {school, pwdHint: password.slice(0, 3)});
        return json({ok: false, error: "Incorrect password."}, {status: 401});
    }

    const session = createSession(scope, ip, scope);
    event.cookies.set(SESSION_COOKIE, session.token, {
        path: base || "/",
        httpOnly: true,
        sameSite: "lax",
        secure: false, // served over plain http behind the proxy on some hosts
        maxAge: COOKIE_MAX_AGE_S
    });
    appendLog("LOGIN_OK", school, session, ip, {scope});
    return json({ok: true, scope});
};
