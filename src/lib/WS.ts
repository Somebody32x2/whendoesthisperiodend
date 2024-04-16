import {FullSchedule} from "$lib/Schedule";
import {ImperialTimePostfix, Time} from "$lib/Utils";
import {DateTime, Interval} from "luxon";
import {RangesProgressBar} from "$lib/RangesProgressBar";
import {StaticProgressBar} from "$lib/StaticProgressBar";

export let fullSchedule = new FullSchedule(
    // Normal Schedules
    [
        {
            label: "Weekday",
            days: [1, 2, 3, 4],
            periods: [
                {start: Time("08:30"), end: Time("09:19"), label: "1st Period"},
                {start: Time("09:23"), end: Time("10:12"), label: "2nd Period"},
                {start: Time("10:16"), end: Time("11:05"), label: "3rd Period"},
                {start: Time("11:09"), end: Time("12:02"), label: "4th Period"},
                {start: Time("12:02"), end: Time("12:51"), label: "Power Hour"},
                {start: Time("12:55"), end: Time("13:44"), label: "5th Period"},
                {start: Time("13:48"), end: Time("14:37"), label: "6th Period"},
                {start: Time("14:41"), end: Time("15:30"), label: "7th Period"}],
            endWithWeekend: false
        },
        {
            label: "Friday",
            days: [5],
            periods: [
                {start: Time("08:30"), end: Time("9:08"), label: "1st Period"},
                {start: Time("09:12"), end: Time("9:50"), label: "2nd Period"},
                {start: Time("09:54"), end: Time("10:32"), label: "3rd Period"},
                {start: Time("10:36"), end: Time("11:14"), label: "4th Period"},
                {start: Time("11:14"), end: Time("11:43"), label: "Homeroom/Lunch"},
                {start: Time("11:44"), end: Time("12:13"), label: "Lunch/Homeroom"},
                {start: Time("12:13"), end: Time("12:51"), label: "5th Period"},
                {start: Time("12:55"), end: Time("13:33"), label: "6th Period"},
                {start: Time("13:37"), end: Time("14:15"), label: "7th Period"},
            ],
            endWithWeekend: true
        }
    ],
    // Special Schedules
    [
        {
            "label": "Two Exams",
            "daysApplicable": [
                DateTime.fromISO("2024-05-22"),
                DateTime.fromISO("2024-05-23"),
                DateTime.fromISO("2024-05-24")
            ],
            specificDayLabels: [
                ["Period #5 Exam ", "Power Hour", "Period #6 Exam"],
                ["Period #3 Exam ", "Power Hour", "Period #4 Exam"],
                ["Period #1 Exam ", "Power Hour", "Period #2 Exam"],
            ],
            "periods": [
                {start: Time("8:30"), end: Time("10:55"), label: "Exam 1"},
                {start: Time("10:55"), end: Time("11:55"), label: "Power Hour"},
                {start: Time("11:55"), end: Time("14:15"), label: "Exam 2"},
            ]
        },
        {
            "label": "One Exam",
            "daysApplicable": [
                DateTime.fromISO("2024-05-21")
            ],
            "periods": [
                {start: Time("08:30"), end: Time("09:05"), label: "1st Period"},
                {start: Time("09:09"), end: Time("09:41"), label: "2nd Period"},
                {start: Time("09:45"), end: Time("10:17"), label: "3rd Period"},
                {start: Time("10:21"), end: Time("10:53"), label: "4th Period"},
                {start: Time("10:57"), end: Time("11:29"), label: "5th Period"},
                {start: Time("11:29"), end: Time("12:31"), label: "Power Hour"},
                {start: Time("12:31"), end: Time("13:06"), label: "6th Period"},
                {start: Time("13:10"), end: Time("15:30"), label: "7th Period"}
            ]
        }
    ],
    // Breaks
    [
        {
            label: "President's Day Weekend",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-02-16T14:15"), DateTime.fromISO("2024-02-19T23:59"))
        },
        {
            label: "Long Weekend - Student Holiday",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-03-14T15:30"), DateTime.fromISO("2024-03-17T23:59"))
        },
        {
            label: "Spring Break",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-03-22T14:15"), DateTime.fromISO("2024-03-31T23:59"))
        },
        // {
        //     label: "Memorial Day Weekend",
        //     periods: [],
        //     interval: Interval.fromDateTimes(DateTime.fromISO("2024-05-24T14:15"), DateTime.fromISO("2024-05-27T23:59"))
        // }
        {
            label: "Summer Break",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-05-24T14:15"), DateTime.fromISO("2024-08-10T23:59"))
        }
    ],
    {
        startDay: 5,
        endDay: 1,
        startTime: Time(2, 15, ImperialTimePostfix.PM),
        endTime: Time(8, 30, ImperialTimePostfix.AM)
    },
    {
        quarter: new RangesProgressBar("quarters", [
            [DateTime.fromISO("2024-01-08T15:30"), DateTime.fromISO("2024-03-13T15:30")],
            [DateTime.fromISO("2024-03-14T08:30"), DateTime.fromISO("2024-05-24T14:15")],
        ], ["3rd Quarter", "4th Quarter"], true, "yellow", false),
        semester: new RangesProgressBar("semesters", [[DateTime.fromISO("2024-01-08T15:30"), DateTime.fromISO("2024-05-24T14:15")]], ["2nd Semester"], true, "lime", false),
        year: new StaticProgressBar("year", "the School Year", DateTime.fromISO("2023-08-10T08:30"), DateTime.fromISO("2024-05-24T14:15"), true, "green", false),
    })