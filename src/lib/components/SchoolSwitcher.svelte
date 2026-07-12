<script lang="ts">
    // Collapsible school switcher pill shown at the top of the main page.
    import type {SchoolSummary} from "$lib/config/types";

    interface Props {
        schools: SchoolSummary[];
        selected: string; // school id or "custom"
        onselect: (id: string) => void;
    }

    let {schools, selected, onselect}: Props = $props();
    let open = $state(false);

    const selectedName = $derived(
        selected === "custom" ? "Custom" : (schools.find(s => s.id === selected)?.name ?? selected));

    function choose(id: string) {
        open = false;
        if (id !== selected) onselect(id);
    }
</script>

<div class="relative z-20 mt-3 flex flex-col items-center">
    <button
            class="flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur px-4 py-1.5 text-sm sm:text-base shadow-sm hover:shadow transition-shadow"
            onclick={() => open = !open}
            aria-expanded={open} aria-haspopup="listbox" title="Switch school">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" class="w-4 h-4 opacity-70" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 3 2 8l10 5 10-5-10-5Zm-6 7.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5"/>
        </svg>
        <span class="font-semibold">{selectedName}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" class="w-4 h-4 transition-transform {open ? 'rotate-180' : ''}" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6"/>
        </svg>
    </button>

    {#if open}
        <ul class="absolute top-full mt-2 min-w-[14rem] max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg py-1"
            role="listbox">
            {#each schools as school (school.id)}
                <li>
                    <button class="w-full text-left px-4 py-2 text-sm sm:text-base hover:bg-gray-100 dark:hover:bg-gray-600 {selected === school.id ? 'font-bold' : ''}"
                            role="option" aria-selected={selected === school.id}
                            onclick={() => choose(school.id)}>
                        {school.name}
                    </button>
                </li>
            {/each}
            <li>
                <button class="w-full text-left px-4 py-2 text-sm sm:text-base hover:bg-gray-100 dark:hover:bg-gray-600 border-t border-gray-200 dark:border-gray-600 {selected === 'custom' ? 'font-bold' : ''}"
                        role="option" aria-selected={selected === "custom"}
                        onclick={() => choose("custom")}>
                    Custom
                    <span class="block text-xs opacity-60">your own progress bars</span>
                </button>
            </li>
        </ul>
    {/if}
</div>
