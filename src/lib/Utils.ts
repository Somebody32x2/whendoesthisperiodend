import  {DateTime} from "luxon";

export enum ProgressBarType {
    Static = "static",
    Daily = "daily",
    Periods = "periods",
    Ranges = "ranges",
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
enum ImperialTimePostfix {
    AM = 0,
    PM = 12
}
export function Time(hours: number | string, minutes: number | undefined =undefined, AmPm: ImperialTimePostfix | undefined =undefined): DateTime {
    if (typeof hours === "string") {
        return DateTime.fromFormat(hours, "HH:mm");
    } else return DateTime.fromObject({
        hour: hours + AmPm,
        minute: minutes,
    });
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
    if (weekday > time.weekday) {
        return time.minus({days: weekday - time.weekday}).set({hour: endTime.hour, minute: endTime.minute});
    }
    else {
        return time.minus({days: weekday - time.weekday + 7}).set({hour: endTime.hour, minute: endTime.minute});
    }

}
export function getPercentDone(start: DateTime, end: DateTime): number {
    const now = DateTime.now();
    const total = end.diff(start).toMillis();
    const done = now.diff(start).toMillis();
    return ((done / total) * 100);
}
export function toCurrentDay(time: DateTime): DateTime {
    const dateTime = DateTime.now();
    return DateTime.fromObject({
        year: dateTime.year,
        month: dateTime.month,
        day: dateTime.day,
        hour: time.hour,
        minute: time.minute,
        second: time.second,
        millisecond: time.millisecond,
    });
}
export function nthString(i: number) {
    return `${i + 1}${i + 1 === 1 ? "st" : (i + 1) % 10 === 2 ? "nd" : i + 1 === 3 ? "rd" : "th"}`;
}