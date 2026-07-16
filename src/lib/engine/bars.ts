// Bar evaluation: turns bar configs into plain BarSpec data for a given `now`.
// Replaces the old StaticProgressBar/RangesProgressBar classes with pure functions.
import {DateTime} from "luxon";
import type {BarColor} from "$lib/config/colors";
import type {RangesBarConfig, StaticBarConfig} from "$lib/config/types";
import {nthString} from "$lib/Utils";

// Plain, immutable description of one rendered progress bar.
export interface BarSpec {
    id: string;
    label: string;
    color: BarColor;
    start: DateTime;
    end: DateTime;
    showDays: boolean;
    showEndpoints: boolean;
}

export function parseLocal(value: string, zone?: string): DateTime {
    return DateTime.fromISO(value, {zone});
}

export function evalStaticBar(bar: StaticBarConfig, zone: string): BarSpec {
    return {
        id: bar.id,
        label: bar.label,
        color: bar.color,
        start: parseLocal(bar.start, zone),
        end: parseLocal(bar.end, zone),
        showDays: bar.showDays,
        showEndpoints: bar.showEndpoints
    };
}

function rangeLabel(bar: RangesBarConfig, i: number): string {
    return bar.ranges[i].label || `${nthString(i)} ${bar.eachRangeLabel}`;
}

// Picks the sub-range (or gap between ranges) that `now` falls in.
// nextBoundary is the next instant at which this bar's spec changes (null once past the last range).
export function evalRangesBar(bar: RangesBarConfig, zone: string | undefined, now: DateTime): { spec: BarSpec, nextBoundary: DateTime | null } {
    const ranges = bar.ranges.map(r => ({
        start: parseLocal(r.start, zone),
        end: parseLocal(r.end, zone)
    }));
    const common = {id: bar.id, color: bar.color, showDays: bar.showDays, showEndpoints: bar.showEndpoints};

    // Before the first range: show the first range (negative percent counts down to it)
    if (now < ranges[0].start) {
        return {
            spec: {...common, label: rangeLabel(bar, 0), start: ranges[0].start, end: ranges[0].end},
            nextBoundary: ranges[0].start
        };
    }
    for (let i = 0; i < ranges.length; i++) {
        if (now >= ranges[i].start && now < ranges[i].end) {
            return {
                spec: {...common, label: rangeLabel(bar, i), start: ranges[i].start, end: ranges[i].end},
                nextBoundary: ranges[i].end
            };
        }
        if (i < ranges.length - 1 && now >= ranges[i].end && now < ranges[i + 1].start) {
            return {
                spec: {
                    ...common,
                    label: `Time Until ${rangeLabel(bar, i + 1)}`,
                    start: ranges[i].end,
                    end: ranges[i + 1].start
                },
                nextBoundary: ranges[i + 1].start
            };
        }
    }
    // After the last range: keep showing it (percent parks past 100)
    const last = ranges[ranges.length - 1];
    return {
        spec: {...common, label: rangeLabel(bar, ranges.length - 1), start: last.start, end: last.end},
        nextBoundary: null
    };
}
