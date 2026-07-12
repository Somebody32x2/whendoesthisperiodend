import {describe, it, expect} from "vitest";
import {rederiveEntry} from "$lib/config/yearShift";
import type {BarConfig, BreakConfig, SpecialScheduleConfig} from "$lib/config/types";

const SCHOOL_YEAR = {start: "2026-08-17", end: "2027-05-27"};

describe("rederiveEntry", () => {
    it("shifts a disabled break forward 2 years, re-enables it, and doesn't touch the original", () => {
        const original: BreakConfig = {
            label: "Old Spring Break",
            start: "2025-03-10T15:10",
            end: "2025-03-16T23:59",
            disabled: true
        };
        const result = rederiveEntry(original, SCHOOL_YEAR);

        expect(result.start).toBe("2027-03-10T15:10");
        expect(result.end).toBe("2027-03-16T23:59");
        expect(result.disabled).toBe(false);

        // original object must be untouched
        expect(original.start).toBe("2025-03-10T15:10");
        expect(original.end).toBe("2025-03-16T23:59");
        expect(original.disabled).toBe(true);
    });

    it("shifts a special schedule's days array", () => {
        const original: SpecialScheduleConfig = {
            label: "Old Field Day",
            days: ["2025-04-18"],
            disabled: true,
            periods: [{start: "08:00", end: "09:00", label: "P1"}]
        };
        const result = rederiveEntry(original, SCHOOL_YEAR);

        expect(result.days).toEqual(["2027-04-18"]);
        expect(result.disabled).toBe(false);
        expect(original.days).toEqual(["2025-04-18"]);
    });

    it("shifts 0 years when the entry is already within the school year, but still flips disabled to false", () => {
        const original: BreakConfig = {
            label: "Already Current",
            start: "2026-09-01T08:00",
            end: "2026-09-01T09:00",
            disabled: true
        };
        const result = rederiveEntry(original, SCHOOL_YEAR);

        expect(result.start).toBe("2026-09-01T08:00");
        expect(result.end).toBe("2026-09-01T09:00");
        expect(result.disabled).toBe(false);
    });

    it("shifts every range's start/end in a ranges bar", () => {
        const original: BarConfig = {
            id: "old-quarters",
            kind: "ranges",
            eachRangeLabel: "Quarter",
            color: "blue",
            showDays: true,
            showEndpoints: false,
            enabledByDefault: true,
            disabled: true,
            ranges: [
                {start: "2025-01-01T08:00", end: "2025-01-02T08:00"},
                {start: "2025-02-01T08:00", end: "2025-02-02T08:00"}
            ]
        };
        const result = rederiveEntry(original, SCHOOL_YEAR);

        expect(result.kind).toBe("ranges");
        if (result.kind !== "ranges") return;
        expect(result.ranges).toEqual([
            {start: "2027-01-01T08:00", end: "2027-01-02T08:00"},
            {start: "2027-02-01T08:00", end: "2027-02-02T08:00"}
        ]);
        expect(result.disabled).toBe(false);

        // original untouched
        expect((original as any).ranges[0].start).toBe("2025-01-01T08:00");
    });

    it("preserves time-of-day across all shift kinds", () => {
        const brk: BreakConfig = {label: "X", start: "2025-06-01T07:23", end: "2025-06-02T18:47", disabled: true};
        const result = rederiveEntry(brk, SCHOOL_YEAR);
        expect(result.start.slice(11)).toBe("07:23");
        expect(result.end.slice(11)).toBe("18:47");
    });
});
