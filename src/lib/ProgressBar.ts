import {ProgressBarType} from "./Utils";
import {type DateTime, Duration} from "luxon";
import type {SvelteUIColor} from "@svelteuidev/core";
interface UpdateFunction {
    (offset: Duration | undefined): void;
}
export interface ProgressBar {
    type: ProgressBarType;
    id: string;
    label: string;
    showDays: boolean;
    color: SvelteUIColor;
    update: UpdateFunction;
    start: DateTime;
    end: DateTime;
    timeLeft: Duration;
    percentDone: number;
    showEndpoints: boolean;
}


