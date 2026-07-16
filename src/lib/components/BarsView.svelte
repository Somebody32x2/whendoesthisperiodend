<script lang="ts">
    // The bar list; extracted from the old +page.svelte / mini page so the main page,
    // /mini and the admin preview all render identically.
    import type {BarSpec} from "$lib/engine/bars";
    import type {BarMetrics} from "$lib/engine/metrics";
    import ProgressBar from "./ProgressBar.svelte";
    import {calculateDecimals, getTimeLeftLabel} from "$lib/client/format";

    interface Props {
        bars: BarSpec[];
        metrics: Record<string, BarMetrics>;
        inPip?: boolean;
        mini?: boolean;
        decimalModifier?: number;
    }

    let {bars, metrics, inPip = false, mini = false, decimalModifier = 0}: Props = $props();

    // year/week time-left is hidden in PiP and mini (matches the old pages)
    function hideTimeLeft(bar: BarSpec): boolean {
        return (inPip || mini) && (bar.id === "year" || bar.id === "week");
    }
</script>

{#each bars as bar (bar.id)}
    {@const m = metrics[bar.id]}
    {#if m && m.timeLeft.isValid}
        <div class="{inPip || mini ? 'mt-4' : 'mt-10'} px-2">
            <div class="text-md sm:text-xl lg:text-2xl flex {inPip ? 'flex-row' : 'flex-col'} lg:flex-row justify-center">
                <p class="lg:mx-2 {inPip ? 'mr-2' : ''}">
                    <b class="text-lg sm:text-xl lg:text-2xl">{m.percentDone.toFixed(calculateDecimals(bar, decimalModifier))}</b>%<!--
                -->&nbsp;done&nbsp;with&nbsp;{bar.label.replaceAll(" ", " ")}</p>
                {#if !hideTimeLeft(bar)}
                    <p class="text-lg sm:text-xl lg:text-2xl">
                        (<b>{getTimeLeftLabel(m.timeLeft, !mini)}</b><!--
                    -->&nbsp;{m.timeLeft.toMillis() > 0 ? "left" : "ago"}<!--
                    --><b>{bar.showEndpoints && !mini ? ` | ${bar.start.toFormat("h:mma")} - ${bar.end.toFormat("h:mma")}`.replaceAll(" ", "\xa0") : ""}</b>)
                    </p>
                {/if}
            </div>
            <ProgressBar value={m.percentDone} color={bar.color}/>
        </div>
    {/if}
{/each}
