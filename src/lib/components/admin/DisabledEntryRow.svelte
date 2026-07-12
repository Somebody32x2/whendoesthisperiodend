<script lang="ts">
    // Reusable card/collapsed-row wrapper for editable list entries (schedules, breaks,
    // bars) that can be disabled instead of deleted. Restore semantics (year-shifting
    // dates) live in the parent editors — this component just wires up the buttons.
    import type {Snippet} from "svelte";

    interface Props {
        disabled: boolean;
        title: string;
        onrestore: () => void;
        ondisable: () => void;
        ondelete: () => void;
        children: Snippet;
    }

    let {disabled, title, onrestore, ondisable, ondelete, children}: Props = $props();

    function handleDelete() {
        if (confirm(`Delete "${title}"? This can't be undone unless you discard your unsaved changes.`)) {
            ondelete();
        }
    }
</script>

{#if disabled}
    <div class="mb-3 rounded-lg border border-gray-300 dark:border-gray-600 opacity-50 px-3 py-2">
        <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
                <span class="font-semibold">{title}</span>
                <span class="text-xs rounded-full bg-gray-400 dark:bg-gray-500 text-white px-2 py-0.5">disabled</span>
            </div>
            <div class="flex items-center gap-2">
                <button type="button" onclick={onrestore}
                        class="rounded border border-gray-300 dark:border-gray-500 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700">
                    Restore
                </button>
                <button type="button" onclick={handleDelete}
                        class="rounded border border-red-400 text-red-600 dark:text-red-400 px-2 py-1 text-xs hover:bg-red-50 dark:hover:bg-red-900/30">
                    Delete
                </button>
            </div>
        </div>
        <p class="text-xs opacity-80 mt-1">Restore shifts all dates forward into the current school year — review
            before saving.</p>
    </div>
{:else}
    <div class="mb-3 rounded-lg border border-gray-300 dark:border-gray-500 p-3">
        <div class="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <span class="font-semibold">{title}</span>
            <div class="flex items-center gap-2">
                <button type="button" onclick={ondisable}
                        class="rounded border border-gray-300 dark:border-gray-500 px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700">
                    Disable
                </button>
                <button type="button" onclick={handleDelete}
                        class="rounded border border-red-400 text-red-600 dark:text-red-400 px-2 py-1 text-xs hover:bg-red-50 dark:hover:bg-red-900/30">
                    Delete
                </button>
            </div>
        </div>
        {@render children()}
    </div>
{/if}
