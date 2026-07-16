<script lang="ts">
    import {BAR_COLOR_NAMES, BAR_COLORS, type BarColor} from "$lib/config/colors";

    interface Props {
        value: BarColor;
        onchange: (color: BarColor) => void;
        title?: string;
    }

    let {value, onchange, title = "Bar color"}: Props = $props();
</script>

<span class="inline-flex items-center gap-1.5">
    <span class="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shrink-0"
          style="background-color: {BAR_COLORS[value] ?? BAR_COLORS.blue};"></span>
    <select {value} {title} aria-label={title}
            onchange={(e) => onchange(e.currentTarget.value as BarColor)}
            class="rounded border border-gray-300 dark:border-gray-500 bg-transparent dark:bg-gray-700 px-1 py-1 text-sm">
        {#each BAR_COLOR_NAMES as color}
            <option value={color} style="color: {BAR_COLORS[color]};">{color}</option>
        {/each}
    </select>
</span>
