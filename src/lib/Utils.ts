import  {DateTime} from "luxon";

export enum ProgressBarType {
    Static = "static",
    Daily = "daily",
    Periods = "periods",
    Ranges = "ranges",
    Schedule = "schedule",
}
export class Period {
    start: DateTime;
    end: DateTime;
    label: string;
    constructor(start: DateTime, end: DateTime, label: string) {
        this.start = start;
        this.end = end;
        this.label = label;
    }
}
export enum ImperialTimePostfix {
    AM = 0,
    PM = 12
}
export function Time(hours: number | string, minutes: number | undefined =undefined, AmPm: ImperialTimePostfix | undefined =undefined): DateTime {
    // Assert that hours is a number or string, and if a number, minutes and AmPm are defined
    if (typeof hours !== "string" && (minutes === undefined || AmPm === undefined)) {
        throw new Error("If hours is a number, minutes and AmPm must be defined");
    }
    if (typeof hours === "string") {
        return DateTime.fromFormat(hours.padStart(5, "0"), "HH:mm");
    } else {
        return DateTime.fromObject({
                hour: hours + AmPm!,
                minute: minutes,
            });
    }
}
export function nextWeekday(weekday: number, time: DateTime, endTime: DateTime): DateTime {
    if (time.weekday === weekday) {
        return endTime;
    }
    // End time has the hours and minutes we want, but the weekday we don't
    // So we need to get the next weekday and then set the hours and minutes

    // If the weekday is in the future, add the difference
    if (weekday > time.weekday) {
        return time.plus({days: weekday - time.weekday}).set({hour: endTime.hour, minute: endTime.minute});
    }
    // If the weekday is in the past, add the difference plus 7 days
    else {
        return time.plus({days: weekday - time.weekday + 7}).set({hour: endTime.hour, minute: endTime.minute});
    }
}
export function lastWeekday(weekday: number, time: DateTime, endTime: DateTime): DateTime {
    if (time.weekday === weekday) {
        return endTime;
    }
    // find the most recent weekday before the time and set the hours and minutes
    if (weekday < time.weekday) {
        return time.minus({days: time.weekday - weekday}).set({hour: endTime.hour, minute: endTime.minute});
    } else {
        return time.minus({days: time.weekday - weekday + 7}).set({hour: endTime.hour, minute: endTime.minute});
    }

}
export function getPercentDone(start: DateTime, end: DateTime, t: DateTime = DateTime.now()): number {
    const total = end.diff(start).toMillis();
    const done = t.diff(start).toMillis();
    return ((done / total) * 100);
}
export function toCurrentDay(time: DateTime, currentTime= DateTime.now()): DateTime {
    return DateTime.fromObject({
        year: currentTime.year,
        month: currentTime.month,
        day: currentTime.day,
        hour: time.hour,
        minute: time.minute,
        second: time.second,
        millisecond: time.millisecond,
    });
}
export function nthString(i: number) {
    return `${i + 1}${i + 1 === 1 ? "st" : (i + 1) % 10 === 2 ? "nd" : i + 1 === 3 ? "rd" : "th"}`;
}

export function safeFromUTCString(dateString: string): DateTime {
    const date = DateTime.fromISO(dateString);
    if (date.isValid) {
        return date;
    } else {
        // Try to pad any lone numbers with 0 to the left ("2024-5-1T8:30" -> "2024-05-01T08:30")
        const parts = dateString.split("T");
        const dateParts = parts[0].split("-");
        const timeParts = parts[1].split(":");
        console.log({
            year: parseInt(dateParts[0]),
            month: parseInt(dateParts[1]),
            day: parseInt(dateParts[2]),
            hour: parseInt(timeParts[0]),
            minute: timeParts[1] ? parseInt(timeParts[1]) : 0,
            second: timeParts[2] ? parseInt(timeParts[2]) : 0,
        })
        return DateTime.fromObject({
            year: parseInt(dateParts[0]),
            month: parseInt(dateParts[1]),
            day: parseInt(dateParts[2]),
            hour: parseInt(timeParts[0]),
            minute: timeParts[1] ? parseInt(timeParts[1]) : 0,
            second: timeParts[2] ? parseInt(timeParts[2]) : 0,
        });
    }
}