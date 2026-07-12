import type {z} from "zod";
import type {
    barSchema,
    breakSchema,
    normalScheduleSchema,
    periodSchema,
    rangesBarSchema,
    specialScheduleSchema,
    staticBarSchema,
    weekendSchema
} from "./schema";

export type {SchoolConfig, SchoolConfigInput, ValidationResult} from "./schema";
export type PeriodConfig = z.infer<typeof periodSchema>;
export type NormalScheduleConfig = z.infer<typeof normalScheduleSchema>;
export type SpecialScheduleConfig = z.infer<typeof specialScheduleSchema>;
export type BreakConfig = z.infer<typeof breakSchema>;
export type WeekendConfig = z.infer<typeof weekendSchema>;
export type BarConfig = z.infer<typeof barSchema>;
export type StaticBarConfig = z.infer<typeof staticBarSchema>;
export type RangesBarConfig = z.infer<typeof rangesBarSchema>;

// Minimal shape returned by GET /api/schools
export interface SchoolSummary {
    id: string;
    name: string;
}
