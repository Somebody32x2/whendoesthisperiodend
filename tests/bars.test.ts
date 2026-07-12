import {describe, it, expect} from "vitest";
import {DateTime} from "luxon";
import {evalStaticBar, evalRangesBar} from "$lib/engine/bars";
import {barMetrics} from "$lib/engine/metrics";
import {nthString} from "$lib/Utils";
import {validateSchoolConfig} from "$lib/config/schema";
import type {RangesBarConfig, StaticBarConfig} from "$lib/config/types";
import fixture from "../static/example-school.json";

const ZONE = "America/New_York";

function dt(iso: string): DateTime {
    return DateTime.fromISO(iso, {zone: ZONE});
}

function loadConfig() {
    const result = validateSchoolConfig(fixture);
    if (!result.ok) throw new Error("fixture failed to validate: " + result.errors.join(", "));
    return result.config;
}

describe("evalStaticBar", () => {
    const bar: StaticBarConfig = {
        kind: "static",
        id: "test",
        label: "Test Bar",
        start: "2026-01-01T00:00",
        end: "2026-01-02T00:00",
        color: "blue",
        showDays: true,
        showEndpoints: false,
        enabledByDefault: true,
        disabled: false
    };

    it("returns the correct start/end DateTimes in the given zone", () => {
        const spec = evalStaticBar(bar, ZONE);
        expect(spec.start.equals(dt("2026-01-01T00:00"))).toBe(true);
        expect(spec.end.equals(dt("2026-01-02T00:00"))).toBe(true);
        expect(spec.start.zoneName).toBe(ZONE);
        expect(spec.label).toBe("Test Bar");
        expect(spec.id).toBe("test");
    });
});

describe("barMetrics", () => {
    const start = dt("2026-01-01T00:00");
    const end = dt("2026-01-02T00:00");
    const bar = {
        id: "test", label: "Test", color: "blue" as const,
        start, end, showDays: true, showEndpoints: false
    };

    it("percentDone is 50 at the midpoint", () => {
        const midpoint = start.plus({hours: 12});
        const metrics = barMetrics(bar, midpoint);
        expect(metrics.percentDone).toBeCloseTo(50, 5);
    });

    it("timeLeft is positive before the end and negative after it", () => {
        const before = start.plus({hours: 1});
        const after = end.plus({hours: 1});
        expect(barMetrics(bar, before).timeLeft.as("milliseconds")).toBeGreaterThan(0);
        expect(barMetrics(bar, after).timeLeft.as("milliseconds")).toBeLessThan(0);
    });
});

describe("evalRangesBar (semester bar from fixture)", () => {
    const cfg = loadConfig();
    const bar = cfg.bars.find(b => b.id === "semester") as RangesBarConfig;

    it("exists as a ranges bar", () => {
        expect(bar).toBeDefined();
        expect(bar.kind).toBe("ranges");
    });

    it("before the first range: shows range 1, nextBoundary is range 1's start", () => {
        const {spec, nextBoundary} = evalRangesBar(bar, ZONE, dt("2026-08-01T00:00"));
        expect(spec.label).toBe("1st Semester");
        expect(nextBoundary?.equals(dt("2026-08-17T08:00"))).toBe(true);
    });

    it("inside the first range: label '1st Semester', nextBoundary is range 1's end", () => {
        const {spec, nextBoundary} = evalRangesBar(bar, ZONE, dt("2026-09-01T00:00"));
        expect(spec.label).toBe("1st Semester");
        expect(nextBoundary?.equals(dt("2026-12-18T13:00"))).toBe(true);
    });

    it("in the winter-break gap: label 'Time Until 2nd Semester', nextBoundary is range 2's start", () => {
        const {spec, nextBoundary} = evalRangesBar(bar, ZONE, dt("2026-12-25T00:00"));
        expect(spec.label).toBe("Time Until 2nd Semester");
        expect(nextBoundary?.equals(dt("2027-01-04T08:00"))).toBe(true);
    });

    it("after the last range: nextBoundary is null, spec is the last range", () => {
        const {spec, nextBoundary} = evalRangesBar(bar, ZONE, dt("2027-06-01T00:00"));
        expect(nextBoundary).toBeNull();
        expect(spec.label).toBe("2nd Semester");
        expect(spec.start.equals(dt("2027-01-04T08:00"))).toBe(true);
        expect(spec.end.equals(dt("2027-05-27T12:35"))).toBe(true);
    });
});

describe("nthString", () => {
    it.each([
        [0, "1st"], [1, "2nd"], [2, "3rd"], [3, "4th"],
        [10, "11th"], [11, "12th"], [12, "13th"],
        [20, "21st"], [21, "22nd"], [22, "23rd"]
    ])("nthString(%i) === %s", (i, expected) => {
        expect(nthString(i)).toBe(expected);
    });
});
