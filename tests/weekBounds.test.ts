import {describe, it, expect} from "vitest";
import {DateTime} from "luxon";
import {validateSchoolConfig} from "$lib/config/schema";
import {resolveConfig} from "$lib/engine/resolve";
import {getWeekBounds} from "$lib/engine/engine";
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

const rc = resolveConfig(loadConfig());

describe("getWeekBounds", () => {
    it("plain week (also covers the Aug->Sep month boundary): Mon 08:00 -> Fri 13:00, from any day in the week", () => {
        const expectedStart = dt("2026-08-31T08:00");
        const expectedEnd = dt("2026-09-04T13:00");
        for (const day of ["2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]) {
            const bounds = getWeekBounds(rc, dt(day));
            expect(bounds).not.toBeNull();
            if (!bounds) continue;
            expect(bounds.start.equals(expectedStart)).toBe(true);
            expect(bounds.end.equals(expectedEnd)).toBe(true);
        }
    });

    it("mid-week hole (Fall Holiday Wed 9/16) doesn't shrink the week bounds", () => {
        const bounds = getWeekBounds(rc, dt("2026-09-14"));
        expect(bounds).not.toBeNull();
        if (!bounds) return;
        expect(bounds.start.equals(dt("2026-09-14T08:00"))).toBe(true);
        expect(bounds.end.equals(dt("2026-09-18T13:00"))).toBe(true);
    });

    it("short week (Thanksgiving): only Mon + Tue are school days", () => {
        const bounds = getWeekBounds(rc, dt("2026-11-23"));
        expect(bounds).not.toBeNull();
        if (!bounds) return;
        expect(bounds.start.equals(dt("2026-11-23T08:00"))).toBe(true);
        expect(bounds.end.equals(dt("2026-11-24T15:10"))).toBe(true);
    });

    it("a week fully inside Winter Break returns null", () => {
        const bounds = getWeekBounds(rc, dt("2026-12-23"));
        expect(bounds).toBeNull();
    });
});
