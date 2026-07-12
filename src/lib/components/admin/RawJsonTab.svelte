<script lang="ts">
    // Explicit Apply/Refresh rather than a live two-way bind: editing JSON by hand
    // while the form silently rewrites it out from under you is a bad time.
    import type {SchoolConfig} from "$lib/config/types";

    interface Props {
        draft: SchoolConfig;
        onapply: (cfg: unknown) => void;
    }

    let {draft, onapply}: Props = $props();

    let text = $state(JSON.stringify(draft, null, 2));
    let parseError = $state("");

    function refresh() {
        text = JSON.stringify(draft, null, 2);
        parseError = "";
    }

    function apply() {
        try {
            const parsed = JSON.parse(text);
            parseError = "";
            onapply(parsed);
        } catch (e) {
            parseError = e instanceof Error ? e.message : String(e);
        }
    }
</script>

<div class="space-y-2">
    <div class="flex gap-2">
        <button type="button" onclick={apply}
                class="rounded bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700">
            Apply
        </button>
        <button type="button" onclick={refresh}
                class="rounded border border-gray-300 dark:border-gray-500 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
            Refresh from form
        </button>
    </div>
    {#if parseError}
        <p class="text-sm text-red-500">Parse error: {parseError}</p>
    {/if}
    <label class="block text-sm" for="raw-json-textarea">Raw config JSON</label>
    <textarea id="raw-json-textarea" bind:value={text} spellcheck="false"
              class="font-mono text-xs w-full h-[32rem] rounded border border-gray-300 dark:border-gray-500 bg-transparent p-2"></textarea>
</div>
