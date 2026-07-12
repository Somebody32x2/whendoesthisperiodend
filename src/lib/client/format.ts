// Display formatting shared by the main page, /mini and the admin preview.
import type {Duration} from "luxon";
import type {BarSpec} from "$lib/engine/bars";

export function getTimeLeftLabel(timeLeft: Duration, withMillis: boolean): string {
    const days = +timeLeft.toFormat("d");
    return timeLeft.toFormat(
        `${days > 0 ? `d' day${days !== 1 ? "s" : ""}, '` : ""}hh:mm:ss${withMillis ? ":SSS" : ""}`)
        .replaceAll(" ", "\xa0").replaceAll("-", "");
}

// Decimal places scale with the bar's total duration so long bars show more precision.
export function calculateDecimals(bar: BarSpec, decimalModifier = 0): number {
    return Math.max(0, Math.floor(Math.log10(bar.end.toMillis() - bar.start.toMillis()) - 3) + decimalModifier);
}
