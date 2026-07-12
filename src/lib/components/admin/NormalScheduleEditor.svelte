<script lang="ts">
    import type {NormalScheduleConfig, PeriodConfig} from "$lib/config/types";
    import PeriodTableEditor from "./PeriodTableEditor.svelte";
    import DisabledEntryRow from "./DisabledEntryRow.svelte";

    interface Props {
        schedules: NormalScheduleConfig[];
        onchange: (s: NormalScheduleConfig[]) => void;
    }

    let {schedules, onchange}: Props = $props();

    const WEEKDAYS = [
        {n: 1, label: "Mon"}, {n: 2, label: "Tue"}, {n: 3, label: "Wed"}, {n: 4, label: "Thu"},
        {n: 5, label: "Fri"}, {n: 6, label: "Sat"}, {n: 7, label: "Sun"}
    ];

    function update(i: number, patch: Partial<NormalScheduleConfig>) {
        onchange(schedules.map((s, idx) => idx === i ? {...s, ...patch} : s));
    }

    function remove(i: number) {
        onchange(schedules.filter((_, idx) => idx !== i));
    }

    function toggleDay(i: number, day: number) {
        const sched = schedules[i];
        const days = sched.days.includes(day)
            ? sched.days.filter(d => d !== day)
            : [...sched.days, day].sort((a, b) => a - b);
        update(i, {days});
    }

    function addSchedule() {
        onchange([...schedules, {
            label: "New Schedule",
            days: [],
            endWithWeekend: false,
            disabled: false,
            periods: [{start: "08:00", end: "09:00", label: "1st Period"}]
        }]);
    }
</script>

<div>
    {#each schedules as sched, i (i)}
        <DisabledEntryRow disabled={sched.disabled} title={sched.label || "Untitled schedule"}
                          onrestore={() => update(i, {disabled: false})}
                          ondisable={() => update(i, {disabled: true})}
                          ondelete={() => remove(i)}>
            <div class="space-y-3">
                <label class="block text-sm">Label
                    <input type="text" value={sched.label}
                           onchange={(e) => update(i, {label: e.currentTarget.value})}
                           class="mt-1 w-full rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
                </label>
                <div>
                    <p class="text-sm mb-1">Days</p>
                    <div class="flex gap-1 flex-wrap">
                        {#each WEEKDAYS as wd (wd.n)}
                            <button type="button" onclick={() => toggleDay(i, wd.n)}
                                    aria-pressed={sched.days.includes(wd.n)}
                                    class="px-2 py-1 rounded text-xs border {sched.days.includes(wd.n) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-500'}">
                                {wd.label}
                            </button>
                        {/each}
                    </div>
                </div>
                <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={sched.endWithWeekend}
                           onchange={(e) => update(i, {endWithWeekend: e.currentTarget.checked})}
                           class="w-4 h-4 accent-blue-500"/>
                    End with weekend
                </label>
                <PeriodTableEditor periods={sched.periods} onchange={(p: PeriodConfig[]) => update(i, {periods: p})}/>
            </div>
        </DisabledEntryRow>
    {/each}
    <button type="button" onclick={addSchedule}
            class="w-full rounded-lg border border-dashed border-gray-400 dark:border-gray-500 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
        + Add schedule
    </button>
</div>
