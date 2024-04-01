<script>
    import {Progress} from '@svelteuidev/core';
    import {onMount} from "svelte";
    import {fullSchedule} from "$lib/WS";
    import {scheduleBarTypes} from "$lib/Schedule";
    import {DateTime} from "luxon";

    let schedule = fullSchedule

    // let yearBar = new StaticProgressBar("SchoolYear", "This School Year", DateTime.local(2023, 8, 10, 8, 30), DateTime.local(2024, 5, 24, 14, 15), true, "indigo");
    // let yearBar = new StaticProgressBar("SchoolYear", "This School Year", DateTime.now().minus({minute: 0.5}), DateTime.now().plus({minute: 1}), true, "indigo");
    let updateCount = 0;
    let updateOnce = 0;
    let scheduleValues = new Array(scheduleBarTypes.length).fill(0);

    function getTimeLeftLabel(bar) {
        return bar.timeLeft.toFormat(
            `${+bar.timeLeft.toFormat("d") > 0 ? `d' day${+bar.timeLeft.toFormat("d") !== 1 ? "s" : ""}, '` : ""
            }hh:mm:ss:SSS`)
            .replaceAll(" ", "\xa0").replaceAll('-', '')
    }

    let decimalModifier = 0;
    function calculateDecimals(bar) { // TODO: Don't run each update
        return Math.floor(Math.log10(bar.end.toMillis() - bar.start.toMillis()) - 3) + decimalModifier;
    }

    onMount(() => {
        // yearBar.update();
        updateCount++;
        updateOnce++;
        let lastDate = DateTime.now();
        setInterval(() => {
            if (schedule.bars[scheduleBarTypes[0]]) document.title = `${schedule.bars[scheduleBarTypes[0]].percentDone.toFixed(1)}% | ${schedule.bars[scheduleBarTypes[0]].timeLeft.toFormat(`h:mm:ss`)}`;
            else if (schedule.bars[scheduleBarTypes[1]]) document.title = `${schedule.bars[scheduleBarTypes[1]].percentDone.toFixed(1)}% | ${schedule.bars[scheduleBarTypes[1]].timeLeft.toFormat(`h:mm:ss`)}`;
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
                if (schedule.bars[scheduleBarTypes[i]]) scheduleValues[i] = schedule.bars[scheduleBarTypes[i]].percentDone;
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
    <a class="underline hidden lg:block absolute top-0 right-1" href="/whendoesthisperiodend_old">Back to Old Version</a>
    <h1 class="text-5xl font-black mx-10">When Does This Period End?</h1>
<!--    <p class="text-3xl m-2">⚠️️️WIP⚠️</p>-->
    <div class="w-full md:w-[75%] text-center my-10">
        {#each Object.keys(schedule.bars) as barInterval, index (barInterval)}
            <!--                <p>{barInterval}</p>-->
            {#if schedule.bars[barInterval] !== undefined}

                <div class="mt-10 px-2">
                    {#key updateCount}
                        <div class="text-xl lg:text-2xl flex flex-col lg:flex-row justify-center">
                            <p class="lg:mx-2"><b>{schedule.bars[barInterval].percentDone.toFixed(calculateDecimals(schedule.bars[barInterval]))}</b>% done
                                with {schedule.bars[barInterval].label}</p>
                            <p>
                                (<b>{getTimeLeftLabel(schedule.bars[barInterval])}</b><!--
                                -->&nbsp;{schedule.bars[barInterval].timeLeft.milliseconds > 0 ? "left" : 'ago'}<!--
                                --><b>{schedule.bars[barInterval].showEndpoints ? ` | ${schedule.bars[barInterval].start.toFormat("h:mma")} - ${schedule.bars[barInterval].end.toFormat("h:mma")}`.replaceAll(" ", "\xa0") : ''}</b>)
                            </p>
                        </div>
                    {/key}
                    <Progress
                            tween
                            bind:value={scheduleValues[index]}
                            color={schedule.bars[barInterval].color}
                            size="xs"
                            radius="sm"
                            striped
                            animate
                            class="w-full py-2"
                    />
                </div>
            {/if}
        {/each}
<!--        <p>{schedule.bars.day.end.toMillis() - schedule.bars.day.start.toMillis()}</p>-->
    </div>
</div>