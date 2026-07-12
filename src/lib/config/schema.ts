// Single source of truth for school-config validation.
// Imported by BOTH the browser (admin editor, main page) and the server (save API),
// so client- and server-side validation can never drift apart.
import {z} from "zod";
import {IANAZone} from "luxon";
import {BAR_COLOR_NAMES, type BarColor} from "./colors";

export const SCHOOL_ID_RE = /^[A-Za-z0-9-]{1,32}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // "HH:mm", zero-padded 24h
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // "YYYY-MM-DD"
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/; // local "YYYY-MM-DDTHH:mm"

const timeStr = z.string().regex(TIME_RE, "must be a 24h time like \"08:30\"");
const dateStr = z.string().regex(DATE_RE, "must be a date like \"2025-08-11\"");
const dateTimeStr = z.string().regex(DATETIME_RE, "must be a local datetime like \"2025-08-11T08:30\"");
const colorName = z.enum(BAR_COLOR_NAMES as [BarColor, ...BarColor[]]);
const weekdayNum = z.number().int().min(1, "1 = Monday").max(7, "7 = Sunday");

export const periodSchema = z.object({
    start: timeStr,
    end: timeStr,
    label: z.string().min(1).max(60)
}).refine(p => p.start < p.end, {message: "period start must be before its end", path: ["end"]});

// Sorted, non-overlapping, but zero-gap adjacency is allowed (e.g. 12:02 -> 12:02 Power Hour).
function refinePeriodList(periods: { start: string, end: string }[], ctx: z.RefinementCtx) {
    for (let i = 1; i < periods.length; i++) {
        if (periods[i].start < periods[i - 1].end) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [i, "start"],
                message: `period ${i + 1} starts before period ${i} ends (periods must be in order and not overlap)`
            });
        }
    }
}

export const normalScheduleSchema = z.object({
    label: z.string().min(1).max(60),
    days: z.array(weekdayNum).min(1).max(7)
        .refine(days => new Set(days).size === days.length, "days must not repeat"),
    endWithWeekend: z.boolean().default(false),
    disabled: z.boolean().default(false),
    periods: z.array(periodSchema).min(1).superRefine(refinePeriodList)
});

export const specialScheduleSchema = z.object({
    label: z.string().min(1).max(60),
    days: z.array(dateStr).min(1)
        .refine(days => new Set(days).size === days.length, "days must not repeat"),
    specificDayLabels: z.array(z.array(z.string().min(1).max(60))).optional(),
    disabled: z.boolean().default(false),
    periods: z.array(periodSchema).min(1).superRefine(refinePeriodList)
}).superRefine((s, ctx) => {
    if (s.specificDayLabels) {
        if (s.specificDayLabels.length !== s.days.length) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["specificDayLabels"],
                message: `specificDayLabels must have one row per day (${s.days.length} day(s), got ${s.specificDayLabels.length} row(s))`
            });
        }
        for (const [i, row] of s.specificDayLabels.entries()) {
            if (row.length > s.periods.length) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["specificDayLabels", i],
                    message: `row ${i + 1} has more labels (${row.length}) than there are periods (${s.periods.length})`
                });
            }
        }
    }
});

// Breaks are whole days off — an inclusive date range with no times attached.
// The engine derives the displayed countdown from the surrounding school days.
export const breakSchema = z.object({
    label: z.string().min(1).max(80),
    start: dateStr,
    end: dateStr,
    disabled: z.boolean().default(false)
}).refine(b => b.start <= b.end, {message: "break's first day must not be after its last day", path: ["end"]});

export const weekendSchema = z.object({
    startDay: weekdayNum,
    endDay: weekdayNum,
    startTime: timeStr,
    endTime: timeStr
});

const barCommon = {
    id: z.string().regex(/^[A-Za-z0-9_-]{1,32}$/, "bar id: letters, digits, - and _ only"),
    color: colorName,
    showDays: z.boolean().default(true),
    showEndpoints: z.boolean().default(false),
    enabledByDefault: z.boolean().default(true),
    disabled: z.boolean().default(false)
};

export const staticBarSchema = z.object({
    kind: z.literal("static"),
    label: z.string().min(1).max(80),
    start: dateTimeStr,
    end: dateTimeStr,
    ...barCommon
});

export const rangesBarSchema = z.object({
    kind: z.literal("ranges"),
    // Label used to auto-name unlabeled ranges: "1st Quarter", "2nd Quarter", ...
    eachRangeLabel: z.string().min(1).max(60),
    ranges: z.array(z.object({
        start: dateTimeStr,
        end: dateTimeStr,
        label: z.string().max(80).optional()
    }).refine(r => r.start < r.end, {message: "range start must be before its end", path: ["end"]})).min(1),
    ...barCommon
});

// Note: zod v3's discriminatedUnion only accepts plain ZodObjects, so the
// cross-field checks live in this superRefine rather than on the members.
export const barSchema = z.discriminatedUnion("kind", [staticBarSchema, rangesBarSchema])
    .superRefine((b, ctx) => {
        if (b.kind === "static") {
            if (b.start >= b.end) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["end"],
                    message: "bar start must be before its end"
                });
            }
        } else {
            for (let i = 1; i < b.ranges.length; i++) {
                if (b.ranges[i].start < b.ranges[i - 1].end) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["ranges", i, "start"],
                        message: `range ${i + 1} starts before range ${i} ends (ranges must be in order and not overlap)`
                    });
                }
            }
        }
    });

export const schoolConfigSchema = z.object({
    schemaVersion: z.literal(1),
    id: z.string().regex(SCHOOL_ID_RE, "school id: letters, digits and - only (max 32)"),
    name: z.string().min(1).max(80),
    timezone: z.string().refine(tz => IANAZone.isValidZone(tz), "must be a valid IANA timezone like \"America/New_York\""),
    schoolYear: z.object({start: dateStr, end: dateStr})
        .refine(y => y.start < y.end, {message: "school year start must be before its end", path: ["end"]}),
    colors: z.object({
        period: colorName.default("blue"),
        passing: colorName.default("violet"),
        break: colorName.default("violet"),
        day: colorName.default("red"),
        week: colorName.default("orange")
    }).default({}),
    normalSchedules: z.array(normalScheduleSchema).min(1),
    specialSchedules: z.array(specialScheduleSchema).default([]),
    breaks: z.array(breakSchema).default([]),
    weekend: weekendSchema,
    bars: z.array(barSchema).default([])
}).superRefine((cfg, ctx) => {
    // At least one enabled normal schedule
    const enabledNormals = cfg.normalSchedules.filter(s => !s.disabled);
    if (enabledNormals.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["normalSchedules"],
            message: "at least one normal schedule must be enabled"
        });
    }
    // No two enabled normal schedules may claim the same weekday
    const claimed = new Map<number, string>();
    for (const [i, sched] of cfg.normalSchedules.entries()) {
        if (sched.disabled) continue;
        for (const day of sched.days) {
            const other = claimed.get(day);
            if (other !== undefined) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["normalSchedules", i, "days"],
                    message: `weekday ${day} is claimed by both "${other}" and "${sched.label}"`
                });
            } else {
                claimed.set(day, sched.label);
            }
        }
    }
    // Unique bar ids
    const barIds = new Set<string>();
    for (const [i, bar] of cfg.bars.entries()) {
        if (barIds.has(bar.id)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["bars", i, "id"],
                message: `duplicate bar id "${bar.id}"`
            });
        }
        barIds.add(bar.id);
    }
});

export type SchoolConfig = z.infer<typeof schoolConfigSchema>;
export type SchoolConfigInput = z.input<typeof schoolConfigSchema>;

export type ValidationResult =
    | { ok: true, config: SchoolConfig }
    | { ok: false, errors: string[] };

// Validate an arbitrary JSON value against the school-config schema.
// Returns the parsed (defaults applied) config, or a flat list of human-readable errors.
export function validateSchoolConfig(json: unknown): ValidationResult {
    const result = schoolConfigSchema.safeParse(json);
    if (result.success) return {ok: true, config: result.data};
    return {
        ok: false,
        errors: result.error.issues.map(issue =>
            `${issue.path.length ? issue.path.join(".") : "(root)"}: ${issue.message}`)
    };
}
