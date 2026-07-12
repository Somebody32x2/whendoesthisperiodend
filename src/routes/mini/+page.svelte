<script lang="ts">
    // Embedded mini viewer (used as a preview/demo on the home page).
    // Deliberately has NO extra UI: no switcher, no drawer, no PiP.
    // School comes from ?school=<id>, else the saved preference, else the first school.
    import {onMount} from "svelte";
    import {page} from "$app/stores";
    import BarsView from "$lib/components/BarsView.svelte";
    import {ScheduleRunner} from "$lib/client/runner.svelte";
    import {fetchSchoolConfig, fetchSchools} from "$lib/client/api";
    import {prefs} from "$lib/stores/prefs.svelte";

    const runner = new ScheduleRunner();

    onMount(() => {
        (async () => {
            let id = $page.url.searchParams.get("school") || prefs.school;
            if (!id || id === "custom") {
                try {
                    id = (await fetchSchools())[0]?.id ?? "";
                } catch {
                    id = "";
                }
            }
            if (id) {
                try {
                    runner.setConfig(await fetchSchoolConfig(id));
                } catch (e) {
                    console.error(e);
                }
            }
        })();

        const tickInterval = setInterval(() => runner.tick(), 123);
        return () => clearInterval(tickInterval);
    });
</script>

<div class="w-full min-h-[100vh] flex items-center justify-center flex-col dark:bg-gray-800 dark:text-white relative">
    <div class="w-[95%] md:w-[75%] text-center">
        <BarsView bars={runner.bars} metrics={runner.metrics} mini decimalModifier={-1}/>
    </div>
</div>
