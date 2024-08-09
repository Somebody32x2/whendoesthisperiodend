import {DateTime, Duration} from "luxon";
import type {ProgressBar} from "$lib/ProgressBar";
import {getPercentDone, ProgressBarType} from "$lib/Utils";
import type {SvelteUIColor} from "@svelteuidev/core";


export class RangesProgressBar implements ProgressBar {
    type = ProgressBarType.Ranges;
    id: string;
    label: string;
    showDays: boolean;
    color: SvelteUIColor;
    start: DateTime;
    end: DateTime;
    showEndpoints: boolean;

    ranges: [DateTime, DateTime][];
    rangeLabels: string[];

    percentDone: number;
    timeLeft: Duration;

    // RangeLabels is optional, if not provided, will be filled in nth eachRangeLabel, and if neither provided, will be filled in as nth Range
    constructor(id: string, ranges: [DateTime, DateTime][], rangeLabels: string[] | undefined, showDays: boolean, color: SvelteUIColor, showEndpoints: boolean, eachRangeLabel: string | undefined=undefined) {
        this.id = id;
        this.rangeLabels = rangeLabels ?? ranges.map(_ => ""); // If no labels, use empty strings, will be filled in later
        this.ranges = ranges;
        this.showDays = showDays;
        this.color = color;
        this.showEndpoints = showEndpoints;

        // Temporarily set vars to first period
        this.start = this.ranges[0][0];
        this.end = this.ranges[0][1];
        this.label = this.rangeLabels[0];

        this.percentDone = 0;
        this.timeLeft = Duration.fromMillis(0);

        // Name any "" labels after the n+1(st|nd|rd|th) period
        for (let i = 0; i < this.rangeLabels.length; i++) {
            if (this.rangeLabels[i] === "") {
                this.rangeLabels[i] = `${i + 1}${i + 1 === 1 ? "st" : (i + 1) % 10 === 2 ? "nd" : i + 1 === 3 ? "rd" : "th"} ${eachRangeLabel ?? "Range"}`;
            }
        }

    }

    update = (offset: Duration | undefined) => {
        const now = DateTime.now().plus(offset ? offset : 0).toMillis();
        const nowTime = DateTime.now().plus(offset ? offset : 0);
        let percentDone = -1;
        // Before first range, show negative percent done and time left of the first range
        if (now < this.ranges[0][0].toMillis()) {
            percentDone = getPercentDone(this.ranges[0][0], this.ranges[0][1], nowTime);
            this.label = this.rangeLabels[0]
            this.start = this.ranges[0][0];
            this.end = this.ranges[0][1]
            // this.end = DateTime.now();
            this.timeLeft = this.ranges[0][0].diff(nowTime);
        }

        for (let i = 0; i < this.ranges.length; i++) {
            const start = this.ranges[i][0].toMillis();
            const end = this.ranges[i][1].toMillis();
            if (now > start && now < end) {
                percentDone = getPercentDone(this.ranges[i][0], this.ranges[i][1], nowTime);
                this.label = `${this.rangeLabels[i]}`;
                this.start = this.ranges[i][0];
                this.end = this.ranges[i][1];
                this.timeLeft = this.ranges[i][1].diff(nowTime);
                break;
            } // Between periods, show time until next period
            else if (now > end && i < this.ranges.length - 1 && now < this.ranges[i+1][0].toMillis()) {
                percentDone = getPercentDone(this.ranges[i][1], this.ranges[i+1][0], nowTime);
                this.label = `Time Until ${this.rangeLabels[i+1]}`;
                this.start = this.ranges[i][1];
                this.end = this.ranges[i+1][0];
                this.timeLeft = this.ranges[i+1][0].diff(nowTime);
                break;
            }
        }
        // After last period show over 100% done and time left of the last period
        let lastRange = this.ranges[this.ranges.length - 1];
        if (now > lastRange[1].toMillis() && percentDone === -1) {
            this.label = this.rangeLabels[this.rangeLabels.length - 1];
            this.start = lastRange[0];
            this.end = lastRange[1];
            this.timeLeft = lastRange[1].diff(nowTime);
            percentDone = getPercentDone(lastRange[0], lastRange[1], nowTime);
        }
        this.percentDone = percentDone;
    }


}