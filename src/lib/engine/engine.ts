// The schedule engine. Everything here is a pure function of (ResolvedConfig, DateTime):
// no mutation of config data, no module state, no DateTime.now(). The UI recomputes a
// Snapshot whenever `now` passes snapshot.validUntil; between snapshots only percentages
// move (see metrics.ts).
import {DateTime} from "luxon";
import type {ResolvedConfig} from "./resolve";
import {type BarSpec, evalRangesBar, evalStaticBar} from "./bars";

export interface AnchoredPeriod {
    start: DateTime;
    end: DateTime;
    label: string;
}

export type DayInfo =
    | { kind: "school", label: string, endWithWeekend: boolean, periods: AnchoredPeriod[] }
    | { kind: "break", label: string }
    | { kind: "weekend" };

export type SnapshotState = "in-period" | "passing" | "before-school" | "after-school" | "break" | "weekend";

export interface Snapshot {
    state: SnapshotState;
    /** Ordered for display: period/passing, break, day, week, then additional config bars */
    bars: BarSpec[];
    /** Earliest instant at which this snapshot becomes stale (always > now, <= next midnight) */
    validUntil: DateTime;
}

function timeParts(t: string): { hour: number, minute: number } {
    const [hour, minute] = t.split(":").map(Number);
    return {hour, minute};
}

/** Anchor an "HH:mm" time onto a specific calendar day (in that day's zone). */
function anchor(date: DateTime, time: string): DateTime {
    return date.startOf("day").set(timeParts(time));
}

function anchorPeriods(date: DateTime, periods: { start: string, end: string, label: string }[]): AnchoredPeriod[] {
    return periods.map(p => ({start: anchor(date, p.start), end: anchor(date, p.end), label: p.label}));
}

/**
 * Classify a calendar day. Always returns freshly-built objects; config data is never
 * touched (this is what fixes the old findSchedule mutation/aliasing bugs).
 * Priority: special schedule -> break (covering noon of the day) -> normal schedule -> weekend.
 */
export function getDayInfo(rc: ResolvedConfig, dateIn: DateTime): DayInfo {
    const date = dateIn.setZone(rc.zone).startOf("day");
    const iso = date.toISODate()!;

    const special = rc.specialByDate.get(iso);
    if (special) {
        const periods = anchorPeriods(date, special.schedule.periods);
        const labelRow = special.schedule.specificDayLabels?.[special.dayIndex];
        if (labelRow) {
            for (const [i, label] of labelRow.entries()) {
                if (periods[i]) periods[i] = {...periods[i], label};
            }
        }
        return {kind: "school", label: String(special.schedule.label), endWithWeekend: false, periods};
    }

    // Breaks are inclusive date ranges; a day is off iff it falls inside one
    for (const brk of rc.enabledBreaks) {
        if (brk.start <= iso && iso <= brk.end) {
            return {kind: "break", label: brk.label};
        }
    }

    const normal = rc.normalByWeekday.get(date.weekday);
    if (normal) {
        return {
            kind: "school",
            label: normal.label,
            endWithWeekend: normal.endWithWeekend,
            periods: anchorPeriods(date, normal.periods)
        };
    }

    return {kind: "weekend"};
}

export interface SchoolDay {
    date: DateTime;
    info: Extract<DayInfo, { kind: "school" }>;
}

/** Walk day-by-day (excluding `from` itself) to the nearest school day in direction `dir`. */
export function findSchoolDay(rc: ResolvedConfig, from: DateTime, dir: 1 | -1, maxDays = 400): SchoolDay | null {
    let date = from.setZone(rc.zone).startOf("day");
    for (let i = 0; i < maxDays; i++) {
        date = date.plus({days: dir});
        const info = getDayInfo(rc, date);
        if (info.kind === "school") return {date, info};
    }
    return null;
}

/** The instant a school day's "school time" ends (weekend start if the schedule ends with the weekend). */
function schoolDayEnd(rc: ResolvedConfig, day: SchoolDay): DateTime {
    if (day.info.endWithWeekend && day.date.weekday === rc.cfg.weekend.startDay) {
        return anchor(day.date, rc.cfg.weekend.startTime);
    }
    return day.info.periods[day.info.periods.length - 1].end;
}

function backToWeekday(date: DateTime, weekday: number): DateTime {
    let d = date;
    while (d.weekday !== weekday) d = d.minus({days: 1});
    return d;
}

function forwardToWeekday(date: DateTime, weekday: number): DateTime {
    let d = date;
    while (d.weekday !== weekday) d = d.plus({days: 1});
    return d;
}

/**
 * Bounds of the school week containing `date`, or null if no school happens that week.
 * The calendar window runs from the weekend's end weekday to its start weekday; every
 * day in the window is classified, so mid-week breaks (Veterans Day, etc.) are holes in
 * the week rather than terminators, and .plus({days}) math is immune to month boundaries.
 */
export function getWeekBounds(rc: ResolvedConfig, dateIn: DateTime): { start: DateTime, end: DateTime } | null {
    const date = dateIn.setZone(rc.zone).startOf("day");
    const windowStart = backToWeekday(date, rc.cfg.weekend.endDay);
    const windowEnd = forwardToWeekday(date, rc.cfg.weekend.startDay);

    let first: SchoolDay | null = null;
    let last: SchoolDay | null = null;
    for (let d = windowStart; d <= windowEnd; d = d.plus({days: 1})) {
        const info = getDayInfo(rc, d);
        if (info.kind === "school") {
            if (!first) first = {date: d, info};
            last = {date: d, info};
        }
    }
    if (!first || !last) return null;
    return {
        start: first.info.periods[0].start,
        end: last.info.periods[last.info.periods.length - 1].end
    };
}

/** The weekend interval around `now` per the weekend config (used when no school day bounds a gap). */
function weekendInterval(rc: ResolvedConfig, now: DateTime): { start: DateTime, end: DateTime } {
    const start = anchor(backToWeekday(now.startOf("day"), rc.cfg.weekend.startDay), rc.cfg.weekend.startTime);
    const end = anchor(forwardToWeekday(now.startOf("day"), rc.cfg.weekend.endDay), rc.cfg.weekend.endTime);
    return {start, end};
}

/** Label for an off-school gap: the break covering most of its days, else Weekend, else Until Tomorrow. */
function gapLabel(rc: ResolvedConfig, gapStart: DateTime, gapEnd: DateTime, thisWeekend: boolean): string {
    // Days strictly inside the gap: the gap's endpoints sit on school days, so only
    // the dates between them can belong to a break.
    const firstOff = gapStart.startOf("day").plus({days: 1});
    const lastOff = gapEnd.startOf("day").minus({days: 1});
    let best: { label: string, overlapDays: number } | null = null;
    for (const brk of rc.enabledBreaks) {
        const from = brk.start > firstOff.toISODate()! ? brk.start : firstOff.toISODate()!;
        const to = brk.end < lastOff.toISODate()! ? brk.end : lastOff.toISODate()!;
        if (from > to) continue;
        const overlapDays = DateTime.fromISO(to).diff(DateTime.fromISO(from), "days").days + 1;
        if (!best || overlapDays > best.overlapDays) best = {label: brk.label, overlapDays};
    }
    if (best) return best.label;

    for (let d = firstOff; d <= lastOff; d = d.plus({days: 1})) {
        if (getDayInfo(rc, d).kind === "weekend") return thisWeekend ? "this Weekend" : "Weekend";
    }
    return "Until Tomorrow";
}

/** Compute the full display state for `now`. */
export function computeSnapshot(rc: ResolvedConfig, nowIn: DateTime): Snapshot {
    const now = nowIn.setZone(rc.zone);
    const today = now.startOf("day");
    const info = getDayInfo(rc, today);
    const colors = rc.cfg.colors;

    const bars: BarSpec[] = [];
    // Snapshot always rolls over at midnight so day-level bars swap without a page reload.
    const boundaries: DateTime[] = [today.plus({days: 1})];
    let state: SnapshotState;

    const makeBreakBar = (label: string, start: DateTime, end: DateTime, showDays: boolean): BarSpec => ({
        id: "break", label, color: colors.break, start, end, showDays, showEndpoints: false
    });

    if (info.kind === "school") {
        const periods = info.periods;
        const first = periods[0].start;
        const last = periods[periods.length - 1].end;
        const todaySchoolDay: SchoolDay = {date: today, info};

        if (now < first) {
            state = "before-school";
            const prev = findSchoolDay(rc, today, -1);
            const gapStart = prev ? schoolDayEnd(rc, prev) : today;
            bars.push(makeBreakBar(gapLabel(rc, gapStart, first, prev?.info.endWithWeekend ?? false), gapStart, first, false));
            boundaries.push(first);
        } else if (now >= last) {
            state = "after-school";
            const gapStart = schoolDayEnd(rc, todaySchoolDay);
            const next = findSchoolDay(rc, today, 1);
            if (next) {
                const gapEnd = next.info.periods[0].start;
                bars.push(makeBreakBar(gapLabel(rc, gapStart, gapEnd, info.endWithWeekend), gapStart, gapEnd, false));
                boundaries.push(gapEnd);
            } else {
                const wk = weekendInterval(rc, now);
                bars.push(makeBreakBar("Weekend", gapStart < wk.start ? gapStart : wk.start, wk.end, false));
            }
        } else {
            // Within school hours: the last period whose start we've passed
            let idx = 0;
            for (let i = periods.length - 1; i >= 0; i--) {
                if (now >= periods[i].start) {
                    idx = i;
                    break;
                }
            }
            if (now < periods[idx].end) {
                state = "in-period";
                bars.push({
                    id: "period", label: periods[idx].label, color: colors.period,
                    start: periods[idx].start, end: periods[idx].end, showDays: false, showEndpoints: true
                });
                boundaries.push(periods[idx].end);
            } else {
                state = "passing";
                const next = periods[idx + 1];
                bars.push({
                    id: "period", label: `Until ${next.label}`, color: colors.passing,
                    start: periods[idx].end, end: next.start, showDays: false, showEndpoints: true
                });
                boundaries.push(next.start);
            }
        }

        bars.push({
            id: "day", label: "Today", color: colors.day,
            start: first, end: last, showDays: false, showEndpoints: true
        });

        const week = getWeekBounds(rc, today);
        if (week) {
            bars.push({
                id: "week", label: "this Week", color: colors.week,
                start: week.start, end: week.end, showDays: false, showEndpoints: false
            });
        }
    } else {
        state = info.kind === "break" ? "break" : "weekend";
        const prev = findSchoolDay(rc, today, -1);
        const next = findSchoolDay(rc, today, 1);
        const fallback = weekendInterval(rc, now);
        const gapStart = prev ? schoolDayEnd(rc, prev) : fallback.start;
        const gapEnd = next ? next.info.periods[0].start : fallback.end;
        const label = info.kind === "break"
            ? gapLabel(rc, gapStart, gapEnd, false)
            : gapLabel(rc, gapStart, gapEnd, prev?.info.endWithWeekend ?? false);
        bars.push(makeBreakBar(label, gapStart, gapEnd, true));
        if (next) boundaries.push(gapEnd);
    }

    // Additional configured bars (year, grad, quarters, ...). The UI decides which to show.
    for (const bar of rc.enabledBars) {
        if (bar.kind === "static") {
            bars.push(evalStaticBar(bar, rc.zone));
        } else {
            const {spec, nextBoundary} = evalRangesBar(bar, rc.zone, now);
            bars.push(spec);
            if (nextBoundary) boundaries.push(nextBoundary);
        }
    }

    let validUntil = boundaries[0];
    for (const b of boundaries) {
        if (b > now && (validUntil <= now || b < validUntil)) validUntil = b;
    }

    return {state, bars, validUntil};
}
