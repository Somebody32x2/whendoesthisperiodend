<script lang="ts">
    import type {PeriodConfig, SpecialScheduleConfig} from "$lib/config/types";
    import PeriodTableEditor from "./PeriodTableEditor.svelte";
    import DisabledEntryRow from "./DisabledEntryRow.svelte";
    import {rederiveEntry} from "$lib/config/yearShift";

    interface Props {
        schedules: SpecialScheduleConfig[];
        schoolYear: { start: string, end: string };
        onchange: (s: SpecialScheduleConfig[]) => void;
    }

    let {schedules, schoolYear, onchange}: Props = $props();

    function update(i: number, patch: Partial<SpecialScheduleConfig>) {
        onchange(schedules.map((s, idx) => idx === i ? {...s, ...patch} : s));
    }

    function remove(i: number) {
        onchange(schedules.filter((_, idx) => idx !== i));
    }

    function addDate(i: number) {
        const sched = schedules[i];
        const days = [...sched.days, ""];
        const specificDayLabels = sched.specificDayLabels
            ? [...sched.specificDayLabels, sched.periods.map(p => p.label)]
            : undefined;
        update(i, {days, specificDayLabels});
    }

    function updateDate(i: number, di: number, value: string) {
        const sched = schedules[i];
        const days = sched.days.map((d, idx) => idx === di ? value : d);
        update(i, {days});
    }

    function removeDate(i: number, di: number) {
        const sched = schedules[i];
        const days = sched.days.filter((_, idx) => idx !== di);
        const specificDayLabels = sched.specificDayLabels
            ? sched.specificDayLabels.filter((_, idx) => idx !== di)
            : undefined;
        update(i, {days, specificDayLabels});
    }

    function togglePerDayLabels(i: number, enabled: boolean) {
        const sched = schedules[i];
        if (enabled) {
            const rows = sched.days.map(() => sched.periods.map(p => p.label));
            update(i, {specificDayLabels: rows});
        } else {
            update(i, {specificDayLabels: undefined});
        }
    }

    function updateLabelCell(i: number, di: number, pi: number, value: string) {
        const sched = schedules[i];
        if (!sched.specificDayLabels) return;
        const rows = sched.specificDayLabels.map((row, ridx) => {
            if (ridx !== di) return row;
            const next = row.slice();
            next[pi] = value;
            return next;
        });
        update(i, {specificDayLabels: rows});
    }

    function addSchedule() {
        onchange([...schedules, {
            label: "New Special Day",
            days: [],
            disabled: false,
            periods: [{start: "08:00", end: "09:00", label: "1st Period"}]
        }]);
    }
</script>

<div>
    {#each schedules as sched, i (i)}
        <DisabledEntryRow disabled={sched.disabled} title={sched.label || "Untitled special day"}
                          onrestore={() => update(i, rederiveEntry(sched, schoolYear))}
                          ondisable={() => update(i, {disabled: true})}
                          ondelete={() => remove(i)}>
            <div class="space-y-3">
                <label class="block text-sm">Label
                    <input type="text" value={sched.label}
                           onchange={(e) => update(i, {label: e.currentTarget.value})}
                           class="mt-1 w-full rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                </label>
                <div>
                    <p class="text-sm mb-1">Dates</p>
                    <div class="space-y-1">
                        {#each sched.days as date, di (di)}
                            <div class="flex items-center gap-2">
                                <input type="date" value={date} aria-label="Date {di + 1}"
                                       onchange={(e) => updateDate(i, di, e.currentTarget.value)}
                                       class="rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                                <button type="button" onclick={() => removeDate(i, di)}
                                        aria-label="Remove date {di + 1}" title="Remove date"
                                        class="px-1 text-red-500 hover:text-red-700">✕
                                </button>
                            </div>
                        {/each}
                    </div>
                    <button type="button" onclick={() => addDate(i)}
                            class="mt-1 rounded border border-dashed border-gray-400 dark:border-gray-500 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700">
                        + Add date
                    </button>
                </div>
                <PeriodTableEditor periods={sched.periods} onchange={(p: PeriodConfig[]) => update(i, {periods: p})}/>
                <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!sched.specificDayLabels}
                           onchange={(e) => togglePerDayLabels(i, e.currentTarget.checked)}
                           class="w-4 h-4 accent-blue-500"/>
                    Per-day period labels
                </label>
                {#if sched.specificDayLabels}
                    {@const labels = sched.specificDayLabels}
                    <div class="overflow-x-auto">
                        <table class="text-sm border-collapse">
                            <thead>
                            <tr>
                                <th class="font-normal text-left pr-2 py-1 opacity-60">Date</th>
                                {#each sched.periods as p, pi (pi)}
                                    <th class="font-normal text-left pr-2 py-1 opacity-60">{p.label || `Period ${pi + 1}`}</th>
                                {/each}
                            </tr>
                            </thead>
                            <tbody>
                            {#each sched.days as date, di (di)}
                                <tr>
                                    <td class="pr-2 py-1 whitespace-nowrap">{date || `(date ${di + 1})`}</td>
                                    {#each sched.periods as p, pi (pi)}
                                        <td class="pr-2 py-1">
                                            <input type="text" value={labels[di]?.[pi] ?? ""}
                                                   aria-label="Label for {date || `date ${di + 1}`}, period {pi + 1}"
                                                   onchange={(e) => updateLabelCell(i, di, pi, e.currentTarget.value)}
                                                   class="rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm w-32"/>
                                        </td>
                                    {/each}
                                </tr>
                            {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        </DisabledEntryRow>
    {/each}
    <button type="button" onclick={addSchedule}
            class="w-full rounded-lg border border-dashed border-gray-400 dark:border-gray-500 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
        + Add special day
    </button>
</div>
