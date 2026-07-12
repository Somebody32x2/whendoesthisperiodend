// localStorage-backed reactive preferences (Svelte 5 runes).
import {browser} from "$app/environment";
import type {BarColor} from "$lib/config/colors";
import type {SchoolSummary} from "$lib/config/types";

export interface CustomBar {
    id: string;
    label: string;
    /** datetime-local strings, interpreted in the viewer's timezone */
    start: string;
    end: string;
    color: BarColor;
}

function read<T>(key: string, fallback: T): T {
    if (!browser) return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function write(key: string, value: unknown): void {
    if (!browser) return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage full/blocked — non-fatal */
    }
}

class Prefs {
    /** Selected school id, or "custom", or "" (= auto: first available school) */
    school = $state<string>(read("wdtpe:school", ""));
    /** Cached school list for instant paint / offline */
    schoolListCache = $state<SchoolSummary[]>(read("wdtpe:schools", []));
    /** Per-school overrides of which additional bars show: {schoolId: {barId: boolean}} */
    barPrefs = $state<Record<string, Record<string, boolean>>>(read("wdtpe:barPrefs", {}));
    /** User-defined bars, per context key ("custom" or a school id) */
    customBars = $state<Record<string, CustomBar[]>>(read("wdtpe:customBars", {}));

    setSchool(id: string) {
        this.school = id;
        write("wdtpe:school", id);
    }

    cacheSchools(list: SchoolSummary[]) {
        this.schoolListCache = list;
        write("wdtpe:schools", list);
    }

    isBarEnabled(schoolId: string, barId: string, enabledByDefault: boolean): boolean {
        return this.barPrefs[schoolId]?.[barId] ?? enabledByDefault;
    }

    setBarEnabled(schoolId: string, barId: string, enabled: boolean) {
        this.barPrefs = {
            ...this.barPrefs,
            [schoolId]: {...this.barPrefs[schoolId], [barId]: enabled}
        };
        write("wdtpe:barPrefs", this.barPrefs);
    }

    getCustomBars(key: string): CustomBar[] {
        return this.customBars[key] ?? [];
    }

    setCustomBars(key: string, bars: CustomBar[]) {
        this.customBars = {...this.customBars, [key]: bars};
        write("wdtpe:customBars", this.customBars);
    }
}

export const prefs = new Prefs();
