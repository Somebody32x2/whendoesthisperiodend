// Auth in the spirit of the parent site's pwdProtect.js: plaintext passwords file,
// random-token sessions, cookie transport. Sessions are file-backed so a redeploy
// doesn't log admins out. passwords.txt lines: "<schoolId>=<password>", with
// "*=<globalKey>" granting access to every school (and school creation).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {Cookies} from "@sveltejs/kit";
import {dataDir, ensureDataDir} from "./data";

export const SESSION_COOKIE = "wdtpe_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24h server-side session life
export const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 5; // cookie may outlive the session

export interface Session {
    token: string;
    /** School id this session may edit, or "*" for all */
    scope: string;
    created: number;
    expires: number;
    ip: string;
    /** Which password line granted access (school id or "*"); logged, never the password itself */
    pwdLabel: string;
}

function sessionsPath(): string {
    return path.join(dataDir(), "sessions.json");
}

let sessions: Session[] | null = null;

function loadSessions(): Session[] {
    if (sessions) return sessions;
    ensureDataDir();
    try {
        sessions = JSON.parse(fs.readFileSync(sessionsPath(), "utf-8"));
    } catch {
        sessions = [];
    }
    return sessions!;
}

function persistSessions(): void {
    fs.writeFileSync(sessionsPath(), JSON.stringify(sessions ?? [], null, 2), "utf-8");
}

function prune(): void {
    const now = Date.now();
    const list = loadSessions();
    const kept = list.filter(s => s.expires > now);
    if (kept.length !== list.length) {
        sessions = kept;
        persistSessions();
    }
}

// Parsed fresh on every login so passwords rotate without a restart.
function readPasswords(): Map<string, string[]> {
    ensureDataDir();
    const map = new Map<string, string[]>();
    let raw = "";
    try {
        raw = fs.readFileSync(path.join(dataDir(), "passwords.txt"), "utf-8");
    } catch {
        return map;
    }
    for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq <= 0) continue;
        const domain = trimmed.slice(0, eq).trim();
        const password = trimmed.slice(eq + 1).trim();
        if (!map.has(domain)) map.set(domain, []);
        map.get(domain)!.push(password);
    }
    return map;
}

function matches(candidate: string, stored: string[] | undefined): boolean {
    if (!stored) return false;
    const c = candidate.trim().toLowerCase();
    return stored.some(p => p.toLowerCase() === c);
}

/** Check a password for a school. Returns the granted scope ("<id>" or "*"), or null. */
export function checkPassword(school: string, password: string): string | null {
    const passwords = readPasswords();
    if (matches(password, passwords.get(school))) return school;
    if (matches(password, passwords.get("*"))) return "*";
    return null;
}

export function createSession(scope: string, ip: string, pwdLabel: string): Session {
    prune();
    const session: Session = {
        token: crypto.randomBytes(24).toString("hex"),
        scope,
        created: Date.now(),
        expires: Date.now() + SESSION_TTL_MS,
        ip,
        pwdLabel
    };
    loadSessions().push(session);
    persistSessions();
    return session;
}

export function getSession(cookies: Cookies): Session | null {
    const token = cookies.get(SESSION_COOKIE);
    if (!token) return null;
    prune();
    return loadSessions().find(s => s.token === token) ?? null;
}

export function destroySession(cookies: Cookies): void {
    const token = cookies.get(SESSION_COOKIE);
    if (!token) return;
    sessions = loadSessions().filter(s => s.token !== token);
    persistSessions();
}

export function canEdit(session: Session | null, schoolId: string): boolean {
    return !!session && (session.scope === "*" || session.scope === schoolId);
}

// Light per-IP login throttle, proportionate to the plaintext-file threat model.
const failures = new Map<string, { count: number, since: number }>();
const THROTTLE_WINDOW_MS = 10 * 60 * 1000;
const THROTTLE_MAX_FAILURES = 10;

export function throttled(ip: string): boolean {
    const entry = failures.get(ip);
    if (!entry) return false;
    if (Date.now() - entry.since > THROTTLE_WINDOW_MS) {
        failures.delete(ip);
        return false;
    }
    return entry.count >= THROTTLE_MAX_FAILURES;
}

export function recordFailure(ip: string): void {
    const entry = failures.get(ip);
    if (!entry || Date.now() - entry.since > THROTTLE_WINDOW_MS) {
        failures.set(ip, {count: 1, since: Date.now()});
    } else {
        entry.count++;
    }
}
