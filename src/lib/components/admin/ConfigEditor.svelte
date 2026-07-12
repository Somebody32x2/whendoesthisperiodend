<script lang="ts">
    // Owns the editable draft for one school: validation is recomputed on every edit
    // (shared schema — never drifts from the server), and children mutate it only via
    // immutable onchange callbacks that reassign a field of `draft`.
    import {base} from "$app/paths";
    import {validateSchoolConfig} from "$lib/config/schema";
    import type {SchoolConfig} from "$lib/config/types";
    import NormalScheduleEditor from "./NormalScheduleEditor.svelte";
    import SpecialScheduleEditor from "./SpecialScheduleEditor.svelte";
    import BreakEditor from "./BreakEditor.svelte";
    import WeekendColorsEditor from "./WeekendColorsEditor.svelte";
    import BarsEditor from "./BarsEditor.svelte";
    import RawJsonTab from "./RawJsonTab.svelte";
    import PreviewPane from "./PreviewPane.svelte";

    interface Props {
        school: string;
        initial: SchoolConfig;
        onback: () => void;
    }

    let {school, initial, onback}: Props = $props();

    // $state.snapshot first: `initial` arrives as a $state proxy from the parent,
    // which structuredClone cannot clone (DataCloneError)
    let draft = $state<SchoolConfig>(structuredClone($state.snapshot(initial)) as SchoolConfig);
    let savedSnapshot = $state<SchoolConfig>(structuredClone($state.snapshot(initial)) as SchoolConfig);

    type TabKey = "schedules" | "special" | "breaks" | "weekend" | "bars" | "raw" | "preview";
    const TABS: { key: TabKey, label: string }[] = [
        {key: "schedules", label: "Schedules"},
        {key: "special", label: "Special Days"},
        {key: "breaks", label: "Breaks"},
        {key: "weekend", label: "Weekend & Colors"},
        {key: "bars", label: "Bars"},
        {key: "raw", label: "Raw JSON"},
        {key: "preview", label: "Preview"}
    ];
    let activeTab = $state<TabKey>("schedules");

    let saving = $state(false);
    let saveErrors = $state<string[]>([]);
    let savedFlash = $state(false);

    const validation = $derived(validateSchoolConfig(draft));
    const dirty = $derived(JSON.stringify(draft) !== JSON.stringify(savedSnapshot));

    $effect(() => {
        // Warn on tab/window close while there are unsaved changes.
        const isDirty = dirty;
        function handler(e: BeforeUnloadEvent) {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        }
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    });

    async function save() {
        if (!validation.ok || !dirty || saving) return;
        saving = true;
        saveErrors = [];
        try {
            const res = await fetch(`${base}/api/schools/${encodeURIComponent(school)}`, {
                method: "PUT",
                headers: {"content-type": "application/json"},
                body: JSON.stringify(draft)
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                saveErrors = data.errors ?? [data.error ?? `Save failed (HTTP ${res.status}).`];
                return;
            }
            savedSnapshot = structuredClone($state.snapshot(draft)) as SchoolConfig;
            savedFlash = true;
            setTimeout(() => savedFlash = false, 2000);
        } catch (e) {
            saveErrors = [e instanceof Error ? e.message : String(e)];
        } finally {
            saving = false;
        }
    }

    function handleBack() {
        if (dirty && !confirm("You have unsaved changes. Discard them and go back?")) return;
        onback();
    }
</script>

<div>
    <div class="sticky top-0 z-10 -mx-4 px-4 py-3 mb-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur border-b border-gray-300 dark:border-gray-600 flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3 min-w-0">
            <button type="button" onclick={handleBack}
                    class="rounded border border-gray-300 dark:border-gray-500 px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0">
                ← Back
            </button>
            <h2 class="text-lg font-bold truncate">{draft.name} <span
                    class="text-xs font-normal opacity-60">({school})</span></h2>
        </div>
        <div class="flex items-center gap-2 shrink-0">
            {#if savedFlash}
                <span class="text-sm text-green-600 dark:text-green-400">Saved ✓</span>
            {/if}
            <button type="button" onclick={save} disabled={!validation.ok || !dirty || saving}
                    class="rounded bg-blue-600 disabled:opacity-50 text-white px-4 py-1.5 text-sm hover:bg-blue-700">
                {saving ? "Saving…" : "Save"}
            </button>
        </div>
    </div>

    <div class="flex gap-4 border-b border-gray-300 dark:border-gray-600 mb-4 overflow-x-auto">
        {#each TABS as tab (tab.key)}
            <button type="button" onclick={() => activeTab = tab.key}
                    class="pb-2 px-1 text-sm whitespace-nowrap {activeTab === tab.key ? 'border-b-2 border-blue-600 font-semibold' : 'opacity-60 hover:opacity-100'}">
                {tab.label}
            </button>
        {/each}
    </div>

    {#if activeTab === "schedules"}
        <NormalScheduleEditor schedules={draft.normalSchedules}
                               onchange={(v) => draft.normalSchedules = v}/>
    {:else if activeTab === "special"}
        <SpecialScheduleEditor schedules={draft.specialSchedules} schoolYear={draft.schoolYear}
                                onchange={(v) => draft.specialSchedules = v}/>
    {:else if activeTab === "breaks"}
        <BreakEditor breaks={draft.breaks} schoolYear={draft.schoolYear}
                     onchange={(v) => draft.breaks = v}/>
    {:else if activeTab === "weekend"}
        <WeekendColorsEditor weekend={draft.weekend} colors={draft.colors}
                              onchange={(patch) => {
                                  if (patch.weekend) draft.weekend = patch.weekend;
                                  if (patch.colors) draft.colors = patch.colors;
                              }}/>
    {:else if activeTab === "bars"}
        <BarsEditor bars={draft.bars} schoolYear={draft.schoolYear}
                    onchange={(v) => draft.bars = v}/>
    {:else if activeTab === "raw"}
        <RawJsonTab draft={draft} onapply={(cfg) => draft = cfg as SchoolConfig}/>
    {:else if activeTab === "preview"}
        <PreviewPane draft={draft} valid={validation.ok}/>
    {/if}

    <div class="mt-6 rounded-lg border p-3 {validation.ok ? 'border-gray-300 dark:border-gray-600' : 'border-red-400 dark:border-red-600'}">
        {#if validation.ok}
            <p class="text-sm text-green-600 dark:text-green-400">
                ✓ Valid configuration{dirty ? " (unsaved changes)" : ""}
            </p>
        {:else}
            <p class="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
                {validation.errors.length} validation error{validation.errors.length === 1 ? "" : "s"}:
            </p>
            <ul class="text-xs text-red-600 dark:text-red-400 list-disc list-inside space-y-0.5 max-h-48 overflow-y-auto">
                {#each validation.errors as err}
                    <li>{err}</li>
                {/each}
            </ul>
        {/if}
        {#if saveErrors.length > 0}
            <p class="text-sm font-semibold text-red-600 dark:text-red-400 mt-2 mb-1">Server rejected save:</p>
            <ul class="text-xs text-red-600 dark:text-red-400 list-disc list-inside space-y-0.5">
                {#each saveErrors as err}
                    <li>{err}</li>
                {/each}
            </ul>
        {/if}
    </div>
</div>
