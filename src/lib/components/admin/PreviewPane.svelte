<script lang="ts">
    // Live preview of the draft config, running through the same ScheduleRunner the
    // main page uses. A deep clone is fed to the runner on every draft change so it
    // never aliases (and can't mutate) the editor's live draft.
    import {onDestroy, onMount, untrack} from "svelte";
    import {DateTime} from "luxon";
    import type {SchoolConfig} from "$lib/config/types";
    import {ScheduleRunner} from "$lib/client/runner.svelte";
    import BarsView from "$lib/components/BarsView.svelte";

    interface Props {
        draft: SchoolConfig;
        valid: boolean;
    }

    let {draft, valid}: Props = $props();

    const runner = new ScheduleRunner();
    let mode = $state<"live" | "simulated">("live");
    let simNow = $state(DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm"));
    let liveInterval: ReturnType<typeof setInterval> | null = null;

    // Drives the runner off the draft + mode. Deep-clones the draft so edits made
    // while the preview is open never mutate the runner's (or the page's) state.
    $effect(() => {
        // Tracked dependencies: the draft (deep, via $state.snapshot), mode, simNow.
        const snapshot = valid ? (structuredClone($state.snapshot(draft)) as SchoolConfig) : null;
        const currentMode = mode;
        const currentSim = simNow;
        // untrack: the runner's methods read AND write its own $state (tick() reads the
        // snapshot refresh() just wrote); tracked, the effect would re-trigger itself forever.
        untrack(() => {
            if (!snapshot) {
                runner.setConfig(null);
                return;
            }
            runner.setConfig(snapshot);
            if (currentMode === "live") {
                runner.setFixedNow(null);
            } else {
                const dt = DateTime.fromISO(currentSim, {zone: snapshot.timezone});
                runner.setFixedNow(dt.isValid ? dt : DateTime.now().setZone(snapshot.timezone));
            }
        });
    });

    onMount(() => {
        liveInterval = setInterval(() => {
            if (mode === "live") runner.tick();
        }, 123);
    });
    onDestroy(() => {
        if (liveInterval) clearInterval(liveInterval);
    });

    function applySimNow() {
        const dt = DateTime.fromISO(simNow, {zone: draft.timezone});
        if (!dt.isValid) return;
        runner.setFixedNow(dt);
        runner.tick();
    }

    function setMode(next: "live" | "simulated") {
        mode = next;
        if (next === "live") {
            runner.setFixedNow(null);
        } else {
            simNow = DateTime.now().setZone(draft.timezone).toFormat("yyyy-MM-dd'T'HH:mm");
            applySimNow();
        }
    }

    function shiftSim(unit: "days" | "hours", amount: number) {
        const dt = DateTime.fromISO(simNow, {zone: draft.timezone}).plus({[unit]: amount});
        simNow = dt.toFormat("yyyy-MM-dd'T'HH:mm");
        applySimNow();
    }

    function nextTransition() {
        if (!runner.snapshot) return;
        simNow = runner.snapshot.validUntil.toFormat("yyyy-MM-dd'T'HH:mm");
        applySimNow();
    }
</script>

{#if !valid}
    <p class="text-sm opacity-70">Fix validation errors to preview.</p>
{:else}
    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <button type="button" onclick={() => setMode("live")}
                    class="rounded px-3 py-1 text-sm border {mode === 'live' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-500'}">
                Live
            </button>
            <button type="button" onclick={() => setMode("simulated")}
                    class="rounded px-3 py-1 text-sm border {mode === 'simulated' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-500'}">
                Simulated
            </button>
        </div>

        {#if mode === "simulated"}
            <div class="flex flex-wrap items-end gap-2">
                <label class="text-sm">Simulated time
                    <input type="datetime-local" bind:value={simNow} onchange={applySimNow}
                           class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                </label>
                <button type="button" onclick={() => shiftSim("days", -1)}
                        class="rounded border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                    −1d
                </button>
                <button type="button" onclick={() => shiftSim("hours", -1)}
                        class="rounded border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                    −1h
                </button>
                <button type="button" onclick={() => shiftSim("hours", 1)}
                        class="rounded border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                    +1h
                </button>
                <button type="button" onclick={() => shiftSim("days", 1)}
                        class="rounded border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                    +1d
                </button>
                <button type="button" onclick={nextTransition}
                        class="rounded border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                    Next transition →
                </button>
            </div>
        {/if}

        <div class="rounded-lg border border-gray-300 dark:border-gray-500 p-4">
            <p class="text-sm opacity-70 mb-2">State: <b>{runner.snapshot?.state ?? "n/a"}</b></p>
            <BarsView bars={runner.bars} metrics={runner.metrics}/>
        </div>
    </div>
{/if}
