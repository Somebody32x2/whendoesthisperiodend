<script lang="ts">
    import type {BarConfig, RangesBarConfig, StaticBarConfig} from "$lib/config/types";
    import type {BarColor} from "$lib/config/colors";
    import ColorSelect from "$lib/components/ColorSelect.svelte";
    import DisabledEntryRow from "./DisabledEntryRow.svelte";
    import {rederiveEntry} from "$lib/config/yearShift";

    interface Props {
        bars: BarConfig[];
        schoolYear: { start: string, end: string };
        onchange: (b: BarConfig[]) => void;
    }

    let {bars, schoolYear, onchange}: Props = $props();

    // Patch may carry fields from either bar kind, or be a full replacement entry
    // (e.g. from rederiveEntry); narrowed back to BarConfig on write.
    function update(i: number, patch: Record<string, unknown>) {
        onchange(bars.map((b, idx) => idx === i ? ({...b, ...patch} as BarConfig) : b));
    }

    function remove(i: number) {
        onchange(bars.filter((_, idx) => idx !== i));
    }

    function uniqueId(): string {
        let n = 1;
        while (bars.some(b => b.id === `bar-${n}`)) n++;
        return `bar-${n}`;
    }

    function addStatic() {
        const bar: StaticBarConfig = {
            kind: "static", id: uniqueId(), label: "New Bar",
            start: "2026-01-01T08:00", end: "2026-01-02T08:00",
            color: "blue", showDays: true, showEndpoints: false,
            enabledByDefault: true, disabled: false
        };
        onchange([...bars, bar]);
    }

    function addRanges() {
        const bar: RangesBarConfig = {
            kind: "ranges", id: uniqueId(), eachRangeLabel: "Range",
            ranges: [{start: "2026-01-01T08:00", end: "2026-01-02T08:00"}],
            color: "blue", showDays: true, showEndpoints: false,
            enabledByDefault: true, disabled: false
        };
        onchange([...bars, bar]);
    }

    function updateRange(i: number, ri: number, patch: Partial<{ start: string, end: string, label?: string }>) {
        const bar = bars[i] as RangesBarConfig;
        const ranges = bar.ranges.map((r, idx) => idx === ri ? {...r, ...patch} : r);
        update(i, {ranges});
    }

    function addRange(i: number) {
        const bar = bars[i] as RangesBarConfig;
        const last = bar.ranges[bar.ranges.length - 1];
        const ranges = [...bar.ranges, {start: last?.end ?? "2026-01-01T08:00", end: last?.end ?? "2026-01-02T08:00"}];
        update(i, {ranges});
    }

    function removeRange(i: number, ri: number) {
        const bar = bars[i] as RangesBarConfig;
        const ranges = bar.ranges.filter((_, idx) => idx !== ri);
        update(i, {ranges});
    }

    function barTitle(bar: BarConfig): string {
        return (bar.kind === "static" ? bar.label : `${bar.eachRangeLabel}s`) || bar.id;
    }
</script>

<div>
    {#each bars as bar, i (i)}
        <DisabledEntryRow disabled={bar.disabled} title={barTitle(bar)}
                          onrestore={() => update(i, rederiveEntry(bar, schoolYear))}
                          ondisable={() => update(i, {disabled: true})}
                          ondelete={() => remove(i)}>
            <div class="space-y-3">
                <div class="flex flex-wrap gap-3">
                    <label class="text-sm">Bar id
                        <input type="text" value={bar.id}
                               onchange={(e) => update(i, {id: e.currentTarget.value})}
                               class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                    </label>
                    <div class="text-sm">
                        <p class="mb-1">Color</p>
                        <ColorSelect value={bar.color} onchange={(c: BarColor) => update(i, {color: c})}/>
                    </div>
                </div>

                {#if bar.kind === "static"}
                    <label class="block text-sm">Label
                        <input type="text" value={bar.label}
                               onchange={(e) => update(i, {label: e.currentTarget.value})}
                               class="mt-1 w-full rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                    </label>
                    <div class="flex flex-wrap gap-3">
                        <label class="text-sm">Start
                            <input type="datetime-local" value={bar.start}
                                   onchange={(e) => update(i, {start: e.currentTarget.value})}
                                   class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                        </label>
                        <label class="text-sm">End
                            <input type="datetime-local" value={bar.end}
                                   onchange={(e) => update(i, {end: e.currentTarget.value})}
                                   class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                        </label>
                    </div>
                {:else}
                    <label class="block text-sm">Each-range label
                        <input type="text" value={bar.eachRangeLabel}
                               onchange={(e) => update(i, {eachRangeLabel: e.currentTarget.value})}
                               class="mt-1 w-full rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                    </label>
                    <div class="space-y-2">
                        {#each bar.ranges as range, ri (ri)}
                            <div class="flex flex-wrap items-end gap-2 rounded border border-gray-200 dark:border-gray-600 p-2">
                                <label class="text-xs">Start
                                    <input type="datetime-local" value={range.start}
                                           onchange={(e) => updateRange(i, ri, {start: e.currentTarget.value})}
                                           class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                                </label>
                                <label class="text-xs">End
                                    <input type="datetime-local" value={range.end}
                                           onchange={(e) => updateRange(i, ri, {end: e.currentTarget.value})}
                                           class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                                </label>
                                <label class="text-xs">Label (optional)
                                    <input type="text" value={range.label ?? ""}
                                           onchange={(e) => updateRange(i, ri, {label: e.currentTarget.value || undefined})}
                                           class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                                </label>
                                <button type="button" onclick={() => removeRange(i, ri)}
                                        aria-label="Remove range {ri + 1}" title="Remove range"
                                        class="px-1 text-red-500 hover:text-red-700">✕
                                </button>
                            </div>
                        {/each}
                    </div>
                    <button type="button" onclick={() => addRange(i)}
                            class="rounded border border-dashed border-gray-400 dark:border-gray-500 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700">
                        + Add range
                    </button>
                {/if}

                <div class="flex flex-wrap gap-4 pt-1">
                    <label class="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={bar.showDays}
                               onchange={(e) => update(i, {showDays: e.currentTarget.checked})}
                               class="w-4 h-4 accent-blue-500"/>
                        Show days
                    </label>
                    <label class="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={bar.showEndpoints}
                               onchange={(e) => update(i, {showEndpoints: e.currentTarget.checked})}
                               class="w-4 h-4 accent-blue-500"/>
                        Show endpoints
                    </label>
                    <label class="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={bar.enabledByDefault}
                               onchange={(e) => update(i, {enabledByDefault: e.currentTarget.checked})}
                               class="w-4 h-4 accent-blue-500"/>
                        Enabled by default
                    </label>
                </div>
            </div>
        </DisabledEntryRow>
    {/each}
    <div class="flex gap-2">
        <button type="button" onclick={addStatic}
                class="flex-1 rounded-lg border border-dashed border-gray-400 dark:border-gray-500 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
            + Static bar
        </button>
        <button type="button" onclick={addRanges}
                class="flex-1 rounded-lg border border-dashed border-gray-400 dark:border-gray-500 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
            + Ranges bar
        </button>
    </div>
</div>
