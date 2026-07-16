// Drives the display: holds the current Snapshot, refreshes it when it goes stale
// (or when the config / simulated time changes), and recomputes per-bar metrics on
// every fast tick. Used by the main page, /mini and the admin preview.
import {DateTime} from "luxon";
import type {SchoolConfig} from "$lib/config/types";
import {resolveConfig, type ResolvedConfig} from "$lib/engine/resolve";
import {computeSnapshot, type Snapshot} from "$lib/engine/engine";
import type {BarSpec} from "$lib/engine/bars";
import {barMetrics, type BarMetrics} from "$lib/engine/metrics";
import {prefs} from "$lib/stores/prefs.svelte";
import {evalCustomBar} from "$lib/client/customBars";

export class ScheduleRunner {
    private rc: ResolvedConfig | null = null;
    /** "custom" or the school id; the key custom bars + bar prefs are stored under */
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

    /** Next instant any custom bar's spec changes (weekday rollover, period boundary, ...) */
    private customBoundary: DateTime | null = null;

    /** Recompute the snapshot and the visible bar list. */
    refresh(): void {
        const now = this.now();
        this.snapshot = this.rc ? computeSnapshot(this.rc, now) : null;
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
        this.customBoundary = null;
        for (const custom of prefs.getCustomBars(this.contextKey)) {
            const {spec, nextBoundary} = evalCustomBar(custom, now);
            if (spec) bars.push(spec);
            if (nextBoundary && nextBoundary > now &&
                (!this.customBoundary || nextBoundary < this.customBoundary)) {
                this.customBoundary = nextBoundary;
            }
        }
        this.bars = bars;
    }

    /** Fast-loop update: refresh metrics; roll the snapshot or custom bars over when stale. */
    tick(): void {
        const now = this.now();
        const snapshotStale = this.rc && (!this.snapshot || now >= this.snapshot.validUntil);
        const customStale = this.customBoundary !== null && now >= this.customBoundary;
        if (snapshotStale || customStale) {
            this.refresh();
        }
        const metrics: Record<string, BarMetrics> = {};
        for (const bar of this.bars) metrics[bar.id] = barMetrics(bar, now);
        this.metrics = metrics;
    }
}
