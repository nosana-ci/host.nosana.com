# Recent Benchmarks (last 24h) — Design

**Date:** 2026-06-02
**Status:** Approved (pending written-spec review)
**Area:** `hosts-ui` node detail page

## Summary

Add an owner-only **Benchmarks** view to the node detail page that showcases the
node's benchmark runs from the last 24 hours plus the node's current feedback
report. Data comes from a new backend endpoint, `GET /benchmarks/recent`, which
identifies the node from the request signature and returns only the calling
node's own runs.

Because the data can only be fetched with the node's own signature, this view is
inherently **owner-only** — it appears only when the connected wallet is the node
being viewed (`isOwner`), gated exactly like the existing Earnings/Uptime
sections.

## Goals

- Give node operators a single place to see, with equal weight:
  1. their node's **current feedback report** (pass/fail against market rules), and
  2. the **individual benchmark runs** from the last 24h (status, timing,
     extracted metrics, anti-spoof results, raw output).
- Reuse existing app patterns (Bulma styling, `useMyAsyncData`, the signed-fetch
  pattern already used for uptime rewards).

## Non-goals

- No new route/URL. Tab state is purely client-side (not bookmarkable, not
  persisted across refresh) — chosen deliberately.
- No auto-refresh/polling. No job-definition display (not returned by the API).
- No test framework introduced (repo currently has none); verification is manual
  in the running app.

## API contract

`GET /benchmarks/recent`

- **Auth:** `Authorization: <publicKey>:<signature>` — the same SDK-signature auth
  used by other `/benchmarks/*` endpoints. The node is identified from the
  signature; there are **no path/query params**. Returns only the calling node's
  own runs.
- In this app the request goes to `${apiBase}/api/benchmarks/recent` (the app
  prefixes `/api`, consistent with the existing
  `/api/benchmarks/market-metric-aggregates` call).

### Response shape

```jsonc
{
  // The node's CURRENT feedback report (per-node, market-scoped snapshot).
  // NOT per-benchmark, and null if the node has none yet. Render ONCE.
  "feedbackReport": {
    "marketAddress": "string",
    "marketName": "string?",        // optional
    "passed": true,
    "metrics": [
      {
        "metricKey": "string",
        "measuredValue": 0,           // optional; number|string|bool|null|array
        "ruleDescription": "string",
        "passed": true,
        "failureMessage": "string?",  // optional
        "isOptional": false
      }
    ]
  },

  "benchmarks": [                     // newest-first, capped to last 24h, may be []
    {
      "id": "uuid",
      "status": "pending | submitted | ...", // run lifecycle status
      "createdAt": "ISO-8601",
      "submittedAt": "ISO-8601 | null",      // null until results submitted
      "rawResults": { },                      // raw run output (jsonb); null if not submitted
      "operations": [{ "operationId": 123 }], // which operations the run covered
      "metrics": [                            // extracted metrics for THIS run
        {
          "metricKey": "string",
          "instance": "string",               // "" for non-instanced, else e.g. "gpu:0"
          "value": null,                       // jsonb; scalar or array
          "isValid": true,                     // false once superseded by a newer run
          "createdAt": "ISO-8601"
        }
      ],
      "antiSpoofs": [                          // GPU anti-spoof results (sanitized)
        {
          "gpuType": "NVIDIA RTX 4090",
          "gpuUUID": "GPU-...",
          "verified": true,
          "seedAt": "ISO-8601",
          "predictedAt": "ISO-8601 | null"
        }
      ]
    }
  ]
}
```

### Contract notes the UI must honor

- `benchmarks` is newest-first and can be empty → show an empty state, not an error.
- `feedbackReport` reflects "now" and is rendered **once** (a banner), not per run.
- A `pending` run (or any status not yet `submitted`) has `rawResults: null`,
  `submittedAt: null`, and likely empty `metrics`/`antiSpoofs` → handle gracefully.
- `metrics[].isValid === false` means superseded by a later run → dim it (kept visible).
- Anti-spoof is sanitized: only `verified` (pass/fail) + timing. No seed/prediction
  value to display.

## Architecture

### Placement: owner-only in-page tab on `app/pages/[id].vue`

- Add a Bulma `.tabs` bar that is rendered **only when `isOwner`**. Tabs:
  **Overview** (all existing page content) and **Benchmarks** (new). Non-owners
  see today's page unchanged (no tab bar).
- Add `const activeTab = ref<'overview' | 'benchmarks'>('overview')`.
- Wrap the existing template body in a container with
  `v-show="activeTab === 'overview'"`. Using `v-show` (not `v-if`) keeps the
  existing charts and their data fetches mounted so toggling tabs never re-runs them.
- Add `const benchmarksOpened = ref(false)`, set to `true` the first time the
  Benchmarks tab is activated.
- Render the new view as:
  `<RecentBenchmarks v-if="benchmarksOpened" v-show="activeTab === 'benchmarks'" ... />`
  This mounts the component **once on first open** (a single signed fetch), then
  keeps it alive and cached across subsequent tab toggles → satisfies
  "fetch on open only" with no repeated wallet signature prompts.

### Components (each small and single-purpose)

1. **`app/components/Host/RecentBenchmarks.vue`** — container.
   - Props: `nodeAddress`, `connected`, `publicKey`, `wallet`, `isOwner`.
   - Calls `useRecentBenchmarks(...)`; owns loading/error/empty states.
   - Renders `BenchmarkFeedbackReport` (when `feedbackReport` is non-null) and the
     list of `BenchmarkRunItem` (one per `benchmarks[]` entry).

2. **`app/components/Host/BenchmarkFeedbackReport.vue`** — the banner.
   - Headline: pass/fail pill (from `passed`), market name (`marketName` ||
     truncated `marketAddress`), and counts derived from `metrics`:
     "X passed · Y failed · Z optional".
   - Expand toggle reveals the full rule list: per metric `metricKey`,
     `ruleDescription`, pass/fail/optional icon, `measuredValue`, and
     `failureMessage` when present.

3. **`app/components/Host/BenchmarkRunItem.vue`** — one accordion run.
   - Collapsed summary: status pill (`status`), relative `createdAt` (absolute on
     hover/title), anti-spoof badge (derived from `antiSpoofs` verified state),
     metric count, operation count, chevron.
   - Expanded:
     - **Metrics** — list of `metricKey` + `instance` (when non-empty) + rendered
       `value`. Metrics with `isValid === false` are dimmed + struck-through.
     - **Anti-spoof** — per GPU: `gpuType`, truncated `gpuUUID`, verified ✓/✗, and
       seed→prediction timing from `seedAt`/`predictedAt`.
     - **Raw output** — collapsible "view raw JSON" block (`<pre>` of
       `JSON.stringify(rawResults, null, 2)`); shown only when `rawResults` is non-null.
   - Pending/not-submitted runs show the pending pill and a "no results yet" note;
     no metrics/anti-spoof/raw sections.

### Data layer

**`app/composables/useRecentBenchmarks.ts`** — encapsulates the signed request and
exports the response types. Mirrors the existing uptime-rewards pattern in
`app/pages/[id].vue` (~lines 872-905):

- Built on `useMyAsyncData` with `disableToastOnError: true` and a graceful default.
- Handler:
  - If `!(isOwner && connected && publicKey && wallet)` → return `null` (no fetch).
  - Otherwise build the auth header via
    `createSignedWalletAuthHeader({ connected, publicKey, wallet, message: publicKey.toString() })`
    and `$fetch('/api/benchmarks/recent', { baseURL: apiBase, headers: { Accept, Authorization } })`.
- Returns `{ data, pending, error, refresh }`.

**Exported TypeScript types** (matching the contract exactly):
`RecentBenchmarksResponse`, `FeedbackReport`, `FeedbackMetric`, `BenchmarkRun`,
`BenchmarkRunMetric`, `AntiSpoof`.

### Pure helpers (factored out for clarity; verified manually)

- Relative-time formatting (with absolute timestamp for the tooltip/title).
- jsonb `value` rendering (scalar rendered directly; array joined/listed; null → "—").
- Feedback-report counts (passed / failed / optional) from `metrics`.
- Anti-spoof summary for the collapsed badge (e.g. all-verified vs any-failed).

## States & edge cases

| Condition | UI |
|---|---|
| Loading | progress bar (existing `progress is-small is-info` pattern) |
| Fetch error | `notification is-warning` with a message |
| `benchmarks: []` | friendly empty state ("No benchmark runs in the last 24h"), not an error |
| `feedbackReport: null` | banner hidden + small "no current feedback report yet" note |
| Pending run | pending pill + "no results yet"; no metrics/anti-spoof/raw |
| `isValid === false` metric | dimmed + struck-through, kept visible |
| `value` is array | joined/listed; scalars rendered directly |
| Not owner | no Benchmarks tab; page unchanged |

## Testing & verification

No test framework is added (the repo has none; lint is a no-op). Verification is
manual in the running app, exercising: owner vs non-owner, loading, error, empty
(no runs), `feedbackReport` null, a pending run, a submitted run with metrics +
anti-spoof + raw JSON, and a superseded (`isValid === false`) metric. The pure
helpers above are written as standalone functions to keep that logic easy to
reason about and eyeball.

## Files touched

- `app/pages/[id].vue` — add tabs + mount `RecentBenchmarks` (owner-only).
- `app/components/Host/RecentBenchmarks.vue` — new.
- `app/components/Host/BenchmarkFeedbackReport.vue` — new.
- `app/components/Host/BenchmarkRunItem.vue` — new.
- `app/composables/useRecentBenchmarks.ts` — new. Exports the composable, the
  response types, and the pure helpers listed above.
