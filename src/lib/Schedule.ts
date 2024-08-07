import {
    getPercentDone,
    lastWeekday,
    nextWeekday,
    type Period,
    ProgressBarType,
    safeFromUTCString,
    toCurrentDay
} from "$lib/Utils";
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
    specificDayLabels?: [string, ...string[]][]; // Array must have at least one period
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
    offset?: Duration;

    bars: {
        [type: string]: ProgressBar | undefined
        period?: ProgressBar,
        break?: ProgressBar,
        day?: ProgressBar,
        week?: ProgressBar,

        interim?: ProgressBar,
        quarter?: ProgressBar,
        semester?: ProgressBar,
        year?: ProgressBar,
    }

    constructor(normalSchedules: NormalSchedule[], specialSchedules: SpecialSchedule[], breaks: Break[], normalWeekendConfig: NormalWeekendConfig, additionalBars: {
        [type: string]: ProgressBar
    }) {
        // this.offset = safeFromUTCString("2024-08-12T8:29:10").diff(DateTime.now()); // TODO: RE-COMMENT
        // console.log(this.offset)
        // this.offset = Duration.fromMillis(0);
        let nowTime = DateTime.now().plus(this.offset ? this.offset : 0);
        // this.normalSchedules = normalSchedules;
        // this.specialSchedules = specialSchedules;
        // this.breaks = breaks;
        // Finds the schedule and end of day for the given time, or schedule and weekend break if shallowFindScheduleOnly is true
        function findSchedule(time: DateTime = nowTime, shallowFindScheduleOnly: boolean): {
            todaySchedule: Schedule,
            endOfDay: Break
        } {
            console.log(`FINDING SCHEDULE FOR TIME ${time.toISODate()}T${time.toISOTime()}, shallowFindScheduleOnly: ${shallowFindScheduleOnly}`)
            let foundSchedule = false;
            let todaySchedule: Schedule;
            let endOfDay: Break;
            // Check if we are in a break
            for (const break_ of breaks) {
                if (break_.interval.contains(time)) {
                    todaySchedule = break_;
                    endOfDay = break_;
                    // The break might end at 23:59, so extend it to the next day (if it has periods)
                    if (!shallowFindScheduleOnly && break_.interval.end?.toISOTime().includes("23:59")) {
                        let tmwSchedule = findSchedule(break_.interval.end.plus({"hours": 1}), true);
                        console.log(tmwSchedule.todaySchedule.periods.length)
                        if (tmwSchedule.todaySchedule.periods.length > 0) {
                            endOfDay.interval = endOfDay.interval.set({end: tmwSchedule.todaySchedule.periods[0].start});
                        }
                    }
                    foundSchedule = true;
                    break;
                }
            }
            // Check if we are in a special schedule
            if (!foundSchedule) for (const specialSchedule of specialSchedules) {
                for (const [i, day] of specialSchedule.daysApplicable.entries()) {
                    if (day.hasSame(time, "day")) {
                        todaySchedule = specialSchedule;
                        // check if we have a specific label for this day
                        if (specialSchedule.specificDayLabels) {
                            for (const [j, specificDay] of specialSchedule.specificDayLabels[i].entries()) {
                                todaySchedule.periods[j].label = specificDay;

                            }
                        }

                        // end of day is the break to next day unless it has no periods in which case it is the normal weekend
                        if (!shallowFindScheduleOnly) {
                            let tmwSchedule = findSchedule(time.plus({days: 1}), true);
                            if (tmwSchedule.todaySchedule.periods.length === 0) {
                                endOfDay = {
                                    label: "Weekend",
                                    interval: Interval.fromDateTimes(
                                        lastWeekday(normalWeekendConfig.startDay, nowTime, normalWeekendConfig.startTime),
                                        nextWeekday(normalWeekendConfig.endDay, nowTime, normalWeekendConfig.endTime)
                                    ),
                                    periods: []
                                }
                            } else {
                                console.log(tmwSchedule.todaySchedule.periods[0].start, time.plus({days: 1}).toMillis() - toCurrentDay(specialSchedule.periods[specialSchedule.periods.length - 1].end, time).toMillis())
                                endOfDay = {
                                    label: "Until Tomorrow",
                                    interval: Interval.fromDateTimes(
                                        toCurrentDay(specialSchedule.periods[specialSchedule.periods.length-1].end, time),
                                        toCurrentDay(tmwSchedule.todaySchedule.periods[0].start, time.plus({days: 1}))
                                    ),
                                    periods: []
                                };
                                console.log(endOfDay)
                            }
                        }
                        foundSchedule = true;
                        break
                    }
                }
            }
            // Check if we are in a normal schedule
            if (!foundSchedule) for (const normalSchedule of normalSchedules) {
                if (normalSchedule.days.includes(<1 | 2 | 3 | 4 | 5 | 6 | 7>time.weekday)) {
                    todaySchedule = {
                        label: normalSchedule.label,
                        periods: [...normalSchedule.periods],

                    };
                    // Convert to the time's day
                    todaySchedule.periods = todaySchedule.periods.map(period => {
                        return {
                            start: toCurrentDay(period.start, time),
                            end: toCurrentDay(period.end, time),
                            label: period.label,
                        }
                    });
                    if (normalSchedule.endWithWeekend && !shallowFindScheduleOnly) {
                        // end of day is the next weekend
                        endOfDay = {
                            label: "this Weekend",
                            interval: Interval.fromDateTimes(
                                lastWeekday(normalWeekendConfig.startDay, nowTime, normalWeekendConfig.startTime),
                                nextWeekday(normalWeekendConfig.endDay, nowTime, normalWeekendConfig.endTime)
                            ),
                            periods: []
                        }
                    } else if (!shallowFindScheduleOnly) {
                        // end of day is the next day
                        endOfDay = {
                            label: "Until Tomorrow",
                            interval: Interval.fromDateTimes(
                                normalSchedule.periods[normalSchedule.periods.length - 1].end,
                                findSchedule(time.plus({days: 1}), true).todaySchedule.periods[0].start // TODO: Stop this from modifying the todaySchedule.periods array
                            ),
                            periods: []
                        }
                        console.log("JUST CALCULATED END OF DAY !!!!!!!!!!! for time " + time.toISODate() + "T" + time.toISOTime())
                        console.log(endOfDay)
                        console.assert(endOfDay.interval.isValid, "End of day interval is not valid")
                    }
                    foundSchedule = true;
                    break;
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
                        lastWeekday(normalWeekendConfig.startDay, nowTime, normalWeekendConfig.startTime),
                        nextWeekday(normalWeekendConfig.endDay, nowTime, normalWeekendConfig.endTime)
                    ),
                    periods: []
                }
            }
            // @ts-ignore we know todaySchedule and endOfDay are defined
            return {todaySchedule, endOfDay}
        }

        let fullSchedule = findSchedule(nowTime, false);
        this.todaySchedule = fullSchedule.todaySchedule;
        this.endOfDay = fullSchedule.endOfDay;
        this.startOfDay = findSchedule(nowTime.minus({days: 1}), false).endOfDay;


        let updateInSchedule = () => {
            console.error("Please call update() on the FullSchedule object, not a Schedule's bar itself (period, day, week, or break bars)");
        }
        let now = nowTime;
        this.bars = {
            period: this.todaySchedule.periods.length > 0 && now > this.todaySchedule.periods[0].start && now < this.todaySchedule.periods[this.todaySchedule.periods.length - 1].end ?
                { // Temorarily instantiate a bars, will be updated later to the correct data
                    label: "Period",
                    start: this.todaySchedule.periods[0].start,
                    end: this.todaySchedule.periods[0].end,
                    color: "violet",
                    update: updateInSchedule,
                    percentDone: 0,
                    timeLeft: Duration.fromMillis(0),
                    type: ProgressBarType.Schedule,
                    id: "period",
                    showDays: false,
                    showEndpoints: true
                } : undefined,
            break: !(this.todaySchedule.periods.length > 0 && now > this.todaySchedule.periods[0].start && now < this.todaySchedule.periods[this.todaySchedule.periods.length - 1].end) ? // If no periods, show break
                {
                    label: "Break",
                    start: nowTime,
                    end: nowTime.plus({hours: 1}),
                    color: "violet",
                    update: updateInSchedule,
                    percentDone: 0,
                    timeLeft: Duration.fromMillis(0),
                    type: ProgressBarType.Schedule,
                    id: "break",
                    showDays: true,
                    showEndpoints: false
                } : undefined,
            day: this.todaySchedule.periods.length == 0 ? undefined : { // If periods, show day bar (this also means that after the break starts, the day bar will be shown for the rest of the day)
                label: "Today",
                start: this.todaySchedule.periods[0].start,
                end: this.todaySchedule.periods[this.todaySchedule.periods.length - 1].end,
                color: "red",
                update: updateInSchedule,
                percentDone: 0,
                timeLeft: Duration.fromMillis(0),
                type: ProgressBarType.Schedule,
                id: "day",
                showDays: false,
                showEndpoints: true
            },
            week: this.todaySchedule.periods.length == 0 ? undefined : {
                label: "this Week",
                start: this.startOfDay.interval.start!,
                end: this.endOfDay.interval.end!,
                color: "orange",
                update: updateInSchedule,
                percentDone: 0,
                timeLeft: Duration.fromMillis(0),
                type: ProgressBarType.Schedule,
                id: "week",
                showDays: false,
                showEndpoints: false
            },
            interim: additionalBars.interim,
            quarter: additionalBars.quarter,
            semester: additionalBars.semester,
            year: additionalBars.year,
        }
        // console.log({origThis: this, bars: this.bars, todaySchedule: this.todaySchedule, endOfDay: this.endOfDay, startOfDay: this.startOfDay, schLen: this.todaySchedule.periods.length})

        // Set up the break bar
        if (now < this.todaySchedule.periods[0]?.start) {
            this.bars.break!.label = this.startOfDay.label
            this.bars.break!.start = this.startOfDay.interval.start!
            this.bars.break!.end = this.startOfDay.interval.end!
            this.bars.break!.showDays = false
            console.log("Starting Pre-School Break!")
        } else if (now > this.todaySchedule.periods[this.todaySchedule.periods.length - 1]?.end) {
            this.bars.break!.label = this.endOfDay.label
            this.bars.break!.start = this.endOfDay.interval.start!
            this.bars.break!.end = this.endOfDay.interval.end!
            this.bars.break!.showDays = false
            console.log("Starting Post-School Break!")
        }
        if (this.todaySchedule.periods.length === 0) {
            this.bars.break!.label = this.endOfDay.label
            this.bars.break!.start = this.endOfDay.interval.start!
            this.bars.break!.end = this.endOfDay.interval.end!
            this.bars.break!.showDays = true
            console.log("Starting Break!")
        }

        // Week Bounds
        if (this.todaySchedule.periods.length !== 0) {
            // Find week start and end (working backwards and forward from today, if today is a weekday)
            // Work backwards from today until finding the most previous day that has a schedule
            let weekStart = this.todaySchedule.periods[0].start;
            for (let i = 0; i < 50; i++) { // 50 is an arbitrary number, but it should be enough to find the week start (I hope there aren't any 50-day weeks)
                let dayPriorSchedule = findSchedule(weekStart.minus({days: 1}), true).todaySchedule;
                if (dayPriorSchedule.periods.length === 0) { // If the day prior has no periods, we have found the week start
                    break;
                }
                weekStart = dayPriorSchedule.periods[0].start
            }
            // Work forwards from today until finding the most next day that has a schedule
            let weekEnd = this.todaySchedule.periods[this.todaySchedule.periods.length - 1].end;
            for (let i = 0; i < 50; i++) { // 50 is an arbitrary number, but it should be enough to find the weekend (I hope there aren't any 50-day weeks)
                let dayAfterSchedule = findSchedule(weekEnd.plus({days: 1}), true).todaySchedule;
                if (dayAfterSchedule.periods.length === 0) { // If the day after has no periods, we have found the weekend
                    break;
                }
                weekEnd = dayAfterSchedule.periods[dayAfterSchedule.periods.length - 1].end
            }
            // @ts-ignore - Already checked that this.todaySchedule.periods is not empty
            this.bars.week.start = weekStart;
            // @ts-ignore
            this.bars.week.end = weekEnd;
            console.log(this.bars.week?.start, this.bars.week?.end)
        }

        console.log({this: this, bars: this.bars})
    }

    update() {
        let nowTime = this.offset?.as('milliseconds') ? DateTime.now().plus(this.offset) : DateTime.now()
        for (const bar of additionalProgressBarTypes) {
            try {
                // @ts-ignore
                if (this.bars[bar]) this.bars[bar].update(this.offset);
            }
            catch (e) {
                // @ts-ignore
                console.error(`Error updating ${bar} bar: ${e}, ${e.stack}`)
                // undefine the bar
                this.bars[bar] = undefined;
            }

        }
        let now = nowTime;
        // Update bars
        if (this.bars.day) {
            this.bars.day.percentDone = getPercentDone(this.bars.day.start, this.bars.day.end, now);
            this.bars.day.timeLeft = this.bars.day.end.diff(now);
        }
        if (this.bars.week) {
            this.bars.week.percentDone = getPercentDone(this.bars.week.start, this.bars.week.end, now);
            this.bars.week.timeLeft = this.bars.week.end.diff(now);
        }
        if (this.bars.break) {
            this.bars.break.percentDone = getPercentDone(this.bars.break.start, this.bars.break.end, now);
            this.bars.break.timeLeft = this.bars.break.end.diff(now);
            // Check if we have passed start of 1st period and this ends the break
            if (this.todaySchedule.periods[0]?.start < now && this.startOfDay.interval.start == this.bars.break.start) {
                if (now > this.bars.break.end) this.bars.break = undefined;
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
                    showEndpoints: true
                }

                console.log("Starting Day!")
            }
        }
        if (this.bars.period) {
            // Check if we have passed end of last period
            let currentPeriod = -1; // The last period for which now > start
            for (let i = this.todaySchedule.periods.length - 1; i >= 0; i--) {
                if (now > this.todaySchedule.periods[i]?.start) {
                    currentPeriod = i;
                    break;
                }
            }
            // Check if we are in the period
            if (this.todaySchedule.periods[currentPeriod]!.start < now && now < this.todaySchedule.periods[currentPeriod]!.end) {
                this.bars.period.label = this.todaySchedule.periods[currentPeriod]!.label;
                this.bars.period.start = this.todaySchedule.periods[currentPeriod]!.start;
                this.bars.period.end = this.todaySchedule.periods[currentPeriod]!.end;

                // console.log("In Period!")
            }
            // console.log({currentPeriod: currentPeriod, todaySchedule: this.todaySchedule})
            if (this.bars.period.end < now && now < this.todaySchedule.periods[currentPeriod + 1]!.start) {
                // We are between periods
                this.bars.period.label = "Until " + this.todaySchedule.periods[currentPeriod + 1]!.label;
                this.bars.period.start = this.todaySchedule.periods[currentPeriod]!.end;
                this.bars.period.end = this.todaySchedule.periods[currentPeriod + 1]!.start;

                console.log("Between Periods!")
            }
            // Check if we should just advance to the next period
            if (this.todaySchedule.periods[currentPeriod + 1] && this.todaySchedule.periods[currentPeriod + 1]!.start < now) {
                this.bars.period.label = this.todaySchedule.periods[currentPeriod + 1]!.label;
                this.bars.period.start = this.todaySchedule.periods[currentPeriod + 1]!.start;
                this.bars.period.end = this.todaySchedule.periods[currentPeriod + 1]!.end;

                console.log("Next Period!")
            }

            // Update percent done and time left
            this.bars.period.percentDone = getPercentDone(this.bars.period.start, this.bars.period.end, now);
            this.bars.period.timeLeft = this.bars.period.end.diff(now);

            // Check if we have passed end of last period and this ends the day, so we should start the break
            if (this.bars.period.end < now && this.endOfDay.interval.end == this.bars.period.end) {
                this.bars.period = undefined;
                // Initialize to break
                this.bars.break = {
                    label: this.endOfDay.label,
                    start: this.endOfDay.interval.start!,
                    end: this.endOfDay.interval.end!,
                    color: "violet",
                    update: () => {
                        console.error("Please call update() on the FullSchedule object, not a Schedule's bar itself (period, day, week, or break bars)");
                    },
                    percentDone: 0,
                    timeLeft: Duration.fromMillis(0),
                    type: ProgressBarType.Schedule,
                    id: "break",
                    showDays: true,
                    showEndpoints: false
                }
                console.log("Starting Post-School Break!")
            }
        }
    }
}