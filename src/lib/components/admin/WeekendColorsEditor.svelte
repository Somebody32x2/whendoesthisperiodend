<script lang="ts">
    import type {SchoolConfig, WeekendConfig} from "$lib/config/types";
    import type {BarColor} from "$lib/config/colors";
    import ColorSelect from "$lib/components/ColorSelect.svelte";

    type Colors = SchoolConfig["colors"];

    interface Props {
        weekend: WeekendConfig;
        colors: Colors;
        onchange: (patch: { weekend?: WeekendConfig, colors?: Colors }) => void;
    }

    let {weekend, colors, onchange}: Props = $props();

    const WEEKDAYS = [
        {n: 1, label: "Monday"}, {n: 2, label: "Tuesday"}, {n: 3, label: "Wednesday"}, {n: 4, label: "Thursday"},
        {n: 5, label: "Friday"}, {n: 6, label: "Saturday"}, {n: 7, label: "Sunday"}
    ];

    const COLOR_KEYS = ["period", "passing", "break", "day", "week"] as const;

    function updateWeekend(patch: Partial<WeekendConfig>) {
        onchange({weekend: {...weekend, ...patch}});
    }

    function updateColor(key: keyof Colors, value: BarColor) {
        onchange({colors: {...colors, [key]: value}});
    }
</script>

<div class="space-y-6">
    <section>
        <h3 class="font-bold mb-2">Weekend</h3>
        <div class="flex flex-wrap gap-3">
            <label class="text-sm">Starts on
                <select value={weekend.startDay}
                        onchange={(e) => updateWeekend({startDay: Number(e.currentTarget.value)})}
                        class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent dark:bg-gray-700 px-2 py-1 text-sm">
                    {#each WEEKDAYS as wd (wd.n)}<option value={wd.n}>{wd.label}</option>{/each}
                </select>
            </label>
            <label class="text-sm">Start time
                <input type="time" value={weekend.startTime}
                       onchange={(e) => updateWeekend({startTime: e.currentTarget.value})}
                       class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
            </label>
            <label class="text-sm">Ends on
                <select value={weekend.endDay}
                        onchange={(e) => updateWeekend({endDay: Number(e.currentTarget.value)})}
                        class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent dark:bg-gray-700 px-2 py-1 text-sm">
                    {#each WEEKDAYS as wd (wd.n)}<option value={wd.n}>{wd.label}</option>{/each}
                </select>
            </label>
            <label class="text-sm">End time
                <input type="time" value={weekend.endTime}
                       onchange={(e) => updateWeekend({endTime: e.currentTarget.value})}
                       class="block mt-1 rounded border border-gray-300 dark:border-gray-500 bg-transparent px-2 py-1 text-sm"/>
            </label>
        </div>
    </section>
    <section>
        <h3 class="font-bold mb-2">Colors</h3>
        <div class="flex flex-wrap gap-4">
            {#each COLOR_KEYS as key (key)}
                <div class="text-sm capitalize">
                    <p class="mb-1">{key}</p>
                    <ColorSelect value={colors[key]} title="{key} bar color"
                                 onchange={(c: BarColor) => updateColor(key, c)}/>
                </div>
            {/each}
        </div>
    </section>
</div>
