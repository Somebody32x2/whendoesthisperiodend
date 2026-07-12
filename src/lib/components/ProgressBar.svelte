<script lang="ts">
    // Minimal replacement for @svelteuidev/core's <Progress size="xs" striped animate>.
    import {BAR_COLORS, type BarColor} from "$lib/config/colors";

    let {value = 0, color = "blue" as BarColor} = $props();

    const clamped = $derived(Math.min(100, Math.max(0, value)));
</script>

<div class="w-full py-2">
    <div class="h-4 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-600" role="progressbar"
         aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(clamped)}>
        <div class="h-full rounded progress-striped"
             style="width: {clamped}%; background-color: {BAR_COLORS[color] ?? BAR_COLORS.blue};"></div>
    </div>
</div>

<style>
    .progress-striped {
        background-image: linear-gradient(
                45deg,
                rgba(255, 255, 255, 0.15) 25%,
                transparent 25%,
                transparent 50%,
                rgba(255, 255, 255, 0.15) 50%,
                rgba(255, 255, 255, 0.15) 75%,
                transparent 75%,
                transparent
        );
        background-size: 1rem 1rem;
        animation: progress-stripes 1s linear infinite;
        transition: width 60ms linear;
    }

    @keyframes progress-stripes {
        from {
            background-position: 1rem 0;
        }
        to {
            background-position: 0 0;
        }
    }
</style>
