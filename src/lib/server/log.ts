// Append-only admin log, same line format as the parent site's wotd.js:
//   <ISO timestamp> - <action>:<schoolId> - ip:<ip> pwd:<label> - <JSON payload>
// Failures without a session log "no-session" but keep the request IP.
import fs from "node:fs";
import path from "node:path";
import {dataDir, ensureDataDir} from "./data";
import type {Session} from "./auth";

export type LogAction = "LOGIN_OK" | "LOGIN_FAIL" | "SAVE" | "CREATE" | "AUTH_REJECT";

export function appendLog(action: LogAction, schoolId: string, session: Session | null, ip: string, payload: unknown): void {
    ensureDataDir();
    const who = session
        ? `ip:${session.ip} pwd:${session.pwdLabel}`
        : `ip:${ip} no-session`;
    const line = `${new Date().toISOString()} - ${action}:${schoolId} - ${who} - ${JSON.stringify(payload)}\n`;
    fs.appendFile(path.join(dataDir(), "admin.log"), line, (err) => {
        if (err) console.error("Failed to append admin log:", err);
    });
}
