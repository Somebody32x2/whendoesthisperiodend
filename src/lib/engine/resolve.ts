// Turns a validated SchoolConfig (plain JSON) into lookup structures the engine
// uses. Resolution filters out disabled entries; the raw config is untouched.
import type {BarConfig, BreakConfig, NormalScheduleConfig, SchoolConfig, SpecialScheduleConfig} from "$lib/config/types";

export interface ResolvedConfig {
    cfg: SchoolConfig;
    zone: string;
    /** ISO date ("YYYY-MM-DD") -> special schedule applying that day + index into its days array */
    specialByDate: Map<string, { schedule: SpecialScheduleConfig, dayIndex: number }>;
    enabledBreaks: BreakConfig[];
    /** weekday (1=Mon..7=Sun) -> enabled normal schedule claiming it */
    normalByWeekday: Map<number, NormalScheduleConfig>;
    enabledBars: BarConfig[];
}

export function resolveConfig(cfg: SchoolConfig): ResolvedConfig {
    const specialByDate = new Map<string, { schedule: SpecialScheduleConfig, dayIndex: number }>();
    for (const schedule of cfg.specialSchedules) {
        if (schedule.disabled) continue;
        for (const [dayIndex, day] of schedule.days.entries()) {
            specialByDate.set(day, {schedule, dayIndex});
        }
    }

    const normalByWeekday = new Map<number, NormalScheduleConfig>();
    for (const schedule of cfg.normalSchedules) {
        if (schedule.disabled) continue;
        for (const day of schedule.days) normalByWeekday.set(day, schedule);
    }

    return {
        cfg,
        zone: cfg.timezone,
        specialByDate,
        enabledBreaks: cfg.breaks.filter(b => !b.disabled),
        normalByWeekday,
        enabledBars: cfg.bars.filter(b => !b.disabled)
    };
}
