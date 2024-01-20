import  {DateTime} from "luxon";

export enum ProgressBarType {
    Static = "static",
    Daily = "daily",
    Periods = "periods",
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