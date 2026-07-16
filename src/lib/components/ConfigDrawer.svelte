<script lang="ts">
    // Right-hand collapsible config drawer.
    // School mode: toggle the school's extra bars, plus personal custom bars.
    // Custom mode: custom bars only.
    import type {SchoolConfig} from "$lib/config/types";
    import type {BarColor} from "$lib/config/colors";
    import ColorSelect from "./ColorSelect.svelte";
    import {prefs, type CustomBar} from "$lib/stores/prefs.svelte";
    import type {CustomBarKind, CustomTimeRow} from "$lib/client/customBars";

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

    const KINDS: { value: CustomBarKind, label: string, hint: string }[] = [
        {value: "static", label: "One-time", hint: "counts from one moment to another"},
        {value: "daily", label: "Daily", hint: "the same time window each day"},
        {value: "periods", label: "Periods", hint: "a repeating daily list of time blocks"},
        {value: "ranges", label: "Ranges", hint: "a sequence of longer date ranges"}
    ];
    const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    function barLabel(bar: SchoolConfig["bars"][number]): string {
        return bar.kind === "static" ? bar.label : `${bar.eachRangeLabel}s`;
    }

    function toggleBar(barId: string, enabledByDefault: boolean) {
        prefs.setBarEnabled(contextKey, barId, !prefs.isBarEnabled(contextKey, barId, enabledByDefault));
        onchange();
    }

    function nowLocal(): string {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }

    function addCustomBar() {
        const bar: CustomBar = {
            id: Math.random().toString(36).slice(2, 10),
            label: "My Bar",
            kind: "static",
            start: nowLocal(),
            end: nowLocal(),
            color: "indigo"
        };
        prefs.setCustomBars(contextKey, [...customBars, bar]);
        onchange();
    }

    function updateBar(id: string, patch: Partial<CustomBar>) {
        prefs.setCustomBars(contextKey, customBars.map(b => b.id === id ? {...b, ...patch} : b));
        onchange();
    }

    function removeBar(id: string) {
        prefs.setCustomBars(contextKey, customBars.filter(b => b.id !== id));
        onchange();
    }

    function setKind(bar: CustomBar, kind: CustomBarKind) {
        const patch: Partial<CustomBar> = {kind};
        if (kind === "static" && !bar.start) Object.assign(patch, {start: nowLocal(), end: nowLocal()});
        if (kind === "daily" && !bar.startTime) Object.assign(patch, {startTime: "08:00", endTime: "15:00"});
        if (kind === "periods" && (!bar.periods || bar.periods.length === 0)) {
            patch.periods = [{start: "08:00", end: "09:00", label: ""}];
        }
        if (kind === "ranges" && (!bar.ranges || bar.ranges.length === 0)) {
            patch.ranges = [{start: nowLocal(), end: nowLocal(), label: ""}];
        }
        updateBar(bar.id, patch);
    }

    function toggleDay(bar: CustomBar, day: number) {
        // Empty means every day; materialize all 7 before removing one so clicking a
        // chip in the every-day state turns that day off (not "only that day on")
        const days = (bar.days && bar.days.length > 0) ? bar.days : [1, 2, 3, 4, 5, 6, 7];
        updateBar(bar.id, {days: days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort()});
    }

    function updateRow(bar: CustomBar, field: "periods" | "ranges", i: number, patch: Partial<CustomTimeRow>) {
        const rows = [...(bar[field] ?? [])];
        rows[i] = {...rows[i], ...patch};
        updateBar(bar.id, {[field]: rows});
    }

    function removeRow(bar: CustomBar, field: "periods" | "ranges", i: number) {
        updateBar(bar.id, {[field]: (bar[field] ?? []).filter((_, idx) => idx !== i)});
    }

    function addRow(bar: CustomBar, field: "periods" | "ranges") {
        const rows = bar[field] ?? [];
        const template: CustomTimeRow = field === "periods"
            ? {start: rows[rows.length - 1]?.end ?? "08:00", end: rows[rows.length - 1]?.end ?? "09:00", label: ""}
            : {start: rows[rows.length - 1]?.end ?? nowLocal(), end: rows[rows.length - 1]?.end ?? nowLocal(), label: ""};
        updateBar(bar.id, {[field]: [...rows, template]});
    }

    const inputClass = "rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm";
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
<div class="fixed right-0 top-0 z-20 h-full w-72 sm:w-96 transform transition-transform duration-200 {open ? 'translate-x-0' : 'translate-x-full'}
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
            <p class="text-sm opacity-70">Custom mode: only the bars you define below are shown. Times use your
                device's timezone.</p>
        {/if}

        <section>
            <h2 class="text-lg font-bold mb-2">Custom Bars</h2>
            {#each customBars as bar (bar.id)}
                <div class="mb-4 rounded-lg border border-gray-200 dark:border-gray-600 p-2 space-y-2">
                    <div class="flex gap-1.5 items-center">
                        <input type="text" value={bar.label} placeholder="Label"
                               oninput={(e) => updateBar(bar.id, {label: e.currentTarget.value})}
                               class="flex-1 min-w-0 {inputClass}"/>
                        <ColorSelect value={bar.color} onchange={(c) => updateBar(bar.id, {color: c})}/>
                        <button onclick={() => removeBar(bar.id)} title="Remove bar"
                                class="px-1.5 text-red-500 hover:text-red-700 font-bold">✕
                        </button>
                    </div>

                    <label class="block text-xs opacity-70">Type
                        <select value={bar.kind}
                                onchange={(e) => setKind(bar, e.currentTarget.value as CustomBarKind)}
                                class="block mt-0.5 w-full {inputClass} dark:bg-gray-700">
                            {#each KINDS as kind}
                                <option value={kind.value}>{kind.label} ({kind.hint})</option>
                            {/each}
                        </select>
                    </label>

                    {#if bar.kind === "daily" || bar.kind === "periods"}
                        <div class="flex gap-1" role="group" aria-label="Days shown">
                            {#each WEEKDAYS as name, i}
                                {@const day = i + 1}
                                {@const on = !bar.days || bar.days.length === 0 || bar.days.includes(day)}
                                <button type="button" onclick={() => toggleDay(bar, day)}
                                        title="{name}: {on ? 'shown' : 'hidden'}"
                                        class="w-8 h-7 text-xs rounded border {on
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'border-gray-300 dark:border-gray-500 opacity-60'}">
                                    {name[0]}
                                </button>
                            {/each}
                        </div>
                        <p class="text-xs opacity-50">Days the bar shows.</p>
                    {/if}

                    {#if bar.kind === "static"}
                        <label class="block text-xs opacity-70">Start
                            <input type="datetime-local" value={bar.start ?? ""}
                                   onchange={(e) => updateBar(bar.id, {start: e.currentTarget.value})}
                                   class="w-full {inputClass}"/>
                        </label>
                        <label class="block text-xs opacity-70">End
                            <input type="datetime-local" value={bar.end ?? ""}
                                   onchange={(e) => updateBar(bar.id, {end: e.currentTarget.value})}
                                   class="w-full {inputClass}"/>
                        </label>
                        {#if (bar.start ?? "") >= (bar.end ?? "")}
                            <p class="text-xs text-red-500">Start must be before end for the bar to show.</p>
                        {/if}
                    {:else if bar.kind === "daily"}
                        <div class="flex gap-2">
                            <label class="block text-xs opacity-70 flex-1">From
                                <input type="time" value={bar.startTime ?? ""}
                                       onchange={(e) => updateBar(bar.id, {startTime: e.currentTarget.value})}
                                       class="w-full {inputClass}"/>
                            </label>
                            <label class="block text-xs opacity-70 flex-1">To
                                <input type="time" value={bar.endTime ?? ""}
                                       onchange={(e) => updateBar(bar.id, {endTime: e.currentTarget.value})}
                                       class="w-full {inputClass}"/>
                            </label>
                        </div>
                    {:else if bar.kind === "periods"}
                        {#each bar.periods ?? [] as row, i (i)}
                            <div class="flex gap-1 items-center">
                                <input type="time" value={row.start}
                                       onchange={(e) => updateRow(bar, "periods", i, {start: e.currentTarget.value})}
                                       class="{inputClass} w-24"/>
                                <input type="time" value={row.end}
                                       onchange={(e) => updateRow(bar, "periods", i, {end: e.currentTarget.value})}
                                       class="{inputClass} w-24"/>
                                <input type="text" value={row.label ?? ""} placeholder="{i + 1}."
                                       oninput={(e) => updateRow(bar, "periods", i, {label: e.currentTarget.value})}
                                       class="{inputClass} flex-1 min-w-0"/>
                                <button onclick={() => removeRow(bar, "periods", i)} title="Remove"
                                        class="px-1 text-red-500 hover:text-red-700">✕
                                </button>
                            </div>
                        {/each}
                        <button type="button" onclick={() => addRow(bar, "periods")}
                                class="w-full rounded border border-dashed border-gray-400 dark:border-gray-500 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-600">
                            + Add period
                        </button>
                    {:else if bar.kind === "ranges"}
                        {#each bar.ranges ?? [] as row, i (i)}
                            <div class="rounded border border-gray-200 dark:border-gray-600 p-1.5 space-y-1">
                                <div class="flex gap-1 items-center">
                                    <input type="text" value={row.label ?? ""} placeholder="{i + 1}. label (optional)"
                                           oninput={(e) => updateRow(bar, "ranges", i, {label: e.currentTarget.value})}
                                           class="{inputClass} flex-1 min-w-0"/>
                                    <button onclick={() => removeRow(bar, "ranges", i)} title="Remove"
                                            class="px-1 text-red-500 hover:text-red-700">✕
                                    </button>
                                </div>
                                <input type="datetime-local" value={row.start} aria-label="Range start"
                                       onchange={(e) => updateRow(bar, "ranges", i, {start: e.currentTarget.value})}
                                       class="w-full {inputClass}"/>
                                <input type="datetime-local" value={row.end} aria-label="Range end"
                                       onchange={(e) => updateRow(bar, "ranges", i, {end: e.currentTarget.value})}
                                       class="w-full {inputClass}"/>
                            </div>
                        {/each}
                        <button type="button" onclick={() => addRow(bar, "ranges")}
                                class="w-full rounded border border-dashed border-gray-400 dark:border-gray-500 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-600">
                            + Add range
                        </button>
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
