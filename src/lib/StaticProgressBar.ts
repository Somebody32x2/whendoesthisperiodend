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

    start: DateTime;
    end: DateTime;

    labelIsFullMessage = false;
    percentDone: number;
    timeLeft: Duration;


    constructor(id: string, label: string, start: DateTime, end: DateTime, showDays: boolean, color: SvelteUIColor) {
        this.id = id;
        this.label = label;
        this.start = start; // DateTime inputs give ISO strings
        this.end = end;
        this.showDays = showDays;
        this.color = color;

        this.percentDone = 0;
        this.timeLeft = Duration.fromMillis(0);
    }

    update = () => {
        this.percentDone = getPercentDone(this.start, this.end);
        this.timeLeft = this.end.diffNow();
        // console.log({percentDone: this.percentDone, start: this.start, end: this.end});
    }



}