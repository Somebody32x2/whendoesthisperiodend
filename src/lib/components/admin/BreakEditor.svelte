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
            start: "2026-01-01T00:00",
            end: "2026-01-02T00:00",
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
                <div class="flex flex-wrap gap-3">
                    <label class="text-sm">Start
                        <input type="datetime-local" value={brk.start}
                               onchange={(e) => update(i, {start: e.currentTarget.value})}
                               class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                    </label>
                    <label class="text-sm">End
                        <input type="datetime-local" value={brk.end}
                               onchange={(e) => update(i, {end: e.currentTarget.value})}
                               class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                    </label>
                </div>
            </div>
        </DisabledEntryRow>
    {/each}
    <button type="button" onclick={addBreak}
            class="w-full rounded-lg border border-dashed border-gray-400 dark:border-gray-500 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
        + Add break
    </button>
</div>
