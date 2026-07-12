// The only thing the fast UI tick loop runs: progress percentages and time left
// for the current snapshot's bars. Everything else waits for the next snapshot.
import type {DateTime, Duration} from "luxon";
import type {BarSpec} from "./bars";
import {getPercentDone} from "$lib/Utils";

export interface BarMetrics {
    percentDone: number;
    timeLeft: Duration;
}

export function barMetrics(bar: BarSpec, now: DateTime): BarMetrics {
    return {
        percentDone: getPercentDone(bar.start, bar.end, now),
        timeLeft: bar.end.diff(now)
    };
}
