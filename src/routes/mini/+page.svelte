<script lang="ts">
    import {Progress} from '@svelteuidev/core';
    import {onMount} from "svelte";
    import {fullSchedule} from "$lib/WS";
    import {scheduleBarTypes} from "$lib/Schedule";
    import {DateTime} from "luxon";
    import type {ProgressBar} from "$lib/ProgressBar";
    import {StaticProgressBar} from "$lib/StaticProgressBar";
    import {safeFromUTCString} from "$lib/Utils";

    let schedule = fullSchedule

    // let yearBar = new StaticProgressBar("SchoolYear", "This School Year", DateTime.local(2023, 8, 10, 8, 30), DateTime.local(2024, 5, 24, 14, 15), true, "indigo");
    // let yearBar = new StaticProgressBar("SchoolYear", "This School Year", DateTime.now().minus({minute: 0.5}), DateTime.now().plus({minute: 1}), true, "indigo");
    let updateCount = 0;
    let updateOnce = 0;
    let scheduleValues = new Array(scheduleBarTypes.length).fill(0);
    let extraBars = {}
    let extraValues = new Array().fill(0);
    export let mini_viewer = true;

    function getTimeLeftLabel(bar: ProgressBar) {
        return bar.timeLeft.toFormat(
            `${+bar.timeLeft.toFormat("d") > 0 ? `d' day${+bar.timeLeft.toFormat("d") !== 1 ? "s" : ""}, '` : ""
            }hh:mm:ss`)
            .replaceAll(" ", "\xa0").replaceAll('-', '')
    }

    let decimalModifier = -1;

    function calculateDecimals(bar: ProgressBar) { // TODO: Don't run each update
        return Math.floor(Math.log10(bar.end.toMillis() - bar.start.toMillis()) - 3) + decimalModifier;
    }

    let lastBars: string[] = [];
    let fullUpdateRequest = 0;
    onMount(() => {
        // yearBar.update();
        updateCount++;
        updateOnce++;
        let lastDate = DateTime.now();

        setInterval(() => {
            // yearBar.update();
            schedule.update();
            for (let i = 0; i < scheduleBarTypes.length; i++) {
                // console.log({i, type: scheduleBarTypes[i], schedule: schedule.bars})
                if (schedule.bars[scheduleBarTypes[i]]) scheduleValues[i] = schedule.bars[scheduleBarTypes[i]]?.percentDone;
            }
            let bars = Object.keys(schedule.bars).filter(bar => schedule.bars[bar] !== undefined)
            if (bars.some(bar => !lastBars.includes(bar)) || bars.length !== lastBars.length) {
                console.log({bars, lastBars, fullUpdateRequest})
                lastBars = bars;
                fullUpdateRequest++;
            }
            // value1 = yearBar.percentDone;
            updateCount++;
            // console.log(yearBar.percentDone.toFixed(7));
        }, 123);
    });

    // let value1 = 0; // It seems we can only bind to a variable, not a property, so we need to use a variable
    // $: value1 = yearBar.percentDone;
</script>
<div class="w-full min-h-[100vh] flex items-center justify-center flex-col dark:bg-gray-800 dark:text-white relative">
    <!--    <p class="text-3xl m-2">⚠️️️WIP⚠️</p>-->
    <div class="w-[95%] md:w-[75%] text-center">
        {#key fullUpdateRequest}
            {#each Object.entries(schedule.bars) as [barInterval, bar], index (barInterval)}
                {#if !!bar && bar.start && bar.end && bar.timeLeft.isValid}
                    <div class="{index !== 1 ? 'mt-2' : ''} px-2">
                        {#key updateCount}
                            <div class="text-md sm:text-xl lg:text-2xl flex lg:flex-row justify-center">
                                <p class="lg:mx-2">
                                    <b class="text-lg sm:text-xl lg:text-2xl">{bar.percentDone.toFixed(calculateDecimals(bar))}</b>%
                                    done
                                    with {bar.label}</p>
                                {#if barInterval != 'year' && barInterval != 'week'}
                                <p class="text-lg ml-1 lg:ml-0 sm:text-xl lg:text-2xl ">
                                    (<b>{getTimeLeftLabel(bar)}</b><!--
                                -->&nbsp;{bar.timeLeft.milliseconds > 0 ? "left" : 'ago'}<!--
                                --><b>{bar.showEndpoints && !mini_viewer ? ` | ${bar.start.toFormat("h:mma")} - ${bar.end.toFormat("h:mma")}`.replaceAll(" ", "\xa0") : ''}</b>)
                                </p>
                                {/if}
                            </div>
                        {/key}
                        <Progress
                                tween
                                bind:value={scheduleValues[index]}
                                color={bar.color}
                                size="xs"
                                radius="sm"
                                striped
                                animate
                                class="w-full py-2"
                        />
                    </div>
                {/if}
            {/each}
            {#each Object.entries(extraBars) as [barInterval, bar], index (barInterval)}
                <!--                <p>{barInterval}</p>-->
                {#if !!bar}
                    <div class="mt-10 px-2">
                        {#key updateCount}
                            <div class="text-md sm:text-xl lg:text-2xl flex flex-col lg:flex-row justify-center">
                                <p class="lg:mx-2">
                                    <b class="text-lg sm:text-xl lg:text-2xl">{bar.percentDone.toFixed(calculateDecimals(bar))}</b>%
                                    done
                                    with {bar.label}</p>
                                <!--{#if barInterval === scheduleBarTypes[0] && bar.label !== ""}-->
                                <!--    <p></p>-->
                                <!--{/if}-->
                                <p class="text-lg sm:text-xl lg:text-2xl">
                                    (<b>{getTimeLeftLabel(bar)}</b><!--
                                -->&nbsp;{bar.timeLeft.milliseconds > 0 ? "left" : 'ago'}<!--
                                --><b>{bar.showEndpoints ? ` | ${bar.start.toFormat("h:mma")} - ${bar.end.toFormat("h:mma")}`.replaceAll(" ", "\xa0") : ''}</b>)
                                </p>
                            </div>
                        {/key}
                        <Progress
                                tween
                                bind:value={extraValues[index]}
                                color={bar.color}
                                size="xs"
                                radius="sm"
                                striped
                                animate
                                class="w-full py-2"
                        />
                    </div>
                {/if}
            {/each}
        {/key}
        <!--        <p>{schedule.bars.day.end.toMillis() - schedule.bars.day.start.toMillis()}</p>-->
    </div>
</div>