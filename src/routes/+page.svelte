<script lang="ts">
    import {Progress} from '@svelteuidev/core';
    import {onMount} from "svelte";
    import {fullSchedule} from "$lib/WS";
    import {scheduleBarTypes} from "$lib/Schedule";
    import {DateTime} from "luxon";
    import type {ProgressBar} from "$lib/ProgressBar";

    let schedule = fullSchedule

    // let yearBar = new StaticProgressBar("SchoolYear", "This School Year", DateTime.local(2023, 8, 10, 8, 30), DateTime.local(2024, 5, 24, 14, 15), true, "indigo");
    // let yearBar = new StaticProgressBar("SchoolYear", "This School Year", DateTime.now().minus({minute: 0.5}), DateTime.now().plus({minute: 1}), true, "indigo");
    let updateCount = 0;
    let updateOnce = 0;
    let scheduleValues = new Array(scheduleBarTypes.length).fill(0);

    function getTimeLeftLabel(bar: ProgressBar) {
        return bar.timeLeft.toFormat(
            `${+bar.timeLeft.toFormat("d") > 0 ? `d' day${+bar.timeLeft.toFormat("d") !== 1 ? "s" : ""}, '` : ""
            }hh:mm:ss:SSS`)
            .replaceAll(" ", "\xa0").replaceAll('-', '')
    }

    let decimalModifier = 0;

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
            if (schedule.bars[scheduleBarTypes[0]]) document.title = `${schedule.bars[scheduleBarTypes[0]]?.percentDone.toFixed(1)}% | ${schedule.bars[scheduleBarTypes[0]]?.timeLeft.toFormat(`h:mm:ss`)}`;
            else if (schedule.bars[scheduleBarTypes[1]]) document.title = `${schedule.bars[scheduleBarTypes[1]]?.percentDone.toFixed(1)}% | ${schedule.bars[scheduleBarTypes[1]]?.timeLeft.toFormat(`h:mm:ss`)}`;
            else {
                document.title = "When Does This Period End?";
            }
            // if the date has changed, reload the page
            if (lastDate.toFormat("d") !== DateTime.now().toFormat("d")) {
                location.reload();
            }
            lastDate = DateTime.now();
        }, 1000)
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
        }, 23);
    });

    // let value1 = 0; // It seems we can only bind to a variable, not a property, so we need to use a variable
    // $: value1 = yearBar.percentDone;
</script>
<div class="w-full min-h-[100vh] flex items-center justify-center flex-col dark:bg-gray-800 dark:text-white relative">
    <a class="underline hidden lg:block absolute top-0 right-1" href="/whendoesthisperiodend_old">Back to Old
        Version</a>
    <h1 class="text-3xl md:text-5xl font-black mx-10 max-lg:mt-8">When Does This Period End?</h1>
    <!--    <p class="text-3xl m-2">⚠️️️WIP⚠️</p>-->
    <div class="w-full md:w-[75%] text-center my-10">
        {#key fullUpdateRequest}
            {#each Object.entries(schedule.bars) as [barInterval, bar], index (barInterval)}
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
        {/key}
        <!--        <p>{schedule.bars.day.end.toMillis() - schedule.bars.day.start.toMillis()}</p>-->
    </div>
</div>