import {describe, it, expect} from "vitest";
import {DateTime} from "luxon";
import {validateSchoolConfig} from "$lib/config/schema";
import {resolveConfig} from "$lib/engine/resolve";
import {computeSnapshot} from "$lib/engine/engine";
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

describe("computeSnapshot - individual moments", () => {
    it("before school (Mon 2026-08-31T07:30)", () => {
        const snap = computeSnapshot(rc, dt("2026-08-31T07:30"));
        expect(snap.state).toBe("before-school");

        const breakBar = snap.bars.find(b => b.id === "break");
        expect(breakBar).toBeDefined();
        expect(breakBar!.end.equals(dt("2026-08-31T08:00"))).toBe(true);

        expect(snap.bars.some(b => b.id === "day")).toBe(true);
        expect(snap.bars.some(b => b.id === "week")).toBe(true);

        expect(snap.validUntil.equals(dt("2026-08-31T08:00"))).toBe(true);
    });

    it("in 1st Period (Mon 2026-08-31T08:30)", () => {
        const snap = computeSnapshot(rc, dt("2026-08-31T08:30"));
        expect(snap.state).toBe("in-period");

        const periodBar = snap.bars.find(b => b.id === "period");
        expect(periodBar?.label).toBe("1st Period");
        expect(snap.validUntil.equals(dt("2026-08-31T08:50"))).toBe(true);
    });

    it("zero-gap boundary: exactly 10:40 is in-period Lunch, no passing flicker", () => {
        const snap = computeSnapshot(rc, dt("2026-08-31T10:40"));
        expect(snap.state).toBe("in-period");

        const periodBar = snap.bars.find(b => b.id === "period");
        expect(periodBar?.label).toBe("Lunch");
    });

    it("passing between 1st and 2nd Period (Mon 2026-08-31T08:52)", () => {
        const snap = computeSnapshot(rc, dt("2026-08-31T08:52"));
        expect(snap.state).toBe("passing");

        const periodBar = snap.bars.find(b => b.id === "period");
        expect(periodBar?.label).toBe("Until 2nd Period");
        expect(snap.validUntil.equals(dt("2026-08-31T08:55"))).toBe(true);
    });

    it("after school (Mon 2026-08-31T16:00): break spans 15:10 -> Tue 08:00", () => {
        const snap = computeSnapshot(rc, dt("2026-08-31T16:00"));
        expect(snap.state).toBe("after-school");

        const breakBar = snap.bars.find(b => b.id === "break");
        expect(breakBar).toBeDefined();
        expect(breakBar!.label).toBe("Until Tomorrow");
        expect(breakBar!.start.equals(dt("2026-08-31T15:10"))).toBe(true);
        expect(breakBar!.end.equals(dt("2026-09-01T08:00"))).toBe(true);
    });

    it("Friday after school (2026-09-04T14:00, endWithWeekend): break spans 13:00 -> Mon 08:00", () => {
        const snap = computeSnapshot(rc, dt("2026-09-04T14:00"));
        expect(snap.state).toBe("after-school");

        const breakBar = snap.bars.find(b => b.id === "break");
        expect(breakBar).toBeDefined();
        expect(breakBar!.label).toContain("Weekend");
        expect(breakBar!.start.equals(dt("2026-09-04T13:00"))).toBe(true);
        // 2026-09-07 (Labor Day) has no configured break, so Monday is a normal school day.
        expect(breakBar!.end.equals(dt("2026-09-07T08:00"))).toBe(true);
    });

    it("weekend (Sat 2026-09-05T12:00)", () => {
        const snap = computeSnapshot(rc, dt("2026-09-05T12:00"));
        expect(snap.state).toBe("weekend");

        const breakBar = snap.bars.find(b => b.id === "break");
        expect(breakBar).toBeDefined();
        expect(breakBar!.label).toContain("Weekend");
        expect(breakBar!.showDays).toBe(true);
    });

    it("break day (Wed 2026-11-25T12:00): Thanksgiving Break spans Tue 15:10 -> Mon 08:00", () => {
        const snap = computeSnapshot(rc, dt("2026-11-25T12:00"));
        expect(snap.state).toBe("break");

        const breakBar = snap.bars.find(b => b.id === "break");
        expect(breakBar).toBeDefined();
        expect(breakBar!.label).toBe("Thanksgiving Break");
        expect(breakBar!.start.equals(dt("2026-11-24T15:10"))).toBe(true);
        expect(breakBar!.end.equals(dt("2026-11-30T08:00"))).toBe(true);
    });

    it("midnight rollover: 23:50 on a school day has validUntil at the next midnight", () => {
        const snap = computeSnapshot(rc, dt("2026-08-31T23:50"));
        expect(snap.state).toBe("after-school");
        expect(snap.validUntil.equals(dt("2026-09-01T00:00"))).toBe(true);
    });
});

describe("computeSnapshot - minute-by-minute transition sweep (Mon 2026-08-31)", () => {
    // Derived from the Weekday schedule's 8 periods (one zero-gap at 10:40: 3rd Period -> Lunch).
    const EXPECTED_KEYS = [
        "before-school",
        "in-period:1st Period",
        "passing:Until 2nd Period",
        "in-period:2nd Period",
        "passing:Until 3rd Period",
        "in-period:3rd Period",
        "in-period:Lunch",
        "passing:Until 4th Period",
        "in-period:4th Period",
        "passing:Until 5th Period",
        "in-period:5th Period",
        "passing:Until 6th Period",
        "in-period:6th Period",
        "passing:Until 7th Period",
        "in-period:7th Period",
        "after-school"
    ];

    it("produces exactly the expected sequence of state transitions, always advances, and is stable just before each boundary", () => {
        const day = dt("2026-08-31");
        const keys: string[] = [];
        const validUntils: DateTime[] = [];

        let cursor = day.set({hour: 6, minute: 0, second: 0, millisecond: 0});
        const stop = day.set({hour: 23, minute: 59, second: 0, millisecond: 0});

        while (cursor <= stop) {
            const snap = computeSnapshot(rc, cursor);

            // (a) validUntil is always strictly in the future.
            expect(snap.validUntil > cursor).toBe(true);

            const periodBar = snap.bars.find(b => b.id === "period");
            const key = periodBar ? `${snap.state}:${periodBar.label}` : snap.state;
            if (keys[keys.length - 1] !== key) keys.push(key);
            validUntils.push(snap.validUntil);

            // Efficient-recompute check: nothing changes between now and just before validUntil.
            const justBefore = snap.validUntil.minus({milliseconds: 1});
            if (justBefore >= cursor) {
                const snapBefore = computeSnapshot(rc, justBefore);
                expect(snapBefore.state).toBe(snap.state);
            }

            cursor = cursor.plus({minutes: 1});
        }

        expect(keys).toEqual(EXPECTED_KEYS);

        // (b) Recomputing at exactly each observed validUntil always advances further still.
        const uniqueBoundaries = [...new Set(validUntils.map(d => d.toMillis()))]
            .map(ms => DateTime.fromMillis(ms, {zone: ZONE}));
        for (const boundary of uniqueBoundaries) {
            const snap = computeSnapshot(rc, boundary);
            expect(snap.validUntil > boundary).toBe(true);
        }
    });
});
