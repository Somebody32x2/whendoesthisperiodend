import {DateTime, Duration} from "luxon";
import type {ProgressBar} from "$lib/ProgressBar";
import {getPercentDone, ProgressBarType} from "$lib/Utils";
import type {SvelteUIColor} from "@svelteuidev/core";


export class PeriodsProgressBar implements ProgressBar {
    type = ProgressBarType.Static;
    id: string;
    label: string;
    showDays: boolean;
    color: SvelteUIColor;
    start: DateTime;
    end: DateTime;

    pStarts: DateTime[];
    pEnds: DateTime[];
    pLabels: string[];

    percentDone: number;
    timeLeft: Duration;

    constructor(id: string, start: string[], end: string[], periodLabels: string[], showDays: boolean, color: SvelteUIColor) {
        this.id = id;
        this.pLabels = periodLabels;
        this.pStarts = start.map( e => DateTime.fromISO(e)); // DateTime inputs give ISO strings
        this.pEnds = end.map(e => DateTime.fromISO(e));
        this.showDays = showDays;
        this.color = color;

        // Temporarily set vars to first period
        this.start = this.pStarts[0];
        this.end = this.pEnds[0];
        this.label = this.pLabels[0];

        this.percentDone = 0;
        this.timeLeft = Duration.fromMillis(0);

        // Name any "" labels after the n+1(st|nd|rd|th) period
        for (let i = 0; i < this.pLabels.length; i++) {
            if (this.pLabels[i] === "") {
                this.pLabels[i] = `${i + 1}${i + 1 === 1 ? "st" : (i + 1) % 10 === 2 ? "nd" : i + 1 === 3 ? "rd" : "th"} Period`;
            }
        }

    }

    update = () => {
        const now = DateTime.now().toMillis();
        let percentDone = -1;
        // Before first period, show time until first period from last period yesterday
        if (now < this.pStarts[0].toMillis()) {
            percentDone = getPercentDone(this.pEnds[this.pEnds.length-1].minus({days: 1}), this.pStarts[0]);
            this.label = `Time Until ${this.pLabels[0]}`;
            this.start = this.pEnds[this.pEnds.length-1].minus({days: 1});
            this.end = this.pStarts[0];
            this.timeLeft = this.pStarts[0].diffNow();
        }
        for (let i = 0; i < this.pStarts.length; i++) {
            const start = this.pStarts[i].toMillis();
            const end = this.pEnds[i].toMillis();
            if (now > start && now < end) {
                percentDone = getPercentDone(this.pStarts[i], this.pEnds[i]);
                this.label = `${this.pLabels[i]}`;
                this.start = this.pStarts[i];
                this.end = this.pEnds[i];
                this.timeLeft = this.pEnds[i].diffNow();
                break;
            } // Between periods, show time until next period
            else if (now > end && now < this.pStarts[i+1].toMillis()) {
                percentDone = getPercentDone(this.pEnds[i], this.pStarts[i+1]);
                this.label = `Time Until ${this.pLabels[i+1]}`;
                this.start = this.pEnds[i];
                this.end = this.pStarts[i+1];
                this.timeLeft = this.pStarts[i+1].diffNow();
                break;
            }
        }
        // After last period, show time until first period tomorrow
        if (now > this.pEnds[this.pEnds.length-1].toMillis()) {
            percentDone = getPercentDone(this.pEnds[this.pEnds.length-1], this.pStarts[0].plus({days: 1}));
            this.label = `Time Until ${this.pLabels[0]}`;
            this.start = this.pEnds[this.pEnds.length-1];
            this.end = this.pStarts[0].plus({days: 1});
            this.timeLeft = this.pStarts[0].plus({days: 1}).diffNow();
        }
        this.percentDone = percentDone;
    }


}