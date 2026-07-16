// "Restore" support for disabled legacy entries: shift every date in an entry
// forward by whole years so its earliest date lands inside the current school year,
// then re-enable it. Weekday drift is expected; the admin UI presents the result
// as a draft to hand-adjust before saving.
import {DateTime} from "luxon";
import type {BarConfig, BreakConfig, SpecialScheduleConfig} from "./types";

function shiftDateStr(value: string, years: number): string {
    // Works for both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm" (luxon clamps Feb 29 etc.)
    const hasTime = value.includes("T");
    const dt = DateTime.fromISO(value).plus({years});
    return hasTime ? dt.toFormat("yyyy-MM-dd'T'HH:mm") : dt.toFormat("yyyy-MM-dd");
}

function collectDates(entry: SpecialScheduleConfig | BreakConfig | BarConfig): string[] {
    if ("days" in entry) return entry.days;
    if ("ranges" in entry) return entry.ranges.flatMap(r => [r.start, r.end]);
    return [entry.start, entry.end];
}

// Whole years to add so the earliest date in the entry is >= schoolYearStart.
export function yearsToShift(entry: SpecialScheduleConfig | BreakConfig | BarConfig, schoolYearStart: string): number {
    const dates = collectDates(entry);
    if (dates.length === 0) return 0;
    const min = dates.reduce((a, b) => (a < b ? a : b)).slice(0, 10);
    let years = 0;
    while (years < 50 && shiftDateStr(min, years) < schoolYearStart) years++;
    return years;
}

export function rederiveEntry<T extends SpecialScheduleConfig | BreakConfig | BarConfig>(
    entry: T,
    schoolYear: { start: string, end: string }
): T {
    const years = yearsToShift(entry, schoolYear.start);
    // JSON round-trip instead of structuredClone: entries are pure JSON data, and this
    // also works on Svelte $state proxies (which structuredClone rejects with DataCloneError)
    const shifted: T = JSON.parse(JSON.stringify(entry));
    if (years > 0) {
        if ("days" in shifted) {
            shifted.days = shifted.days.map(d => shiftDateStr(d, years));
        } else if ("ranges" in shifted) {
            shifted.ranges = shifted.ranges.map(r => ({
                ...r,
                start: shiftDateStr(r.start, years),
                end: shiftDateStr(r.end, years)
            }));
        } else {
            shifted.start = shiftDateStr(shifted.start, years);
            shifted.end = shiftDateStr(shifted.end, years);
        }
    }
    shifted.disabled = false;
    return shifted;
}
