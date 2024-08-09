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
    showEndpoints: boolean;

    start: DateTime;
    end: DateTime;

    percentDone: number;
    timeLeft: Duration;
    constructor(id: string, label: string, start: string, end: string, showDays: boolean, color: SvelteUIColor, showEndpoints: boolean) {
        this.id = id;
        this.label = label;
        this.start = DateTime.fromFormat(start, "HH:mm"); // Time inputs give HH:mm strings
        this.end = DateTime.fromFormat(end, "HH:mm");
        this.showDays = showDays;
        this.color = color;
        this.showEndpoints = showEndpoints;

        this.percentDone = 0;
        this.timeLeft = Duration.fromMillis(0);
    }

    update = (offset: Duration | undefined) => {
        this.percentDone = getPercentDone(toCurrentDay(this.start), toCurrentDay(this.end), DateTime.now().plus(offset ? offset : 0));
        this.timeLeft = toCurrentDay(this.end).diff(DateTime.now().plus(offset ? offset : 0));
    }



}