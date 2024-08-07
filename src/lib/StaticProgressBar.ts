import {DateTime, Duration} from "luxon";
import type {ProgressBar} from "$lib/ProgressBar";
import {getPercentDone, ProgressBarType} from "$lib/Utils";
import type {SvelteUIColor} from "@svelteuidev/core";


export class StaticProgressBar implements ProgressBar {
    type = ProgressBarType.Static;
    id: string;
    label: string;
    showDays: boolean;
    color: SvelteUIColor;
    showEndpoints: boolean;

    start: DateTime;
    end: DateTime;

    labelIsFullMessage = false;
    percentDone: number;
    timeLeft: Duration;


    constructor(id: string, label: string, start: DateTime, end: DateTime, showDays: boolean, color: SvelteUIColor, showEndpoints: boolean) {
        this.id = id;
        this.label = label;
        this.start = start; // DateTime inputs give ISO strings
        this.end = end;
        this.showDays = showDays;
        this.color = color;
        this.showEndpoints = showEndpoints;

        this.percentDone = 0;
        this.timeLeft = Duration.fromMillis(0);
    }

    update = (offset: Duration | undefined) => {
        this.percentDone = getPercentDone(this.start, this.end, DateTime.now().plus(offset ? offset : 0));
        this.timeLeft = this.end.diff(DateTime.now().plus(offset ? offset : 0));
        // console.log({percentDone: this.percentDone, start: this.start, end: this.end});
    }




}