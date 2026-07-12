# When Does This Period End?

Live progress bars for the school day: current period, break, day, week, plus configurable
extra bars (school year, graduation, quarters, ...). SvelteKit (adapter-node, run under Bun),
Tailwind, luxon.

## Architecture

- **Engine** (`src/lib/engine/`) — pure functions of `(config, now)`: `getDayInfo`,
  `getWeekBounds`, `computeSnapshot`. No mutation, no `DateTime.now()` inside; the UI
  recomputes a snapshot whenever `now` passes `snapshot.validUntil` and only updates
  percentages in between.
- **Config** (`src/lib/config/`) — per-school schedules live in JSON validated by a shared
  zod schema (`schema.ts`, used by both the browser and the save API). See
  [static/example-school.json](static/example-school.json) for the shape. Entries support
  `"disabled": true` (kept but ignored — restorable in the admin UI, which year-shifts
  their dates forward).
- **Server** (`src/lib/server/`, `src/routes/api/`) — school JSONs, `passwords.txt`
  (`<schoolId>=<password>` lines, `*=<globalKey>` for everything), file-backed sessions and
  an append-only `admin.log` all live in `$DATA_DIR` (default `./data`, gitignored; a host
  bind mount in production). Real school configs are never committed.
- **Admin** (`/admin`) — per-school password (or global key) login, form + raw-JSON editing
  with client- and server-side validation from the same schema, and a live/simulated-time
  preview before saving.
- `/mini` — bare embed view (`?school=<id>`), used as a demo on the home page.

## Develop

```sh
bun install
bun run dev        # http://localhost:5173 — seeds ./data on first run
bun run test       # vitest engine/schema suite
bun run check      # svelte-check
```

Set a global admin key for local dev by writing `*=yourkey` to `data/passwords.txt`
(or set `SEED_GLOBAL_KEY` before first run).

## Deploy

Built on Coolify (nixpacks, Bun) from `master` with env `BASE_PATH=/whendoesthisperiodend`,
`DATA_DIR=/app/data` and a host bind mount for the data dir. `bun run build` then
`bun ./build/index.js` serves everything, API included. The old static build lives frozen on
the `compiled` branch as a rollback.
