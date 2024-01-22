import {getPercentDone, lastWeekday, nextWeekday, type Period, ProgressBarType} from "$lib/Utils";
import {DateTime, Duration, Interval, type WeekdayNumbers} from "luxon";
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

    constructor(label: String, days: WeekdayNumbers[], periods: [Period, ...Period[]], endWithWeekend = false) {
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
    specificDayLabels?: [String, ...String[]][]; // Array must have at least one period
}

interface Break extends Schedule {
    label: string;
    interval: Interval;
    periods: []
}

interface NormalWeekendConfig {
    startDay: WeekdayNumbers
    endDay: WeekdayNumbers
    startTime: DateTime
    endTime: DateTime
}

export const scheduleBarTypes = ["period", "break", "day", "week", "interim", "quarter", "semester", "year"];
const additionalProgressBarTypes = ["interim", "quarter", "semester", "year"];

export class FullSchedule {
    // normalSchedules: NormalSchedule[] // Friday, Weekday
    // specialSchedules: SpecialSchedule[] // 2Exam, 1Exam
    // breaks: Break[] // Spring Break, Winter Break, Thanksgiving Break, etc.

    todaySchedule: Schedule;
    startOfDay: Break;
    endOfDay: Break;

    bars: {
        period?: ProgressBar,
        break?: ProgressBar,
        day?: ProgressBar,
        week: ProgressBar,

        interim?: ProgressBar,
        quarter?: ProgressBar,
        semester?: ProgressBar,
        year: ProgressBar,
    }

    constructor(normalSchedules: NormalSchedule[], specialSchedules: SpecialSchedule[], breaks: Break[], normalWeekendConfig: NormalWeekendConfig, additionalBars: {
        [type: string]: ProgressBar
    }) {
        // this.normalSchedules = normalSchedules;
        // this.specialSchedules = specialSchedules;
        // this.breaks = breaks;
        function findSchedule(time: DateTime = DateTime.now()): { todaySchedule: Schedule, endOfDay: Break } {
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
                                    lastWeekday(normalWeekendConfig.startDay, DateTime.now(), normalWeekendConfig.startTime),
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
        this.startOfDay = findSchedule(DateTime.now().minus({days: 1})).endOfDay;

        let updateInSchedule = () => {
            console.error("Please call update() on the FullSchedule object, not a Schedule's bar itself (period, day, week, or break bars)");
        }
        this.bars = {
            period: this.todaySchedule.periods.length > 0 && DateTime.now() > this.todaySchedule.periods[0].start ?
                { // Temorarily instantiate a bars, will be updated later to the correct data
                    label: "Period",
                    start: this.todaySchedule.periods[0].start,
                    end: this.todaySchedule.periods[0].end,
                    color: "blue",
                    update: updateInSchedule,
                    percentDone: 0,
                    timeLeft: Duration.fromMillis(0),
                    type: ProgressBarType.Schedule,
                    id: "period",
                    showDays: false,
                } : undefined,
            break: this.todaySchedule.periods.length === 0 ? // If no periods, show break
                {
                    label: "Break",
                    start: DateTime.now(),
                    end: DateTime.now().plus({hours: 1}),
                    color: "blue",
                    update: updateInSchedule,
                    percentDone: 0,
                    timeLeft: Duration.fromMillis(0),
                    type: ProgressBarType.Schedule,
                    id: "break",
                    showDays: true,
                } : undefined,
            day: this.todaySchedule.periods.length == 0 ? undefined : { // If periods, show day bar (this also means that after the break starts, the day bar will be shown for the rest of the day)
                label: "Day",
                start: this.todaySchedule.periods[0].start,
                end: this.todaySchedule.periods[this.todaySchedule.periods.length - 1].end,
                color: "green",
                update: updateInSchedule,
                percentDone: 0,
                timeLeft: Duration.fromMillis(0),
                type: ProgressBarType.Schedule,
                id: "day",
                showDays: false,
            },
            week: {
                label: "Week",
                start: this.startOfDay.interval.start!,
                end: this.endOfDay.interval.end!,
                color: "yellow",
                update: updateInSchedule,
                percentDone: 0,
                timeLeft: Duration.fromMillis(0),
                type: ProgressBarType.Schedule,
                id: "week",
                showDays: false,
            },
            interim: additionalBars.interim,
            quarter: additionalBars.quarter,
            semester: additionalBars.semester,
            year: additionalBars.year,
        }

        if (DateTime.now() < this.todaySchedule.periods[0]!.start) {
            this.bars.break = {
                label: this.startOfDay.label,
                start: this.startOfDay.interval.start!,
                end: this.startOfDay.interval.end!,
                color: "blue",
                update: updateInSchedule,
                percentDone: 0,
                timeLeft: Duration.fromMillis(0),
                type: ProgressBarType.Schedule,
                id: "break",
                showDays: false,
            }
        }

    }

    update() {
        for (const bar of additionalProgressBarTypes) {
            // @ts-ignore
            if (this.bars[bar]) this.bars[bar].update();
        }
        let now = DateTime.now();
        // Update bars
        if (this.bars.day) {
            this.bars.day.percentDone = getPercentDone(this.bars.day.start, this.bars.day.end, now);
        }
        if (this.bars.week) {
            this.bars.week.percentDone = getPercentDone(this.bars.week.start, this.bars.week.end, now);
        }
        if (this.bars.break) {
            this.bars.break.percentDone = getPercentDone(this.bars.break.start, this.bars.break.end, now);
            // Check if we have passed start of 1st period and this ends the break
            if (this.todaySchedule.periods[0].start! < now && this.startOfDay.interval.start == this.bars.break.start) {
                this.bars.break = undefined;
                // Initialize to first period
                this.bars.period = {
                    label: this.todaySchedule.periods[0].label,
                    start: this.todaySchedule.periods[0].start,
                    end: this.todaySchedule.periods[0].end,
                    color: "blue",
                    update: () => {
                        console.error("Please call update() on the FullSchedule object, not a Schedule's bar itself (period, day, week, or break bars)");
                    },
                    percentDone: 0,
                    timeLeft: Duration.fromMillis(0),
                    type: ProgressBarType.Schedule,
                    id: "period",
                    showDays: false,
                }
            }
        }
        if (this.bars.period) {
            // Check if we have passed end of last period
            let currentPeriod = this.todaySchedule.periods.findIndex(period => period.start! > now);
            if (this.bars.period.end < now && now < this.todaySchedule.periods[currentPeriod + 1]!.start) {
                // We are between periods
                this.bars.period.label = "Until " + this.todaySchedule.periods[currentPeriod + 1]!.label;
                this.bars.period.start = this.todaySchedule.periods[currentPeriod]!.end;
                this.bars.period.end = this.todaySchedule.periods[currentPeriod + 1]!.start;
            }
            // Check if we should just advance to the next period
            if (this.todaySchedule.periods[currentPeriod+1]!.start < now) {
                this.bars.period.label = this.todaySchedule.periods[currentPeriod + 1]!.label;
                this.bars.period.start = this.todaySchedule.periods[currentPeriod + 1]!.start;
                this.bars.period.end = this.todaySchedule.periods[currentPeriod + 1]!.end;
            }
        }
    }
}