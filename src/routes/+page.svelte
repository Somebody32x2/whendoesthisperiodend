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
    let extraBars = {
        "grad": new StaticProgressBar("grad", "Senior Graduation 🎉", DateTime.fromISO("2025-08-11T08:30"), DateTime.fromISO("2026-05-21T08:30"), true, "yellow", false),
    }
    let extraValues = new Array().fill(0);

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

    let pictureInPictureEnabled = true;
    let lastBars: string[] = [];
    let fullUpdateRequest = 0;
    onMount(() => {
        pictureInPictureEnabled = ('documentPictureInPicture' in window);
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
            for (let index = 0; index < Object.keys(extraBars).length; index++) {
                extraBars[Object.keys(extraBars)[index]].update();
                extraValues[index] = extraBars[Object.keys(extraBars)[index]]?.percentDone;
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

    let inPip = false;
    let pipWindow = null;
    let mainProgressBars = null;

    function handlePiPClose() {
        mainProgressBars.removeAttribute('data-pip');
        mainProgressBars.classList.remove('pip');
        document.getElementById("constantPageContentContainer").append(mainProgressBars);
        inPip = false;
        window.documentPictureInPicture.window.close();
    }

    async function handleTryPnp() {
        if (inPip) {
            handlePiPClose();
            return;
        }
        pipWindow = await window.documentPictureInPicture.requestWindow({
            width: mainProgressBars.clientWidth,
            height: mainProgressBars.clientHeight,
        });
        // Copy style sheets over from the initial document
        // so that the player looks the same.
        [...document.styleSheets].forEach((styleSheet) => {
            try {
                const cssRules = [...styleSheet.cssRules]
                    .map((rule) => rule.cssText)
                    .join("");
                const style = document.createElement("style");

                style.textContent = cssRules;
                pipWindow.document.head.appendChild(style);
            } catch (e) {
                const link = document.createElement("link");

                link.rel = "stylesheet";
                link.type = styleSheet.type;
                link.media = styleSheet.media;
                link.href = styleSheet.href;
                pipWindow.document.head.appendChild(link);
            }
        });
        let pipContainer = pipWindow.document.createElement('div');
        pipContainer.setAttribute('class', document.getElementById("pageContainer").getAttribute('class'));
        pipContainer.setAttribute('data-pip', 'true');
        pipContainer.classList.add('pip')
        pipContainer.appendChild(mainProgressBars);
        pipWindow.document.body.appendChild(pipContainer);
        inPip = true;

        pipWindow.addEventListener('pagehide', () => {
            handlePiPClose();
        });
    }

    // let value1 = 0; // It seems we can only bind to a variable, not a property, so we need to use a variable
    // $: value1 = yearBar.percentDone;
</script>
<div class="w-full min-h-[100vh] flex items-center justify-center flex-col dark:bg-gray-800 dark:text-white relative"
     id="pageContainer">
    <!--    <a class="underline hidden lg:block absolute top-0 right-1" href="{'whendoesthisperiodend_old'}">Back to Old-->
    <!--        Version</a>-->
    <h1 class="text-3xl md:text-5xl font-black mx-10 max-lg:mt-8">When Does This Period End?</h1>
    <!--    <p class="text-3xl m-2">⚠️️️WIP⚠️</p>-->
    <div class="w-full flex items-center justify-center" id="constantPageContentContainer">
        <!-- To keep content centered when placed back from PiP-->
        <div class="w-full  text-center {inPip ? 'md:w-[95%]' : 'my-10 md:w-[75%]'}" id="mainProgressBars" bind:this={mainProgressBars}>
            {#key fullUpdateRequest}
                {#each Object.entries(schedule.bars) as [barInterval, bar], index (barInterval)}
                    <!--                <p>{barInterval}</p>-->
                    {#if !!bar && bar.start && bar.end && bar.timeLeft.isValid}
                        <div class="{inPip ? 'mt-4' : 'mt-10'} px-2">
                            {#key updateCount}
                                <div class="text-md sm:text-xl lg:text-2xl flex {inPip ? 'flex-row' : 'flex-col'} lg:flex-row justify-center">
                                    <p class="lg:mx-2 {inPip ? 'mr-2' : ''}">
                                        <b class="text-lg sm:text-xl lg:text-2xl">{bar.percentDone.toFixed(calculateDecimals(bar))}</b>%<!--
                                    -->&nbsp;done&nbsp;with&nbsp;{bar.label.replaceAll(" ", '\u00A0')}</p>
                                    <!--{#if barInterval === scheduleBarTypes[0] && bar.label !== ""}-->
                                    <!--    <p></p>-->
                                    <!--{/if}-->
                                    {#if !inPip || (barInterval != 'year' && barInterval != 'week')}
                                        <p class="text-lg sm:text-xl lg:text-2xl">
                                            (<b>{getTimeLeftLabel(bar)}</b><!--
                                    -->&nbsp;{bar.timeLeft.milliseconds > 0 ? "left" : 'ago'}<!--
                                    --><b>{bar.showEndpoints ? ` | ${bar.start.toFormat("h:mma")} - ${bar.end.toFormat("h:mma")}`.replaceAll(" ", "\xa0") : ''}</b>)
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
                {#each inPip ? [] : Object.entries(extraBars) as [barInterval, bar], index (barInterval)}
                    <!--                <p>{barInterval}</p>-->
                    {#if !!bar}
                        <div class="{inPip ? (index !== 1 ? 'mt-2' : '') : 'mt-10'} px-2">
                            {#key updateCount}
                                <div class="text-md sm:text-xl lg:text-2xl flex {inPip ? '' : 'flex-col'} lg:flex-row justify-center">
                                    <p class="lg:mx-2 {inPip ? 'mr-4' : ''}">
                                        <b class="text-lg sm:text-xl lg:text-2xl ">{@html bar.percentDone.toFixed(calculateDecimals(bar))}</b>%
                                        done&nbsp;with&nbsp;{bar.label.replaceAll(" ", '\u00A0')}</p>
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
    {#if inPip}
        <p class="my-16">Popped out to Picture-in-Picture. <a on:click={handleTryPnp}
                                                              class="underline hover:text-gray-400 hover:decoration-wavy cursor-pointer">Click
            here</a> or on the X to return here.</p>
    {/if}
    {#if pictureInPictureEnabled}
        <div class="w-[75%] flex items-around">
            <button on:click={handleTryPnp} id="pnpToggle" class="w-10 h-10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="dark:fill-white fill-black"
                     id="Picture-In-Picture--Streamline-Tabler-Filled" height="24" width="24"
                >
                    <desc>
                        Picture In Picture Streamline Icon: https://streamlinehq.com
                    </desc>
                    <path d="M19 4a3 3 0 0 1 3 3v4a1 1 0 0 1 -2 0V7a1 1 0 0 0 -1 -1H5a1 1 0 0 0 -1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 1 0 2H5a3 3 0 0 1 -3 -3V7a3 3 0 0 1 3 -3z"
                          stroke-width="1"></path>
                    <path d="M20 13a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-5a2 2 0 0 1 -2 -2v-3a2 2 0 0 1 2 -2z"
                          stroke-width="1"></path>
                </svg>
            </button>
        </div>
    {/if}

</div>