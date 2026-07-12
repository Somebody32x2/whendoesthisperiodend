<script lang="ts">
    // Editable period table shared by normal and special schedules.
    import type {PeriodConfig} from "$lib/config/types";

    interface Props {
        periods: PeriodConfig[];
        onchange: (p: PeriodConfig[]) => void;
    }

    let {periods, onchange}: Props = $props();

    function update(i: number, patch: Partial<PeriodConfig>) {
        onchange(periods.map((p, idx) => idx === i ? {...p, ...patch} : p));
    }

    function remove(i: number) {
        onchange(periods.filter((_, idx) => idx !== i));
    }

    function moveUp(i: number) {
        if (i === 0) return;
        const next = periods.slice();
        [next[i - 1], next[i]] = [next[i], next[i - 1]];
        onchange(next);
    }

    function moveDown(i: number) {
        if (i === periods.length - 1) return;
        const next = periods.slice();
        [next[i], next[i + 1]] = [next[i + 1], next[i]];
        onchange(next);
    }

    function addPeriod() {
        const prevEnd = periods.length > 0 ? periods[periods.length - 1].end : "08:00";
        onchange([...periods, {start: prevEnd, end: prevEnd, label: "New Period"}]);
    }
</script>

<div class="overflow-x-auto">
    <table class="w-full text-sm">
        <thead>
        <tr class="text-left opacity-60">
            <th class="font-normal py-1 pr-2">Start</th>
            <th class="font-normal py-1 pr-2">End</th>
            <th class="font-normal py-1 pr-2">Label</th>
            <th class="font-normal py-1"><span class="sr-only">Actions</span></th>
        </tr>
        </thead>
        <tbody>
        {#each periods as period, i (i)}
            <tr>
                <td class="py-1 pr-2">
                    <input type="time" value={period.start} aria-label="Period {i + 1} start"
                           onchange={(e) => update(i, {start: e.currentTarget.value})}
                           class="rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                </td>
                <td class="py-1 pr-2">
                    <input type="time" value={period.end} aria-label="Period {i + 1} end"
                           onchange={(e) => update(i, {end: e.currentTarget.value})}
                           class="rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                </td>
                <td class="py-1 pr-2">
                    <input type="text" value={period.label} aria-label="Period {i + 1} label"
                           onchange={(e) => update(i, {label: e.currentTarget.value})}
                           class="w-full min-w-[8rem] rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                </td>
                <td class="py-1 whitespace-nowrap">
                    <button type="button" onclick={() => moveUp(i)} disabled={i === 0}
                            aria-label="Move period {i + 1} up" title="Move up"
                            class="px-1 disabled:opacity-30">↑
                    </button>
                    <button type="button" onclick={() => moveDown(i)} disabled={i === periods.length - 1}
                            aria-label="Move period {i + 1} down" title="Move down"
                            class="px-1 disabled:opacity-30">↓
                    </button>
                    <button type="button" onclick={() => remove(i)}
                            aria-label="Delete period {i + 1}" title="Delete"
                            class="px-1 text-red-500 hover:text-red-700">✕
                    </button>
                </td>
            </tr>
        {/each}
        </tbody>
    </table>
</div>
<button type="button" onclick={addPeriod}
        class="mt-2 rounded border border-dashed border-gray-400 dark:border-gray-500 px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
    + Add period
</button>
