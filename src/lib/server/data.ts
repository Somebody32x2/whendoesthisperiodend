// School-config storage on the data dir (a host bind mount in production).
// Layout: $DATA_DIR/schools/<id>.json, passwords.txt, sessions.json, admin.log, backups/
import fs from "node:fs";
import path from "node:path";
import {env} from "$env/dynamic/private";
import {SCHOOL_ID_RE, type SchoolConfig} from "$lib/config/schema";
import type {SchoolSummary} from "$lib/config/types";
import exampleSchool from "../../../static/example-school.json";

export function dataDir(): string {
    return env.DATA_DIR || "./data";
}

export function schoolsDir(): string {
    return path.join(dataDir(), "schools");
}

let seeded = false;

// First-boot seeding: create the directory layout, and if a SEED_GLOBAL_KEY env is set
// and no passwords file exists yet, write one granting that key global (*) access along
// with the example school so the fresh instance is immediately usable.
export function ensureDataDir(): void {
    if (seeded) return;
    seeded = true;
    fs.mkdirSync(schoolsDir(), {recursive: true});
    fs.mkdirSync(path.join(dataDir(), "backups"), {recursive: true});
    const pwdPath = path.join(dataDir(), "passwords.txt");
    if (!fs.existsSync(pwdPath) && env.SEED_GLOBAL_KEY) {
        fs.writeFileSync(pwdPath, `*=${env.SEED_GLOBAL_KEY}\n`, "utf-8");
    }
    if (fs.readdirSync(schoolsDir()).length === 0) {
        fs.writeFileSync(
            path.join(schoolsDir(), `${exampleSchool.id}.json`),
            JSON.stringify(exampleSchool, null, 2), "utf-8");
    }
}

function schoolPath(id: string): string {
    if (!SCHOOL_ID_RE.test(id)) throw new Error(`invalid school id: ${id}`);
    return path.join(schoolsDir(), `${id}.json`);
}

export function listSchools(): SchoolSummary[] {
    ensureDataDir();
    const out: SchoolSummary[] = [];
    for (const file of fs.readdirSync(schoolsDir()).sort()) {
        if (!file.endsWith(".json")) continue;
        try {
            const parsed = JSON.parse(fs.readFileSync(path.join(schoolsDir(), file), "utf-8"));
            const id = file.slice(0, -5);
            out.push({id, name: typeof parsed.name === "string" ? parsed.name : id});
        } catch {
            // Skip unreadable/corrupt files rather than failing the whole list
        }
    }
    return out;
}

export function schoolExists(id: string): boolean {
    ensureDataDir();
    return SCHOOL_ID_RE.test(id) && fs.existsSync(schoolPath(id));
}

export function readSchool(id: string): SchoolConfig | null {
    ensureDataDir();
    try {
        return JSON.parse(fs.readFileSync(schoolPath(id), "utf-8"));
    } catch {
        return null;
    }
}

// Backup the previous version, then write atomically (tmp file + rename).
export function writeSchool(id: string, config: SchoolConfig): void {
    ensureDataDir();
    const target = schoolPath(id);
    if (fs.existsSync(target)) {
        const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
        fs.copyFileSync(target, path.join(dataDir(), "backups", `${id}-${stamp}.json`));
    }
    const tmp = `${target}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(config, null, 2), "utf-8");
    fs.renameSync(tmp, target);
}
