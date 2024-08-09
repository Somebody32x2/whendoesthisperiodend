import {DateTime, Duration} from "luxon";
import type {ProgressBar} from "$lib/ProgressBar";
import {getPercentDone, nthString, ProgressBarType} from "$lib/Utils";
import type {SvelteUIColor} from "@svelteuidev/core";


export class PeriodsProgressBar implements ProgressBar {
    type = ProgressBarType.Periods;
    id: string;
    label: string;
    showDays: boolean;
    color: SvelteUIColor;
    start: DateTime;
    end: DateTime;
    showEndpoints: boolean;

    pStarts: DateTime[];
    pEnds: DateTime[];
    pLabels: string[];

    percentDone: number;
    timeLeft: Duration;

    constructor(id: string, start: string[], end: string[], periodLabels: string[], showDays: boolean, color: SvelteUIColor, showEndpoints: boolean) {
        this.id = id;
        this.pLabels = periodLabels;
        this.pStarts = start.map( e => DateTime.fromISO(e)); // DateTime inputs give ISO strings
        this.pEnds = end.map(e => DateTime.fromISO(e));
        this.showDays = showDays;
        this.color = color;
        this.showEndpoints = showEndpoints;

        // Temporarily set vars to first period
        this.start = this.pStarts[0];
        this.end = this.pEnds[0];
        this.label = this.pLabels[0];

        this.percentDone = 0;
        this.timeLeft = Duration.fromMillis(0);

        // Name any "" labels after the n+1(st|nd|rd|th) period
        for (let i = 0; i < this.pLabels.length; i++) {
            if (this.pLabels[i] === "") {
                this.pLabels[i] = nthString(i) + " Period";
            }
        }

    }

    update = (offset: Duration | undefined) => {
        const now = DateTime.now().plus(offset ? offset : 0).toMillis();
        const nowTime = DateTime.now().plus(offset ? offset : 0);
        let percentDone = -1;
        // Before first period, show time until first period from last period yesterday
        if (now < this.pStarts[0].toMillis()) {
            percentDone = getPercentDone(this.pEnds[this.pEnds.length-1].minus({days: 1}), this.pStarts[0], nowTime);
            this.label = `Time Until ${this.pLabels[0]}`;
            this.start = this.pEnds[this.pEnds.length-1].minus({days: 1});
            this.end = this.pStarts[0];
            this.timeLeft = this.pStarts[0].diff(nowTime);
        }
        for (let i = 0; i < this.pStarts.length; i++) {
            const start = this.pStarts[i].toMillis();
            const end = this.pEnds[i].toMillis();
            if (now > start && now < end) {
                percentDone = getPercentDone(this.pStarts[i], this.pEnds[i], nowTime);
                this.label = `${this.pLabels[i]}`;
                this.start = this.pStarts[i];
                this.end = this.pEnds[i];
                this.timeLeft = this.pEnds[i].diff(nowTime);
                break;
            } // Between periods, show time until next period
            else if (now > end && now < this.pStarts[i+1].toMillis()) {
                percentDone = getPercentDone(this.pEnds[i], this.pStarts[i+1], nowTime);
                this.label = `Time Until ${this.pLabels[i+1]}`;
                this.start = this.pEnds[i];
                this.end = this.pStarts[i+1];
                this.timeLeft = this.pStarts[i+1].diff(nowTime);
                break;
            }
        }
        // After last period, show time until first period tomorrow
        if (now > this.pEnds[this.pEnds.length-1].toMillis()) {
            percentDone = getPercentDone(this.pEnds[this.pEnds.length-1], this.pStarts[0].plus({days: 1}), nowTime);
            this.label = `Time Until ${this.pLabels[0]}`;
            this.start = this.pEnds[this.pEnds.length-1];
            this.end = this.pStarts[0].plus({days: 1});
            this.timeLeft = this.pStarts[0].plus({days: 1}).diff(nowTime);
        }
        this.percentDone = percentDone;
    }


}