<script lang="ts">
    import {onMount} from "svelte";
    import BarsView from "$lib/components/BarsView.svelte";
    import SchoolSwitcher from "$lib/components/SchoolSwitcher.svelte";
    import ConfigDrawer from "$lib/components/ConfigDrawer.svelte";
    import {ScheduleRunner} from "$lib/client/runner.svelte";
    import {fetchSchoolConfig, fetchSchools} from "$lib/client/api";
    import {prefs} from "$lib/stores/prefs.svelte";
    import type {SchoolConfig, SchoolSummary} from "$lib/config/types";

    const runner = new ScheduleRunner();
    let schools = $state<SchoolSummary[]>([]);
    let selected = $state("");
    let config = $state<SchoolConfig | null>(null);
    let loadError = $state("");

    async function selectSchool(id: string) {
        selected = id;
        prefs.setSchool(id);
        loadError = "";
        if (id === "custom") {
            config = null;
            runner.setConfig(null);
            return;
        }
        try {
            config = await fetchSchoolConfig(id);
            runner.setConfig(config);
        } catch (e) {
            loadError = e instanceof Error ? e.message : String(e);
            config = null;
            runner.setConfig(null);
        }
    }

    let pictureInPictureEnabled = $state(false);
    let inPip = $state(false);
    let pipWindow: Window | null = null;
    let mainProgressBars: HTMLElement | null = null;

    onMount(() => {
        pictureInPictureEnabled = ("documentPictureInPicture" in window);

        // Instant paint from cache, then refresh the list from the API
        schools = prefs.schoolListCache;
        fetchSchools().then(list => {
            schools = list;
            prefs.cacheSchools(list);
            if (!selected) {
                void selectSchool(prefs.school || list[0]?.id || "custom");
            }
        }).catch(() => {
            if (!selected) void selectSchool(prefs.school || schools[0]?.id || "custom");
        });
        // Don't wait for the network if we already know what to show
        if (prefs.school) void selectSchool(prefs.school);

        const titleInterval = setInterval(() => {
            const main = runner.metrics["period"] ?? runner.metrics["break"];
            if (main) {
                document.title = `${main.percentDone.toFixed(1)}% | ${main.timeLeft.toFormat("h:mm:ss")}`;
            } else {
                document.title = "When Does This Period End?";
            }
        }, 1000);
        const tickInterval = setInterval(() => runner.tick(), 23);
        return () => {
            clearInterval(titleInterval);
            clearInterval(tickInterval);
        };
    });

    function handlePiPClose() {
        if (!mainProgressBars) return;
        mainProgressBars.removeAttribute("data-pip");
        mainProgressBars.classList.remove("pip");
        document.getElementById("constantPageContentContainer")?.append(mainProgressBars);
        inPip = false;
        (window as any).documentPictureInPicture.window?.close();
    }

    async function handleTryPnp() {
        if (inPip) {
            handlePiPClose();
            return;
        }
        if (!mainProgressBars) return;
        pipWindow = await (window as any).documentPictureInPicture.requestWindow({
            width: mainProgressBars.clientWidth,
            height: mainProgressBars.clientHeight
        });
        // Copy style sheets over from the initial document so the pop-out looks the same.
        [...document.styleSheets].forEach((styleSheet) => {
            try {
                const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join("");
                const style = document.createElement("style");
                style.textContent = cssRules;
                pipWindow!.document.head.appendChild(style);
            } catch (e) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.type = styleSheet.type;
                link.media = String(styleSheet.media);
                link.href = styleSheet.href ?? "";
                pipWindow!.document.head.appendChild(link);
            }
        });
        const pipContainer = pipWindow!.document.createElement("div");
        pipContainer.setAttribute("class", document.getElementById("pageContainer")?.getAttribute("class") ?? "");
        pipContainer.setAttribute("data-pip", "true");
        pipContainer.classList.add("pip");
        pipContainer.appendChild(mainProgressBars);
        pipWindow!.document.body.appendChild(pipContainer);
        inPip = true;

        pipWindow!.addEventListener("pagehide", () => {
            handlePiPClose();
        });
    }
</script>

<div class="w-full min-h-[100vh] flex items-center justify-center flex-col dark:bg-gray-800 dark:text-white relative"
     id="pageContainer">
    <SchoolSwitcher {schools} {selected} onselect={(id) => void selectSchool(id)}/>
    <ConfigDrawer contextKey={runner.contextKey} {config} onchange={() => runner.refresh()}/>

    <h1 class="text-3xl md:text-5xl font-black mx-10 max-lg:mt-4">When Does This Period End?</h1>

    {#if loadError}
        <p class="mt-6 mx-6 text-red-500 text-center">Couldn't load this school's schedule: {loadError}</p>
    {/if}
    {#if selected === "custom" && runner.bars.length === 0}
        <p class="mt-10 mx-6 text-center opacity-70">No custom bars yet — open the
            <b>⚙ settings drawer</b> on the right to add some.</p>
    {/if}

    <div class="w-full flex items-center justify-center" id="constantPageContentContainer">
        <!-- Keeps content centered when placed back from PiP -->
        <div class="w-full text-center {inPip ? 'md:w-[95%]' : 'my-10 md:w-[75%]'}" id="mainProgressBars"
             bind:this={mainProgressBars}>
            <BarsView bars={inPip ? runner.bars.filter(b => b.id !== 'year' && b.id !== 'week') : runner.bars}
                      metrics={runner.metrics} {inPip}/>
        </div>
    </div>

    {#if inPip}
        <p class="my-16">Popped out to Picture-in-Picture.
            <button onclick={handlePiPClose}
                    class="underline hover:text-gray-400 hover:decoration-wavy cursor-pointer">Click here</button>
            or on the X to return here.</p>
    {/if}
    {#if pictureInPictureEnabled}
        <div class="w-[75%] flex items-around">
            <button onclick={handleTryPnp} id="pnpToggle" class="w-10 h-10" title="Pop out to Picture-in-Picture">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="dark:fill-white fill-black"
                     id="Picture-In-Picture--Streamline-Tabler-Filled" height="24" width="24">
                    <desc>Picture In Picture Streamline Icon: https://streamlinehq.com</desc>
                    <path d="M19 4a3 3 0 0 1 3 3v4a1 1 0 0 1 -2 0V7a1 1 0 0 0 -1 -1H5a1 1 0 0 0 -1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 1 0 2H5a3 3 0 0 1 -3 -3V7a3 3 0 0 1 3 -3z"
                          stroke-width="1"></path>
                    <path d="M20 13a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-5a2 2 0 0 1 -2 -2v-3a2 2 0 0 1 2 -2z"
                          stroke-width="1"></path>
                </svg>
            </button>
        </div>
    {/if}
</div>
