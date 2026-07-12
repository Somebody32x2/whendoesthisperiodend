import {describe, it, expect} from "vitest";
import {validateSchoolConfig} from "$lib/config/schema";
import fixture from "../static/example-school.json";

// A minimal, valid config used as a base for mutation in the rejection tests.
// Deliberately omits most optional fields so the "defaults applied" test has something to check.
function baseConfig(): any {
    return {
        schemaVersion: 1,
        id: "test-school",
        name: "Test School",
        timezone: "America/New_York",
        schoolYear: {start: "2026-08-01", end: "2027-06-01"},
        normalSchedules: [
            {
                label: "Weekday",
                days: [1, 2, 3, 4, 5],
                periods: [
                    {start: "08:00", end: "08:50", label: "1st"},
                    {start: "08:50", end: "09:40", label: "2nd"}
                ]
            }
        ],
        weekend: {startDay: 5, endDay: 1, startTime: "15:00", endTime: "08:00"}
    };
}

describe("validateSchoolConfig", () => {
    it("accepts the example-school.json fixture", () => {
        const result = validateSchoolConfig(fixture);
        expect(result.ok).toBe(true);
    });

    it("applies defaults for omitted optional fields", () => {
        const result = validateSchoolConfig(baseConfig());
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.config.colors).toEqual({
            period: "blue",
            passing: "violet",
            break: "violet",
            day: "red",
            week: "orange"
        });
        expect(result.config.specialSchedules).toEqual([]);
        expect(result.config.breaks).toEqual([]);
        expect(result.config.bars).toEqual([]);
        expect(result.config.normalSchedules[0].disabled).toBe(false);
        expect(result.config.normalSchedules[0].endWithWeekend).toBe(false);
    });

    it("rejects a school id with spaces", () => {
        const cfg = baseConfig();
        cfg.id = "has spaces!";
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects an invalid IANA timezone", () => {
        const cfg = baseConfig();
        cfg.timezone = "Not/AZone";
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects a period whose start is not before its end", () => {
        const cfg = baseConfig();
        cfg.normalSchedules[0].periods = [{start: "09:00", end: "09:00", label: "Bad"}];
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects out-of-order periods within a schedule", () => {
        const cfg = baseConfig();
        cfg.normalSchedules[0].periods = [
            {start: "10:00", end: "11:00", label: "First"},
            {start: "09:00", end: "09:30", label: "Second"}
        ];
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects overlapping periods", () => {
        const cfg = baseConfig();
        cfg.normalSchedules[0].periods = [
            {start: "09:00", end: "10:00", label: "First"},
            {start: "09:30", end: "10:30", label: "Second"}
        ];
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it("allows zero-gap adjacency between periods (end == next start)", () => {
        const cfg = baseConfig();
        cfg.normalSchedules[0].periods = [
            {start: "09:00", end: "10:00", label: "First"},
            {start: "10:00", end: "11:00", label: "Second"}
        ];
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(true);
    });

    it("rejects specificDayLabels whose row count doesn't match the days count", () => {
        const cfg = baseConfig();
        cfg.specialSchedules = [
            {
                label: "Special",
                days: ["2026-01-01", "2026-01-02"],
                specificDayLabels: [["only one row"]],
                periods: [{start: "08:00", end: "09:00", label: "P1"}]
            }
        ];
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects two enabled normal schedules claiming the same weekday", () => {
        const cfg = baseConfig();
        cfg.normalSchedules = [
            {
                label: "A",
                days: [1],
                periods: [{start: "08:00", end: "09:00", label: "P1"}]
            },
            {
                label: "B",
                days: [1],
                periods: [{start: "08:00", end: "09:00", label: "P1"}]
            }
        ];
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it("allows the same weekday claimed twice if one schedule is disabled", () => {
        const cfg = baseConfig();
        cfg.normalSchedules = [
            {
                label: "A",
                days: [1],
                disabled: true,
                periods: [{start: "08:00", end: "09:00", label: "P1"}]
            },
            {
                label: "B",
                days: [1],
                periods: [{start: "08:00", end: "09:00", label: "P1"}]
            }
        ];
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(true);
    });

    it("rejects duplicate bar ids", () => {
        const cfg = baseConfig();
        cfg.bars = [
            {id: "dup", kind: "static", label: "Bar 1", start: "2026-01-01T08:00", end: "2026-01-02T08:00", color: "blue"},
            {id: "dup", kind: "static", label: "Bar 2", start: "2026-02-01T08:00", end: "2026-02-02T08:00", color: "red"}
        ];
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects a config with zero enabled normal schedules (all disabled)", () => {
        const cfg = baseConfig();
        cfg.normalSchedules[0].disabled = true;
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects a static bar whose start is not before its end", () => {
        const cfg = baseConfig();
        cfg.bars = [
            {id: "b1", kind: "static", label: "Bar", start: "2026-01-02T08:00", end: "2026-01-01T08:00", color: "blue"}
        ];
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it("rejects ranges bars whose ranges are out of order", () => {
        const cfg = baseConfig();
        cfg.bars = [
            {
                id: "r1",
                kind: "ranges",
                eachRangeLabel: "Quarter",
                color: "blue",
                ranges: [
                    {start: "2026-03-01T08:00", end: "2026-04-01T08:00"},
                    {start: "2026-01-01T08:00", end: "2026-02-01T08:00"}
                ]
            }
        ];
        const result = validateSchoolConfig(cfg);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });
});
