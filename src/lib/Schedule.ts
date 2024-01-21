import {lastWeekday, nextWeekday, type Period} from "$lib/Utils";
import {DateTime, Interval, type WeekdayNumbers} from "luxon";
import type {ProgressBar} from "$lib/ProgressBar";

interface Schedule {
    label: String;
    periods: Period[];
}
// Represents a normal schedule for a certain day or days of the week. Must have at least one period.
class NormalSchedule implements Schedule {
    label: String;
    days: WeekdayNumbers[]
    periods: [Period, ...Period[]]; // Array must have at least one period
    endWithWeekend: boolean
    constructor(label: String, days: WeekdayNumbers[], periods: [Period, ...Period[]], endWithWeekend=false) {
        this.label = label;
        this.days = days;
        this.periods = periods;
        this.endWithWeekend = endWithWeekend;
    }


}
// Represents a special schedule for a certain day or days of the year, such as an exam schedule. Must have at least one period.
interface SpecialSchedule extends Schedule {
    label: String;
    periods: [Period, ...Period[]]; // Array must have at least one period
    daysApplicable: DateTime[];
}
interface Break extends Schedule {
    label: String;
    interval: Interval;
    periods: []
}
interface NormalWeekendConfig {
    startDay: WeekdayNumbers
    endDay: WeekdayNumbers
    startTime: DateTime
    endTime: DateTime
}
export class FullSchedule {
    // normalSchedules: NormalSchedule[] // Friday, Weekday
    // specialSchedules: SpecialSchedule[] // 2Exam, 1Exam
    // breaks: Break[] // Spring Break, Winter Break, Thanksgiving Break, etc.

    todaySchedule: Schedule;
    endOfDay: Break;
    additonalBars: ProgressBar[];
    constructor(normalSchedules: NormalSchedule[], specialSchedules: SpecialSchedule[], breaks: Break[], normalWeekendConfig: NormalWeekendConfig, additionalBars: ProgressBar[]) {
        // this.normalSchedules = normalSchedules;
        // this.specialSchedules = specialSchedules;
        // this.breaks = breaks;
        function findSchedule(time: DateTime = DateTime.now()): {todaySchedule: Schedule, endOfDay: Break} {
            let foundSchedule = false;
            let todaySchedule: Schedule;
            let endOfDay: Break;
            // Check if we are in a break
            for (const break_ of breaks) {
                if (break_.interval.contains(time)) {
                    todaySchedule = break_;
                    endOfDay = break_;
                    foundSchedule = true;
                }
            }
            // Check if we are in a special schedule
            if (!foundSchedule) for (const specialSchedule of specialSchedules) {
                for (const day of specialSchedule.daysApplicable) {
                    if (day.hasSame(time, "day")) {
                        todaySchedule = specialSchedule;
                        // end of day is the break to next day unless it has no periods in which case it is the normal weekend
                        let tmwSchedule = findSchedule(time.plus({days: 1}));
                        if (tmwSchedule.todaySchedule.periods.length === 0) {
                            endOfDay = {
                                label: "Weekend",
                                interval: Interval.fromDateTimes(
                                    lastWeekday(normalWeekendConfig.startDay, DateTime.now(), normalWeekendConfig.startTime),
                                    nextWeekday(normalWeekendConfig.endDay, DateTime.now(), normalWeekendConfig.endTime)
                                ),
                                periods: []
                            }
                        } else {
                            endOfDay = {
                                label: "Tomorrow",
                                interval: Interval.fromDateTimes(
                                    specialSchedule.periods[specialSchedule.periods.length].end,
                                    tmwSchedule.todaySchedule.periods[0].start
                                ),
                                periods: []
                            };
                        }
                        foundSchedule = true;
                    }
                }
            }
            // Check if we are in a normal schedule
            if (!foundSchedule) for (const normalSchedule of normalSchedules) {
                for (const day of normalSchedule.days) {
                    if (day === time.weekday) {
                        todaySchedule = normalSchedule;
                        if (normalSchedule.endWithWeekend) {
                            // end of day is the next weekend
                            endOfDay = {
                                label: "Weekend",
                                interval: Interval.fromDateTimes(
                                    nextWeekday(normalWeekendConfig.startDay, DateTime.now(), normalWeekendConfig.startTime),
                                    nextWeekday(normalWeekendConfig.endDay, DateTime.now(), normalWeekendConfig.endTime)
                                ),
                                periods: []
                            }
                        } else {
                            // end of day is the next day
                            endOfDay = {
                                label: "Tomorrow",
                                interval: Interval.fromDateTimes(
                                    normalSchedule.periods[normalSchedule.periods.length].end,
                                    findSchedule(time.plus({days: 1})).todaySchedule.periods[0].start
                                ),
                                periods: []
                            }
                        }
                        foundSchedule = true;
                    }
                }
            }
            // Check if we are in a weekend
            if (!foundSchedule) {
                todaySchedule = {
                    label: "Weekend",
                    periods: [],
                }
                endOfDay = {
                    label: "Weekend",
                    interval: Interval.fromDateTimes(
                        lastWeekday(normalWeekendConfig.startDay, DateTime.now(), normalWeekendConfig.startTime),
                        nextWeekday(normalWeekendConfig.endDay, DateTime.now(), normalWeekendConfig.endTime)
                    ),
                    periods: []
                }
            }
            // @ts-ignore we know todaySchedule and endOfDay are defined
            return {todaySchedule, endOfDay}
        }

        let fullSchedule = findSchedule(DateTime.now());
        this.todaySchedule = fullSchedule.todaySchedule;
        this.endOfDay = fullSchedule.endOfDay;

        this.additonalBars = additionalBars;
    }
}