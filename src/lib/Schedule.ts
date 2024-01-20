import type {Period} from "$lib/Utils";
import { DateTime, Interval, type WeekdayNumbers} from "luxon";


interface Schedule {
    label: String;
    periods: Period[];
}
interface NormalSchedule extends Schedule {
    label: String;
    days: WeekdayNumbers[]
    periods: Period[];
}

interface SpecialSchedule extends Schedule {
    label: String;
    periods: Period[];
    daysApplicable: DateTime[];
}
interface Break {
    label: String;
    interval: Interval;
}
const BREAKSCHEDULE: Schedule = {
    label: "Break",
    periods: [],
}
class FullSchedule {
    // normalSchedules: NormalSchedule[] // Friday, Weekday
    // specialSchedules: SpecialSchedule[] // 2Exam, 1Exam
    // breaks: Break[] // Spring Break, Winter Break, Thanksgiving Break, etc.

    todaySchedule: Schedule;
    constructor(normalSchedules: NormalSchedule[], specialSchedules: SpecialSchedule[], breaks: Break[]) {
        // this.normalSchedules = normalSchedules;
        // this.specialSchedules = specialSchedules;
        // this.breaks = breaks;

        // Check if we are in a break
        for (const break_ of breaks) {
            if (break_.interval.contains(DateTime.now())) {
                this.todaySchedule = BREAKSCHEDULE;
                return;
            }
        }
        // Check if we are in a special schedule
        for (const specialSchedule of specialSchedules) {
            for (const day of specialSchedule.daysApplicable) {
                if (day.hasSame(DateTime.now(), "day")) {
                    this.todaySchedule = specialSchedule;
                    return;
                }
            }
        }
        // Check if we are in a normal schedule
        for (const normalSchedule of normalSchedules) {
            for (const day of normalSchedule.days) {
                if (day === DateTime.now().weekday) {
                    this.todaySchedule = normalSchedule;
                    return;
                }
            }
        }
        throw new Error("No schedule found for today");
    }
}