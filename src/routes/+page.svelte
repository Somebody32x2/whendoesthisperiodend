<script lang="ts">
    import {Progress} from '@svelteuidev/core';
    import {StaticProgressBar} from '$lib/StaticProgressBar';
    import {DateTime} from "luxon";
    import {onMount} from "svelte";

    let yearBar = new StaticProgressBar("SchoolYear", "This School Year", DateTime.local(2023, 8, 10, 8, 30), DateTime.local(2024, 5, 24, 3, 30), true, "indigo");
    // let yearBar = new StaticProgressBar("SchoolYear", "This School Year", DateTime.now().minus({minute: 0.5}), DateTime.now().plus({minute: 1}), true, "indigo");
    let updateCount = 0;
    let updateOnce = 0;
    onMount(() => {
        yearBar.update();
        updateCount++;
        updateOnce++;
        setInterval(() => {
            yearBar.update();
            value1 = yearBar.percentDone;
            updateCount++;
            // console.log(yearBar.percentDone.toFixed(7));
        }, 23);
    });
    let value1 = 0; // It seems we can only bind to a variable, not a property, so we need to use a variable
    $: value1 = yearBar.percentDone;
</script>
<div class="w-full h-[100vh] flex items-center justify-center flex-col dark:bg-gray-800 dark:text-white">
    <h1 class="text-6xl font-black mx-10">When Does This Period End?</h1>
    <p class="text-3xl m-10">⚠️️️WIP⚠️</p>
    <p class="text-3xl -mt-10">Coming Soon!</p>
    <p>Will support multiple schools!</p>
    <div class="w-full md:w-[75%] text-center mt-10">
        {#key updateCount}
            <div><b>{yearBar.percentDone.toFixed(7)}</b>% done with {yearBar.label}
                (<b>{yearBar.timeLeft.toFormat(`${yearBar.showDays ? "d" : ""} 'days, 'hh:mm:ss:SSS`)}</b> left)
            </div>
        {/key}
        <Progress
                tween
                bind:value={value1}
                color={yearBar.color}
                size="xs"
                radius="sm"
                striped
                animate
                class="w-full py-2"
        />
    </div>
</div>