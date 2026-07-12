// Client-side API helpers. Config responses are validated against the shared schema
// before use — a bad save can never brick the main page.
import {base} from "$app/paths";
import {validateSchoolConfig} from "$lib/config/schema";
import type {SchoolConfig, SchoolSummary} from "$lib/config/types";

export async function fetchSchools(fetchFn: typeof fetch = fetch): Promise<SchoolSummary[]> {
    const res = await fetchFn(`${base}/api/schools`, {cache: "no-store"});
    if (!res.ok) throw new Error(`school list: HTTP ${res.status}`);
    const list = await res.json();
    if (!Array.isArray(list)) throw new Error("school list: bad response");
    return list.filter(s => typeof s?.id === "string" && typeof s?.name === "string");
}

export async function fetchSchoolConfig(id: string, fetchFn: typeof fetch = fetch): Promise<SchoolConfig> {
    const res = await fetchFn(`${base}/api/schools/${encodeURIComponent(id)}`, {cache: "no-store"});
    if (!res.ok) throw new Error(`school config "${id}": HTTP ${res.status}`);
    const result = validateSchoolConfig(await res.json());
    if (!result.ok) throw new Error(`school config "${id}" failed validation:\n${result.errors.join("\n")}`);
    return result.config;
}
