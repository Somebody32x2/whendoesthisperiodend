<script lang="ts">
    import {Progress} from '@svelteuidev/core';
    import {onMount} from "svelte";
    import {fullSchedule} from "$lib/WS";
    import {scheduleBarTypes} from "$lib/Schedule";

    let schedule = fullSchedule

    // let yearBar = new StaticProgressBar("SchoolYear", "This School Year", DateTime.local(2023, 8, 10, 8, 30), DateTime.local(2024, 5, 24, 14, 15), true, "indigo");
    // let yearBar = new StaticProgressBar("SchoolYear", "This School Year", DateTime.now().minus({minute: 0.5}), DateTime.now().plus({minute: 1}), true, "indigo");
    let updateCount = 0;
    let updateOnce = 0;
    let scheduleValues = new Array(scheduleBarTypes.length).fill(0);
    onMount(() => {
        // yearBar.update();
        updateCount++;
        updateOnce++;
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
<div class="w-full h-[100vh] flex items-center justify-center flex-col dark:bg-gray-800 dark:text-white">
    <h1 class="text-6xl font-black mx-10">When Does This Period End?</h1>
    <p class="text-3xl m-10">⚠️️️WIP⚠️</p>
    <p class="text-3xl -mt-10">Coming Soon!</p>
    <p>Will support multiple schools!</p>
    <div class="w-full md:w-[75%] text-center mt-10">
        <!--{#key updateCount}-->
<!--            <div><b>{yearBar.percentDone.toFixed(7)}</b>% done with {yearBar.label}-->
<!--                (<b>{yearBar.timeLeft.toFormat(`${yearBar.showDays ? "d" : ""} 'days, 'hh:mm:ss:SSS`)}</b> left)-->
<!--            </div>-->
<!--        {/key}-->
<!--        <Progress-->
<!--                tween-->
<!--                bind:value={value1}-->
<!--                color={yearBar.color}-->
<!--                size="xs"-->
<!--                radius="sm"-->
<!--                striped-->
<!--                animate-->
<!--                class="w-full py-2"-->
<!--        />-->
        <!--{#key updateOnce}-->
            {#each Object.keys(schedule.bars) as barInterval, index (barInterval)}
                <p>{barInterval}</p>
                {#if schedule.bars[barInterval] !== undefined}

                    <div class="mt-10">
                        {#key updateCount}
                        <div><b>{schedule.bars[barInterval].percentDone.toFixed(7)}</b>% done with {schedule.bars[barInterval].label}
                            (<b>{schedule.bars[barInterval].timeLeft.toFormat(`${schedule.bars[barInterval].showDays ? "d' days, '" : ""}hh:mm:ss:SSS`).replaceAll('-', '')}</b> {schedule.bars[barInterval].timeLeft.milliseconds > 0 ? "left" : 'ago'})
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
        <!--{/key}-->
    </div>
</div>