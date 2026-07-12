<script lang="ts">
    import type {BreakConfig} from "$lib/config/types";
    import DisabledEntryRow from "./DisabledEntryRow.svelte";
    import {rederiveEntry} from "$lib/config/yearShift";

    interface Props {
        breaks: BreakConfig[];
        schoolYear: { start: string, end: string };
        onchange: (b: BreakConfig[]) => void;
    }

    let {breaks, schoolYear, onchange}: Props = $props();

    function update(i: number, patch: Partial<BreakConfig>) {
        onchange(breaks.map((b, idx) => idx === i ? {...b, ...patch} : b));
    }

    function remove(i: number) {
        onchange(breaks.filter((_, idx) => idx !== i));
    }

    function addBreak() {
        onchange([...breaks, {
            label: "New Break",
            start: schoolYear.start,
            end: schoolYear.start,
            disabled: false
        }]);
    }
</script>

<div>
    {#each breaks as brk, i (i)}
        <DisabledEntryRow disabled={brk.disabled} title={brk.label || "Untitled break"}
                          onrestore={() => update(i, rederiveEntry(brk, schoolYear))}
                          ondisable={() => update(i, {disabled: true})}
                          ondelete={() => remove(i)}>
            <div class="space-y-3">
                <label class="block text-sm">Label
                    <input type="text" value={brk.label}
                           onchange={(e) => update(i, {label: e.currentTarget.value})}
                           class="mt-1 w-full rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                </label>
                <div class="flex flex-wrap gap-3 items-end">
                    <label class="text-sm">First day off
                        <input type="date" value={brk.start}
                               onchange={(e) => update(i, {start: e.currentTarget.value})}
                               class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                    </label>
                    <label class="text-sm">Last day off
                        <input type="date" value={brk.end}
                               onchange={(e) => update(i, {end: e.currentTarget.value})}
                               class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                    </label>
                    <p class="text-xs opacity-60 pb-1.5">Inclusive — a one-day holiday uses the same date twice.</p>
                </div>
            </div>
        </DisabledEntryRow>
    {/each}
    <button type="button" onclick={addBreak}
            class="w-full rounded-lg border border-dashed border-gray-400 dark:border-gray-500 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
        + Add break
    </button>
</div>
