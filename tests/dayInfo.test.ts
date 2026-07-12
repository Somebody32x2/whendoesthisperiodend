import {describe, it, expect} from "vitest";
import {DateTime} from "luxon";
import {validateSchoolConfig} from "$lib/config/schema";
import {resolveConfig} from "$lib/engine/resolve";
import {getDayInfo, computeSnapshot} from "$lib/engine/engine";
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

describe("getDayInfo", () => {
    it("Mon 2026-08-31 is a Weekday school day with 8 periods starting at 08:00", () => {
        const info = getDayInfo(rc, dt("2026-08-31"));
        expect(info.kind).toBe("school");
        if (info.kind !== "school") return;
        expect(info.label).toBe("Weekday");
        expect(info.periods.length).toBe(8);
        expect(info.periods[0].start.equals(dt("2026-08-31T08:00"))).toBe(true);
    });

    it("Fri 2026-09-04 is a Friday school day with endWithWeekend true", () => {
        const info = getDayInfo(rc, dt("2026-09-04"));
        expect(info.kind).toBe("school");
        if (info.kind !== "school") return;
        expect(info.label).toBe("Friday");
        expect(info.endWithWeekend).toBe(true);
    });

    it("Sat 2026-09-05 and Sun 2026-09-06 are weekend days", () => {
        expect(getDayInfo(rc, dt("2026-09-05")).kind).toBe("weekend");
        expect(getDayInfo(rc, dt("2026-09-06")).kind).toBe("weekend");
    });

    it("Wed 2026-09-16 is the Fall Holiday break", () => {
        const info = getDayInfo(rc, dt("2026-09-16"));
        expect(info.kind).toBe("break");
        if (info.kind !== "break") return;
        expect(info.label).toBe("Fall Holiday");
    });

    it("Wed 2026-11-25 is Thanksgiving Break, but Tue 2026-11-24 is still a school day", () => {
        const wed = getDayInfo(rc, dt("2026-11-25"));
        expect(wed.kind).toBe("break");
        if (wed.kind === "break") expect(wed.label).toBe("Thanksgiving Break");

        const tue = getDayInfo(rc, dt("2026-11-24"));
        expect(tue.kind).toBe("school");
        if (tue.kind === "school") expect(tue.label).toBe("Weekday");
    });

    it("2027-05-26 and 2027-05-27 use the Exam Days specificDayLabels", () => {
        const day1 = getDayInfo(rc, dt("2027-05-26"));
        expect(day1.kind).toBe("school");
        if (day1.kind === "school") {
            expect(day1.periods[0].label).toBe("Period #1 Exam");
            expect(day1.periods[2].label).toBe("Period #2 Exam");
        }

        const day2 = getDayInfo(rc, dt("2027-05-27"));
        expect(day2.kind).toBe("school");
        if (day2.kind === "school") {
            expect(day2.periods[0].label).toBe("Period #3 Exam");
            expect(day2.periods[2].label).toBe("Period #4 Exam");
        }
    });

    it("disabled 'Old Field Day' special (2025-04-18, a Friday) does not apply", () => {
        const info = getDayInfo(rc, dt("2025-04-18"));
        expect(info.kind).toBe("school");
        if (info.kind === "school") expect(info.label).toBe("Friday");
    });

    it("does not mutate a deep-frozen config, and is idempotent across repeated calls", () => {
        const frozenConfig = deepFreeze(loadConfig());
        const frozenRc = resolveConfig(frozenConfig);

        const sampleDates = [
            "2026-08-31", "2026-09-04", "2026-09-05", "2026-09-16",
            "2026-11-24", "2026-11-25", "2027-05-26", "2027-05-27"
        ];
        const sampleTimes = [
            "2026-08-31T07:30", "2026-08-31T08:30", "2026-08-31T10:40",
            "2026-09-04T14:00", "2026-11-25T12:00"
        ];

        for (const d of sampleDates) {
            expect(() => getDayInfo(frozenRc, dt(d))).not.toThrow();
            const first = summarizeDayInfo(getDayInfo(frozenRc, dt(d)));
            const second = summarizeDayInfo(getDayInfo(frozenRc, dt(d)));
            expect(second).toEqual(first);
        }

        for (const t of sampleTimes) {
            expect(() => computeSnapshot(frozenRc, dt(t))).not.toThrow();
        }
    });
});

function deepFreeze<T>(obj: T): T {
    if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
        for (const key of Object.getOwnPropertyNames(obj)) {
            deepFreeze((obj as any)[key]);
        }
        Object.freeze(obj);
    }
    return obj;
}

// JSON-comparable summary of a DayInfo (DateTime objects aren't directly comparable with toEqual).
function summarizeDayInfo(info: ReturnType<typeof getDayInfo>) {
    if (info.kind !== "school") return {kind: info.kind};
    return {
        kind: info.kind,
        label: info.label,
        endWithWeekend: info.endWithWeekend,
        periods: info.periods.map(p => ({start: p.start.toISO(), end: p.end.toISO(), label: p.label}))
    };
}
