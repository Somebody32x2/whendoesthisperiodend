import {DateTime, Duration} from "luxon";
import {getPercentDone, ProgressBarType, toCurrentDay} from "$lib/Utils";
import type {ProgressBar} from "$lib/ProgressBar";
import type {SvelteUIColor} from "@svelteuidev/core";

export class DailyProgressBar implements ProgressBar {
    type = ProgressBarType.Daily;
    id: string;
    label: string;
    showDays: boolean;
    color: SvelteUIColor;

    start: DateTime;
    end: DateTime;

    percentDone: number;
    timeLeft: Duration;
    constructor(id: string, label: string, start: string, end: string, showDays: boolean, color: SvelteUIColor) {
        this.id = id;
        this.label = label;
        this.start = DateTime.fromFormat(start, "HH:mm"); // Time inputs give HH:mm strings
        this.end = DateTime.fromFormat(end, "HH:mm");
        this.showDays = showDays;
        this.color = color;

        this.percentDone = 0;
        this.timeLeft = Duration.fromMillis(0);
    }

    update = () => {
        this.percentDone = getPercentDone(toCurrentDay(this.start), toCurrentDay(this.end));
        this.timeLeft = toCurrentDay(this.end).diffNow();
    }



}