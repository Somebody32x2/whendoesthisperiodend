// Drives the display: holds the current Snapshot, refreshes it when it goes stale
// (or when the config / simulated time changes), and recomputes per-bar metrics on
// every fast tick. Used by the main page, /mini and the admin preview.
import {DateTime} from "luxon";
import type {SchoolConfig} from "$lib/config/types";
import {resolveConfig, type ResolvedConfig} from "$lib/engine/resolve";
import {computeSnapshot, type Snapshot} from "$lib/engine/engine";
import type {BarSpec} from "$lib/engine/bars";
import {barMetrics, type BarMetrics} from "$lib/engine/metrics";
import {prefs, type CustomBar} from "$lib/stores/prefs.svelte";

export function customBarToSpec(bar: CustomBar): BarSpec | null {
    const start = DateTime.fromISO(bar.start);
    const end = DateTime.fromISO(bar.end);
    if (!start.isValid || !end.isValid || start >= end) return null;
    return {
        id: `custom-${bar.id}`,
        label: bar.label || "Custom Bar",
        color: bar.color,
        start,
        end,
        showDays: true,
        showEndpoints: false
    };
}

export class ScheduleRunner {
    private rc: ResolvedConfig | null = null;
    /** "custom" or the school id — the key custom bars + bar prefs are stored under */
    contextKey = $state("custom");
    /** When set (admin preview), the runner is pinned to this instant */
    fixedNow: DateTime | null = null;

    snapshot = $state<Snapshot | null>(null);
    bars = $state<BarSpec[]>([]);
    metrics = $state<Record<string, BarMetrics>>({});

    setConfig(config: SchoolConfig | null): void {
        this.rc = config ? resolveConfig(config) : null;
        this.contextKey = config ? config.id : "custom";
        this.refresh();
        this.tick();
    }

    setFixedNow(now: DateTime | null): void {
        this.fixedNow = now;
        this.refresh();
        this.tick();
    }

    now(): DateTime {
        if (this.fixedNow) return this.fixedNow;
        return this.rc ? DateTime.now().setZone(this.rc.zone) : DateTime.now();
    }

    /** Recompute the snapshot and the visible bar list. */
    refresh(): void {
        this.snapshot = this.rc ? computeSnapshot(this.rc, this.now()) : null;
        const bars: BarSpec[] = [];
        if (this.snapshot && this.rc) {
            const scheduleIds = new Set(["period", "break", "day", "week"]);
            for (const bar of this.snapshot.bars) {
                if (scheduleIds.has(bar.id)) {
                    bars.push(bar);
                } else {
                    const cfgBar = this.rc.enabledBars.find(b => b.id === bar.id);
                    if (prefs.isBarEnabled(this.contextKey, bar.id, cfgBar?.enabledByDefault ?? true)) {
                        bars.push(bar);
                    }
                }
            }
        }
        for (const custom of prefs.getCustomBars(this.contextKey)) {
            const spec = customBarToSpec(custom);
            if (spec) bars.push(spec);
        }
        this.bars = bars;
    }

    /** Fast-loop update: refresh metrics; roll the snapshot over when it goes stale. */
    tick(): void {
        const now = this.now();
        if (this.rc && (!this.snapshot || now >= this.snapshot.validUntil)) {
            this.refresh();
        }
        const metrics: Record<string, BarMetrics> = {};
        for (const bar of this.bars) metrics[bar.id] = barMetrics(bar, now);
        this.metrics = metrics;
    }
}
