<script lang="ts">
    // Right-hand collapsible config drawer.
    // School mode: toggle the school's additional bars + add personal custom bars.
    // Custom mode: only custom bars (there is no school schedule to toggle).
    import type {SchoolConfig} from "$lib/config/types";
    import {BAR_COLOR_NAMES, type BarColor} from "$lib/config/colors";
    import {prefs, type CustomBar} from "$lib/stores/prefs.svelte";

    interface Props {
        /** school id or "custom" */
        contextKey: string;
        config: SchoolConfig | null;
        onchange: () => void;
    }

    let {contextKey, config, onchange}: Props = $props();
    let open = $state(false);

    const toggleableBars = $derived((config?.bars ?? []).filter(b => !b.disabled));
    const customBars = $derived(prefs.getCustomBars(contextKey));

    function barLabel(bar: SchoolConfig["bars"][number]): string {
        return bar.kind === "static" ? bar.label : `${bar.eachRangeLabel}s`;
    }

    function toggleBar(barId: string, enabledByDefault: boolean) {
        prefs.setBarEnabled(contextKey, barId, !prefs.isBarEnabled(contextKey, barId, enabledByDefault));
        onchange();
    }

    function addCustomBar() {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const bar: CustomBar = {
            id: Math.random().toString(36).slice(2, 10),
            label: "My Bar",
            start: local,
            end: local,
            color: "indigo"
        };
        prefs.setCustomBars(contextKey, [...customBars, bar]);
        onchange();
    }

    function updateCustomBar(id: string, patch: Partial<CustomBar>) {
        prefs.setCustomBars(contextKey, customBars.map(b => b.id === id ? {...b, ...patch} : b));
        onchange();
    }

    function removeCustomBar(id: string) {
        prefs.setCustomBars(contextKey, customBars.filter(b => b.id !== id));
        onchange();
    }
</script>

<!-- Gear toggle -->
<button
        class="fixed right-3 top-3 z-30 rounded-full border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur p-2 shadow-sm hover:shadow hover:rotate-45 transition-all"
        onclick={() => open = !open} title="Bar settings" aria-expanded={open}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         class="w-5 h-5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round"
              d="M10.34 3.94a1.7 1.7 0 0 1 3.32 0l.18.8a1.7 1.7 0 0 0 2.57 1.06l.7-.43a1.7 1.7 0 0 1 2.35 2.35l-.43.7a1.7 1.7 0 0 0 1.06 2.57l.8.18a1.7 1.7 0 0 1 0 3.32l-.8.18a1.7 1.7 0 0 0-1.06 2.57l.43.7a1.7 1.7 0 0 1-2.35 2.35l-.7-.43a1.7 1.7 0 0 0-2.57 1.06l-.18.8a1.7 1.7 0 0 1-3.32 0l-.18-.8a1.7 1.7 0 0 0-2.57-1.06l-.7.43a1.7 1.7 0 0 1-2.35-2.35l.43-.7a1.7 1.7 0 0 0-1.06-2.57l-.8-.18a1.7 1.7 0 0 1 0-3.32l.8-.18a1.7 1.7 0 0 0 1.06-2.57l-.43-.7a1.7 1.7 0 0 1 2.35-2.35l.7.43a1.7 1.7 0 0 0 2.57-1.06l.18-.8Z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
</button>

<!-- Drawer -->
<div class="fixed right-0 top-0 z-20 h-full w-72 sm:w-80 transform transition-transform duration-200 {open ? 'translate-x-0' : 'translate-x-full'}
            border-l border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white shadow-2xl overflow-y-auto">
    <div class="p-4 pt-14 space-y-6">
        {#if config}
            <section>
                <h2 class="text-lg font-bold mb-2">Extra Bars</h2>
                {#if toggleableBars.length === 0}
                    <p class="text-sm opacity-60">This school has no extra bars configured.</p>
                {/if}
                {#each toggleableBars as bar (bar.id)}
                    <label class="flex items-center gap-2 py-1 cursor-pointer">
                        <input type="checkbox"
                               checked={prefs.isBarEnabled(contextKey, bar.id, bar.enabledByDefault)}
                               onchange={() => toggleBar(bar.id, bar.enabledByDefault)}
                               class="w-4 h-4 accent-blue-500"/>
                        <span class="text-sm">{barLabel(bar)}</span>
                    </label>
                {/each}
            </section>
        {:else}
            <p class="text-sm opacity-70">Custom mode — define your own progress bars below. Times use your device's
                timezone.</p>
        {/if}

        <section>
            <h2 class="text-lg font-bold mb-2">Custom Bars</h2>
            {#each customBars as bar (bar.id)}
                <div class="mb-4 rounded-lg border border-gray-200 dark:border-gray-600 p-2 space-y-1.5">
                    <div class="flex gap-1.5">
                        <input type="text" value={bar.label} placeholder="Label"
                               oninput={(e) => updateCustomBar(bar.id, {label: e.currentTarget.value})}
                               class="flex-1 min-w-0 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                        <select value={bar.color}
                                onchange={(e) => updateCustomBar(bar.id, {color: e.currentTarget.value as BarColor})}
                                class="rounded border border-gray-300 dark:border-gray-500 bg-transparent dark:bg-gray-700 px-1 py-1 text-sm">
                            {#each BAR_COLOR_NAMES as color}
                                <option value={color}>{color}</option>
                            {/each}
                        </select>
                        <button onclick={() => removeCustomBar(bar.id)} title="Remove bar"
                                class="px-1.5 text-red-500 hover:text-red-700 font-bold">✕
                        </button>
                    </div>
                    <label class="block text-xs opacity-70">Start
                        <input type="datetime-local" value={bar.start}
                               onchange={(e) => updateCustomBar(bar.id, {start: e.currentTarget.value})}
                               class="w-full rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                    </label>
                    <label class="block text-xs opacity-70">End
                        <input type="datetime-local" value={bar.end}
                               onchange={(e) => updateCustomBar(bar.id, {end: e.currentTarget.value})}
                               class="w-full rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                    </label>
                    {#if bar.start >= bar.end}
                        <p class="text-xs text-red-500">Start must be before end for the bar to show.</p>
                    {/if}
                </div>
            {/each}
            <button onclick={addCustomBar}
                    class="w-full rounded-lg border border-dashed border-gray-400 dark:border-gray-500 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                + Add custom bar
            </button>
        </section>
    </div>
</div>
