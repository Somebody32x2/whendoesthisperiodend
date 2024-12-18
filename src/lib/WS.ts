import {FullSchedule} from "$lib/Schedule";
import {ImperialTimePostfix, Time} from "$lib/Utils";
import {DateTime, Interval} from "luxon";
import {RangesProgressBar} from "$lib/RangesProgressBar";

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
                DateTime.fromISO("2024-12-18"),
                DateTime.fromISO("2024-12-19"),
                DateTime.fromISO("2024-12-20"),
                DateTime.fromISO("2024-05-22"),
                DateTime.fromISO("2024-05-23"),
                DateTime.fromISO("2024-05-24")
            ],
            specificDayLabels: [
                ["Period #1 Exam ", "Power Hour", "Period #2 Exam"],
                ["Period #3 Exam ", "Power Hour", "Period #4 Exam"],
                ["Period #5 Exam ", "Power Hour", "Period #6 Exam"],
                ["Period #1 Exam ", "Power Hour", "Period #2 Exam"],
                ["Period #3 Exam ", "Power Hour", "Period #4 Exam"],
                ["Period #5 Exam ", "Power Hour", "Period #6 Exam"],
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
                DateTime.fromISO("2024-12-17"),
                DateTime.fromISO("2024-05-21"),
            ],
            "periods": [
                {start: Time("08:30"), end: Time("09:05"), label: "1st Period"},
                {start: Time("09:09"), end: Time("09:41"), label: "2nd Period"},
                {start: Time("09:45"), end: Time("10:17"), label: "3rd Period"},
                {start: Time("10:21"), end: Time("10:53"), label: "4th Period"},
                {start: Time("10:57"), end: Time("11:29"), label: "5th Period"},
                {start: Time("11:29"), end: Time("12:31"), label: "Power Hour"},
                {start: Time("12:31"), end: Time("13:06"), label: "6th Period"},
                {start: Time("13:10"), end: Time("15:30"), label: "7th Period Exam"}
            ]
        },
        {
            "label": "Long Friday",
            "daysApplicable": [
                DateTime.fromISO("2024-11-8"),
                DateTime.fromISO("2024-11-15"),
                DateTime.fromISO("2024-11-22"),
                DateTime.fromISO("2024-11-29"),
                DateTime.fromISO("2024-12-06"),
            ],
            "periods": [
                {start: Time("08:30"), end: Time("09:19"), label: "1st Period"},
                {start: Time("09:23"), end: Time("10:12"), label: "2nd Period"},
                {start: Time("10:16"), end: Time("11:05"), label: "3rd Period"},
                {start: Time("11:09"), end: Time("12:02"), label: "4th Period"},
                {start: Time("12:02"), end: Time("12:51"), label: "HR/Power Hour"},
                {start: Time("12:55"), end: Time("13:44"), label: "5th Period"},
                {start: Time("13:48"), end: Time("14:37"), label: "6th Period"},
                {start: Time("14:41"), end: Time("15:30"), label: "7th Period"}
            ]

        },
        {
            label: "Mental Health/Resiliency Day",
            daysApplicable: [
                DateTime.fromISO("2024-12-11")
            ],
            periods: [
                {start: Time("08:30"), end: Time("09:13"), label: "1st Period"},
                {start: Time("09:17"), end: Time("10:00"), label: "2nd Period"},
                {start: Time("10:04"), end: Time("10:47"), label: "3rd Period"},
                {start: Time("10:51"), end: Time("11:38"), label: "4th Period"},
                {start: Time("11:42"), end: Time("12:23"), label: "Homeroom/Lunch"},
                {start: Time("12:28"), end: Time("13:09"), label: "Lunch/Homeroom"},
                {start: Time("13:13"), end: Time("13:56"), label: "5th Period"},
                {start: Time("14:00"), end: Time("14:43"), label: "6th Period"},
                {start: Time("14:47"), end: Time("15:30"), label: "7th Period"}

                ]
        }
    ],
    // Breaks
    [
        {
            label: "Labor Day Weekend",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-08-30T14:15"), DateTime.fromISO("2023-09-02T23:59"))
        },
        {
            label: "Student Holiday",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-10-11T14:15"), DateTime.fromISO("2024-10-14T23:59"))
        },
        {
            label: "Vetrans' Day Weekend",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-11-08T14:15"), DateTime.fromISO("2024-11-11T23:59"))
        },
        {
            label: "Thanksgiving Break",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-11-22T14:15"), DateTime.fromISO("2024-12-01T23:59"))
        },
        {
            label: "Winter Break",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-12-20T14:15"), DateTime.fromISO("2025-01-05T23:59"))
        },
        {
            label: "🖤 Martin Luther King Jr. Day Weekend",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2025-01-17T14:15"), DateTime.fromISO("2025-01-20T23:59"))
        },
        {
            label: "President's Day Weekend",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2025-02-14T14:15"), DateTime.fromISO("2025-02-17T23:59"))
        },
        {
            label: "Long Weekend - Student Holiday",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-03-14T15:30"), DateTime.fromISO("2024-03-16T23:59"))
        },
        {
            label: "Spring Break",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-03-14T14:15"), DateTime.fromISO("2024-03-23T23:59"))
        },
        {
            label: "Memorial Day Weekend",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2025-05-23T14:15"), DateTime.fromISO("2025-05-26T23:59"))
        },
        {
            label: "Summer Break",
            periods: [],
            interval: Interval.fromDateTimes(DateTime.fromISO("2024-05-24T14:15"), DateTime.fromISO("2024-08-11T23:59"))
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
            // [DateTime.fromISO("2024-03-14T08:30"), DateTime.fromISO("2024-05-24T14:15")],
            [DateTime.fromISO("2024-08-12T08:30"), DateTime.fromISO("2024-10-11T14:15")],
            [DateTime.fromISO("2024-10-15T08:30"), DateTime.fromISO("2025-01-09T14:15")],
            [DateTime.fromISO("2025-01-10T08:30"), DateTime.fromISO("2025-03-13T14:15")],
            [DateTime.fromISO("2025-03-24T08:30"), DateTime.fromISO("2025-05-28T14:15")],
        ], ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"], true, "yellow", false),
        semester: new RangesProgressBar("semesters", [
            // [DateTime.fromISO("2024-01-08T15:30"), DateTime.fromISO("2024-05-24T14:15")],
            [DateTime.fromISO("2024-08-12T08:30"), DateTime.fromISO("2025-01-09T14:15")],
            [DateTime.fromISO("2025-01-9T14:15"), DateTime.fromISO("2025-05-28T14:15")],
        ], ["1st Semester", "2nd Semester"], true, "lime", false),
        // year: new StaticProgressBar("year", "the School Year", DateTime.fromISO("2023-08-10T08:30"), DateTime.fromISO("2024-05-24T14:15"), true, "green", false),
        year: new RangesProgressBar("year", [
            // [DateTime.fromISO("2023-08-10T08:30"), DateTime.fromISO("2024-05-24T14:15")],
            [DateTime.fromISO("2024-08-12T08:30"), DateTime.fromISO("2025-05-28T14:15")],
        ], ["the School Year"], true, "green", false),
    })