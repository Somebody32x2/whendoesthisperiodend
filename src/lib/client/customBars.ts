// User-defined bars, configured in the settings drawer and stored in localStorage.
// Four kinds, matching the original bar classes:
//   static  - one fixed start/end datetime (e.g. a countdown to a trip)
//   daily   - the same time window every day (e.g. the work day), weekday-filterable
//   periods - a repeating daily list of time blocks (a personal bell schedule), weekday-filterable
//   ranges  - a sequence of datetime ranges (e.g. sports seasons, quarters)
// All times are interpreted in the viewer's local timezone.
import {DateTime} from "luxon";
import type {BarColor} from "$lib/config/colors";
import type {BarSpec} from "$lib/engine/bars";
import {evalRangesBar} from "$lib/engine/bars";
import {nthString} from "$lib/Utils";

export type CustomBarKind = "static" | "daily" | "periods" | "ranges";

export interface CustomTimeRow {
    start: string;
    end: string;
    label?: string;
}

export interface CustomBar {
    id: string;
    label: string;
    color: BarColor;
    kind: CustomBarKind;
    /** static: datetime-local strings */
    start?: string;
    end?: string;
    /** daily + periods: weekdays shown (1=Mon..7=Sun); empty or missing = every day */
    days?: number[];
    /** daily: "HH:mm" */
    startTime?: string;
    endTime?: string;
    /** periods: "HH:mm" rows */
    periods?: CustomTimeRow[];
    /** ranges: datetime-local rows */
    ranges?: CustomTimeRow[];
}

/** Older saved bars predate `kind`; treat them as static. */
export function normalizeCustomBar(bar: Partial<CustomBar> & { id: string }): CustomBar {
    return {
        label: "Custom Bar",
        color: "indigo",
        kind: "static",
        ...bar
    } as CustomBar;
}

export interface CustomBarEval {
    /** null when the bar has nothing to show right now (wrong weekday, invalid fields) */
    spec: BarSpec | null;
    /** next instant the spec changes, if any */
    nextBoundary: DateTime | null;
}

function showsToday(bar: CustomBar, now: DateTime): boolean {
    return !bar.days || bar.days.length === 0 || bar.days.includes(now.weekday);
}

function anchor(now: DateTime, time: string): DateTime | null {
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return now.startOf("day").set({hour: h, minute: m});
}

const nextMidnight = (now: DateTime) => now.startOf("day").plus({days: 1});

function evalStatic(bar: CustomBar): CustomBarEval {
    const start = DateTime.fromISO(bar.start ?? "");
    const end = DateTime.fromISO(bar.end ?? "");
    if (!start.isValid || !end.isValid || start >= end) return {spec: null, nextBoundary: null};
    return {
        spec: {
            id: `custom-${bar.id}`, label: bar.label || "Custom Bar", color: bar.color,
            start, end, showDays: true, showEndpoints: false
        },
        nextBoundary: null
    };
}

function evalDaily(bar: CustomBar, now: DateTime): CustomBarEval {
    const boundary = nextMidnight(now);
    if (!showsToday(bar, now)) return {spec: null, nextBoundary: boundary};
    const start = anchor(now, bar.startTime ?? "");
    const end = anchor(now, bar.endTime ?? "");
    if (!start || !end || start >= end) return {spec: null, nextBoundary: boundary};
    return {
        spec: {
            id: `custom-${bar.id}`, label: bar.label || "Custom Bar", color: bar.color,
            start, end, showDays: false, showEndpoints: true
        },
        nextBoundary: boundary
    };
}

// Same behavior as the original PeriodsProgressBar: before the first period the bar runs
// from yesterday's last end, between periods it counts down to the next one, and after
// the last it runs to tomorrow's first.
function evalPeriods(bar: CustomBar, now: DateTime): CustomBarEval {
    const midnight = nextMidnight(now);
    if (!showsToday(bar, now)) return {spec: null, nextBoundary: midnight};

    const rows = (bar.periods ?? [])
        .map((row, i) => ({
            start: anchor(now, row.start),
            end: anchor(now, row.end),
            label: row.label || `${nthString(i)} Period`
        }))
        .filter((r): r is { start: DateTime, end: DateTime, label: string } =>
            !!r.start && !!r.end && r.start < r.end)
        .sort((a, b) => a.start.toMillis() - b.start.toMillis());
    if (rows.length === 0) return {spec: null, nextBoundary: midnight};

    const common = {id: `custom-${bar.id}`, color: bar.color, showDays: false, showEndpoints: true};
    const first = rows[0];
    const last = rows[rows.length - 1];

    const pick = (): { spec: BarSpec, boundary: DateTime | null } => {
        if (now < first.start) {
            return {
                spec: {...common, label: `Time Until ${first.label}`, start: last.end.minus({days: 1}), end: first.start},
                boundary: first.start
            };
        }
        for (let i = 0; i < rows.length; i++) {
            if (now >= rows[i].start && now < rows[i].end) {
                return {spec: {...common, label: rows[i].label, start: rows[i].start, end: rows[i].end}, boundary: rows[i].end};
            }
            if (i < rows.length - 1 && now >= rows[i].end && now < rows[i + 1].start) {
                return {
                    spec: {...common, label: `Time Until ${rows[i + 1].label}`, start: rows[i].end, end: rows[i + 1].start},
                    boundary: rows[i + 1].start
                };
            }
        }
        return {
            spec: {...common, label: `Time Until ${first.label}`, start: last.end, end: first.start.plus({days: 1})},
            boundary: null
        };
    };
    const {spec, boundary} = pick();
    return {spec, nextBoundary: boundary && boundary < midnight ? boundary : midnight};
}

function evalRanges(bar: CustomBar, now: DateTime): CustomBarEval {
    const ranges = (bar.ranges ?? []).filter(r =>
        DateTime.fromISO(r.start).isValid && DateTime.fromISO(r.end).isValid && r.start < r.end);
    if (ranges.length === 0) return {spec: null, nextBoundary: null};
    const {spec, nextBoundary} = evalRangesBar({
        kind: "ranges",
        id: `custom-${bar.id}`,
        eachRangeLabel: bar.label || "Range",
        ranges,
        color: bar.color,
        showDays: true,
        showEndpoints: false,
        enabledByDefault: true,
        disabled: false
    }, undefined, now);
    return {spec, nextBoundary};
}

export function evalCustomBar(barIn: Partial<CustomBar> & { id: string }, now: DateTime): CustomBarEval {
    const bar = normalizeCustomBar(barIn);
    switch (bar.kind) {
        case "daily":
            return evalDaily(bar, now);
        case "periods":
            return evalPeriods(bar, now);
        case "ranges":
            return evalRanges(bar, now);
        default:
            return evalStatic(bar);
    }
}
