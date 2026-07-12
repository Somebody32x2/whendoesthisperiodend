// Admin UI talks to the API entirely client-side (auth is cookie-based, forms mutate
// live drafts) — no benefit to SSR here, and it would just double-fetch on load.
export const ssr = false;
