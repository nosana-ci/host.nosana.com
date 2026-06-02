# Recent Benchmarks (last 24h) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an owner-only "Benchmarks" tab to the node detail page that shows the node's last-24h benchmark runs plus its current feedback report, backed by `GET /benchmarks/recent`.

**Architecture:** A client-side tab toggle on `app/pages/[id].vue` (Overview ↔ Benchmarks), shown only when the connected wallet is the node (`isOwner`). The Benchmarks view mounts once on first open and performs a single SDK-signed fetch (same pattern as the existing uptime-rewards call). It renders a summary→expand feedback-report banner and an accordion of runs (dimmed superseded metrics, collapsible raw JSON, sanitized anti-spoof). Three new components + one composable (which also exports the response types and pure display helpers).

**Tech Stack:** Nuxt 4 (Vue 3, `<script setup lang="ts">`), Bulma + scoped SCSS, `useMyAsyncData` (Nuxt `useLazyAsyncData` wrapper), `createSignedWalletAuthHeader` (`@nosana/authorization`).

**Spec:** `docs/superpowers/specs/2026-06-02-recent-benchmarks-design.md`

**Verification note:** The repo has no test runner and `vue-tsc` is not installed, so there is no automated typecheck/test. Verification is manual: run the dev server (Vite shows template/TS errors as an overlay and in the terminal) and observe the browser. Because the real endpoint needs an owner wallet + backend, the rich data states are verified in Task 6 with a temporary in-component fixture that is then reverted.

**How to run the app (used in every verification step):**
```bash
npm run dev   # starts Nuxt on http://localhost:3000 using .env.local-backend
```
Run it in the background. A node detail page is at `http://localhost:3000/<nodeAddress>`. "Owner view" = connect the wallet whose address equals `<nodeAddress>`.

---

## File Structure

- **Create** `app/composables/useRecentBenchmarks.ts` — response TypeScript types, pure display helpers, and the signed-fetch composable. One file because these change together and are consumed by all three components.
- **Create** `app/components/Host/BenchmarkFeedbackReport.vue` — the summary→expand feedback-report banner.
- **Create** `app/components/Host/BenchmarkRunItem.vue` — one accordion run row (collapsed summary + expandable metrics / anti-spoof / raw JSON).
- **Create** `app/components/Host/RecentBenchmarks.vue` — container: calls the composable, owns loading/error/empty states, renders the banner + run list.
- **Modify** `app/pages/[id].vue` — add the owner-only tab bar, wrap existing content in the Overview tab, mount `RecentBenchmarks` in the Benchmarks tab, add a small tab-accent style.

---

## Task 1: Owner-only tab scaffold on the node page

Add the tab bar and a temporary placeholder so the tab mechanics are verifiable before any data work. The placeholder is replaced in Task 5.

**Files:**
- Modify: `app/pages/[id].vue` (template ~lines 1-5 and ~169-181; script ~lines 205-218; style ~line 1002)

- [ ] **Step 1: Add the `RecentBenchmarks` import placeholder is NOT needed yet — add tab state to the script**

In `app/pages/[id].vue`, find:

```ts
// Get node address from route params
const nodeAddress = computed(() => route.params.id as string);
```

Replace with:

```ts
// Get node address from route params
const nodeAddress = computed(() => route.params.id as string);

// --- Node detail tabs (Overview | Benchmarks). Benchmarks is owner-only. ---
const activeTab = ref<'overview' | 'benchmarks'>('overview');
const benchmarksOpened = ref(false); // flips true on first Benchmarks open so the view mounts once and caches
const selectBenchmarks = () => {
  benchmarksOpened.value = true;
  activeTab.value = 'benchmarks';
};
```

(`ref` and `computed` are already imported at the top of this file.)

- [ ] **Step 2: Add the tab bar and open the Overview wrapper**

Find:

```html
  <LayoutTopBar :title="'Host'">
  </LayoutTopBar>

  <!-- Earnings Section - Only show if connected wallet matches node -->
```

Replace with:

```html
  <LayoutTopBar :title="'Host'">
  </LayoutTopBar>

  <div v-if="isOwner" class="tabs benchmark-tabs mt-4">
    <ul>
      <li :class="{ 'is-active': activeTab === 'overview' }">
        <a @click="activeTab = 'overview'">Overview</a>
      </li>
      <li :class="{ 'is-active': activeTab === 'benchmarks' }">
        <a @click="selectBenchmarks">Benchmarks</a>
      </li>
    </ul>
  </div>

  <div v-show="activeTab === 'overview'">
  <!-- Earnings Section - Only show if connected wallet matches node -->
```

- [ ] **Step 3: Close the Overview wrapper and add a temporary Benchmarks placeholder**

Find (the end of the template, the Jobs Ran box followed by `</template>`):

```html
  <div class="box mt-5" v-if="nodeAddress">
    <DeploymentList
      :per-page="jobLimit"
      :total-jobs="totalRunJobs"
      v-model:page="jobPage"
      v-model:state="jobState"
      :loading-jobs="loadingJobs"
      title="Jobs Ran"
      :jobs="jobs?.jobs || []"
      :states="[1, 2]"
    />
  </div>
</template>
```

Replace with:

```html
  <div class="box mt-5" v-if="nodeAddress">
    <DeploymentList
      :per-page="jobLimit"
      :total-jobs="totalRunJobs"
      v-model:page="jobPage"
      v-model:state="jobState"
      :loading-jobs="loadingJobs"
      title="Jobs Ran"
      :jobs="jobs?.jobs || []"
      :states="[1, 2]"
    />
  </div>
  </div>

  <!-- TEMPORARY placeholder — replaced by <RecentBenchmarks> in Task 5 -->
  <div
    v-if="isOwner && benchmarksOpened"
    v-show="activeTab === 'benchmarks'"
    class="box mt-5"
  >
    <p>Benchmarks tab placeholder.</p>
  </div>
</template>
```

- [ ] **Step 4: Add the tab accent style**

Find (top of the scoped style block):

```html
<style scoped>
.heading {
  text-transform: uppercase;
```

Replace with:

```html
<style scoped>
.benchmark-tabs {
  margin-bottom: 0;
}
.benchmark-tabs li.is-active a {
  border-bottom-color: #10e80c;
  color: inherit;
}
html.dark-mode .benchmark-tabs a {
  color: #ffffff;
}

.heading {
  text-transform: uppercase;
```

- [ ] **Step 5: Verify in the browser**

Run `npm run dev` (background). Then:
1. Open `http://localhost:3000/<someNodeAddress>` **without** connecting the owning wallet → confirm **no tab bar** appears and the page looks exactly as before.
2. Connect the wallet that owns that node (so `isOwner` is true) → confirm a **tabs bar** appears with **Overview** (active, green underline) and **Benchmarks**.
3. Click **Benchmarks** → Overview content hides, the "Benchmarks tab placeholder." box shows. Click **Overview** → it returns; confirm the earnings charts did NOT reload/flicker (proves `v-show`, not `v-if`).

Expected: no Vite error overlay; tab toggling works; non-owners are unaffected.

- [ ] **Step 6: Commit**

```bash
git add app/pages/[id].vue
git commit -m "feat: add owner-only Benchmarks tab scaffold to node page"
```

---

## Task 2: Composable — types, helpers, signed fetch

**Files:**
- Create: `app/composables/useRecentBenchmarks.ts`

- [ ] **Step 1: Create the composable file**

Create `app/composables/useRecentBenchmarks.ts` with exactly this content:

```ts
import { createSignedWalletAuthHeader } from "~/utils/createSignedWalletAuthHeader";

// ---------------------------------------------------------------------------
// Response types — match the GET /benchmarks/recent contract exactly.
// ---------------------------------------------------------------------------

export interface FeedbackMetric {
  metricKey: string;
  measuredValue?: number | string | boolean | null | unknown[];
  ruleDescription: string;
  passed: boolean;
  failureMessage?: string;
  isOptional: boolean;
}

export interface FeedbackReport {
  marketAddress: string;
  marketName?: string;
  passed: boolean;
  metrics: FeedbackMetric[];
}

export interface BenchmarkRunMetric {
  metricKey: string;
  instance: string; // "" for non-instanced metrics, else e.g. "gpu:0"
  value: unknown; // jsonb: scalar or array
  isValid: boolean; // false once superseded by a newer run
  createdAt: string;
}

export interface AntiSpoof {
  gpuType: string;
  gpuUUID: string;
  verified: boolean;
  seedAt: string;
  predictedAt: string | null;
}

export interface BenchmarkRunOperation {
  operationId: number;
}

export interface BenchmarkRun {
  id: string;
  status: string; // "pending" | "submitted" | ...
  createdAt: string;
  submittedAt: string | null;
  rawResults: Record<string, unknown> | null;
  operations: BenchmarkRunOperation[];
  metrics: BenchmarkRunMetric[];
  antiSpoofs: AntiSpoof[];
}

export interface RecentBenchmarksResponse {
  feedbackReport: FeedbackReport | null;
  benchmarks: BenchmarkRun[];
}

// ---------------------------------------------------------------------------
// Pure display helpers (no Vue/Nuxt deps; verified visually).
// ---------------------------------------------------------------------------

/** Render a jsonb metric value (scalar | array | object | null) for display. */
export function formatMetricValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    return value.length ? value.map((v) => formatMetricValue(v)).join(", ") : "—";
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Pass/fail/optional counts for the feedback-report headline. */
export function feedbackCounts(report: FeedbackReport | null): {
  passed: number;
  failed: number;
  optional: number;
} {
  if (!report) return { passed: 0, failed: 0, optional: 0 };
  let passed = 0;
  let failed = 0;
  let optional = 0;
  for (const m of report.metrics) {
    if (m.isOptional) optional++;
    else if (m.passed) passed++;
    else failed++;
  }
  return { passed, failed, optional };
}

/** Short relative time like "2h ago", "25m ago", "just now". */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const sec = Math.max(0, Math.round((now - then) / 1000));
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

/** Absolute, locale-formatted timestamp for the tooltip/title attribute. */
export function absoluteTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

/** Truncate a long GPU UUID for compact display. */
export function shortUUID(uuid: string): string {
  if (!uuid) return "";
  return uuid.length <= 16 ? uuid : `${uuid.slice(0, 10)}…${uuid.slice(-4)}`;
}

/** seed→prediction latency in seconds, or null when not yet predicted. */
export function spoofLatencySeconds(
  seedAt: string,
  predictedAt: string | null
): number | null {
  if (!predictedAt) return null;
  const s = new Date(seedAt).getTime();
  const p = new Date(predictedAt).getTime();
  if (Number.isNaN(s) || Number.isNaN(p)) return null;
  return Math.max(0, (p - s) / 1000);
}

/** Compact anti-spoof summary for the collapsed run row. */
export function antiSpoofSummary(
  antiSpoofs: AntiSpoof[]
): { label: string; ok: boolean } | null {
  if (!antiSpoofs?.length) return null;
  const allVerified = antiSpoofs.every((a) => a.verified);
  const mark = allVerified ? "✓" : "✗";
  if (antiSpoofs.length === 1) {
    return { label: `${antiSpoofs[0].gpuType || "GPU"} ${mark}`, ok: allVerified };
  }
  return { label: `${antiSpoofs.length} GPUs ${mark}`, ok: allVerified };
}

// ---------------------------------------------------------------------------
// Composable — single SDK-signed fetch, owner-only.
// ---------------------------------------------------------------------------

interface UseRecentBenchmarksArgs {
  isOwner: Ref<boolean> | boolean;
  connected: Ref<boolean> | boolean;
  publicKey: Ref<any> | any;
  wallet: Ref<any> | any;
}

export function useRecentBenchmarks(args: UseRecentBenchmarksArgs) {
  const config = useRuntimeConfig().public;

  return useMyAsyncData(
    "recent-benchmarks",
    async (): Promise<RecentBenchmarksResponse | null> => {
      const isOwner = toValue(args.isOwner);
      const connected = toValue(args.connected);
      const publicKey = toValue(args.publicKey);
      const wallet = toValue(args.wallet);

      // Data can only be fetched with the node's own signature → owner-only.
      if (!isOwner || !connected || !publicKey || !wallet) {
        return null;
      }

      const authorization = await createSignedWalletAuthHeader({
        connected,
        publicKey,
        wallet,
        message: publicKey.toString(), // same signed message as the uptime-rewards call
      });

      return $fetch<RecentBenchmarksResponse>("/api/benchmarks/recent", {
        baseURL: config.apiBase as string,
        headers: {
          Accept: "application/json",
          Authorization: authorization,
        },
      });
    },
    {
      default: () => null,
      disableToastOnError: true, // surface errors inline, no global toast
    }
  );
}
```

- [ ] **Step 2: Verify the dev server still compiles**

With `npm run dev` running, confirm there is **no Vite/Nuxt error overlay** and no new errors in the terminal. (`Ref`, `toValue`, `useRuntimeConfig`, `useMyAsyncData`, and `$fetch` are Nuxt auto-imports available in `composables/`.) The composable is not yet imported anywhere, so this only confirms the file parses; it is exercised end-to-end in Task 5.

- [ ] **Step 3: Commit**

```bash
git add app/composables/useRecentBenchmarks.ts
git commit -m "feat: add useRecentBenchmarks composable, types and display helpers"
```

---

## Task 3: Feedback-report banner component

**Files:**
- Create: `app/components/Host/BenchmarkFeedbackReport.vue`

- [ ] **Step 1: Create the component**

Create `app/components/Host/BenchmarkFeedbackReport.vue` with exactly this content:

```vue
<template>
  <div class="fb-report" :class="report.passed ? 'is-pass' : 'is-fail'">
    <div class="fb-top">
      <span class="fb-pill" :class="report.passed ? 'pass' : 'fail'">
        {{ report.passed ? "Passed" : "Failed" }}
      </span>
      <strong>Current Feedback Report</strong>
      <span class="fb-market">· {{ report.marketName || shortAddress(report.marketAddress) }}</span>
      <span class="fb-counts">
        {{ counts.passed }} passed · {{ counts.failed }} failed<template v-if="counts.optional"> · {{ counts.optional }} optional</template>
      </span>
      <a class="fb-toggle" @click="expanded = !expanded">
        {{ expanded ? "▾ hide rules" : "▸ show rules" }}
      </a>
    </div>

    <div v-if="expanded" class="fb-rules">
      <div v-for="(m, i) in report.metrics" :key="m.metricKey + i" class="fb-rule">
        <span class="fb-icon" :class="ruleClass(m)">{{ ruleIcon(m) }}</span>
        <span class="fb-key">{{ m.metricKey }}</span>
        <span v-if="m.measuredValue !== undefined" class="fb-measured">
          = {{ formatMetricValue(m.measuredValue) }}
        </span>
        <span class="fb-desc">{{ m.ruleDescription }}</span>
        <span v-if="m.isOptional" class="fb-optional">optional</span>
        <span v-if="!m.passed && !m.isOptional && m.failureMessage" class="fb-fail-msg">
          — {{ m.failureMessage }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  feedbackCounts,
  formatMetricValue,
  type FeedbackReport,
  type FeedbackMetric,
} from "~/composables/useRecentBenchmarks";

const props = defineProps<{ report: FeedbackReport }>();

const expanded = ref(false);
const counts = computed(() => feedbackCounts(props.report));

function shortAddress(a: string): string {
  if (!a) return "";
  return a.length <= 12 ? a : `${a.slice(0, 4)}…${a.slice(-4)}`;
}
function ruleIcon(m: FeedbackMetric): string {
  if (m.isOptional) return "○";
  return m.passed ? "✓" : "✗";
}
function ruleClass(m: FeedbackMetric): string {
  if (m.isOptional) return "muted";
  return m.passed ? "ok" : "bad";
}
</script>

<style scoped>
.fb-report {
  border: 1px solid #e2e2e2;
  border-left: 4px solid #10e80c;
  border-radius: 6px;
  padding: 12px 14px;
  background: rgba(16, 232, 12, 0.06);
  margin-bottom: 16px;
}
.fb-report.is-fail {
  border-left-color: #f14668;
  background: rgba(241, 70, 104, 0.06);
}
.fb-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.9rem;
}
.fb-pill {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}
.fb-pill.pass {
  background: #10e80c;
  color: #04210a;
}
.fb-pill.fail {
  background: #f14668;
  color: #fff;
}
.fb-market {
  color: #7a7a7a;
}
.fb-counts {
  font-size: 0.8rem;
  color: #555;
}
.fb-toggle {
  margin-left: auto;
  font-size: 0.78rem;
  color: #3273dc;
  cursor: pointer;
}
.fb-rules {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(0, 0, 0, 0.12);
  font-size: 0.82rem;
}
.fb-rule {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.fb-icon {
  font-weight: 700;
}
.fb-icon.ok {
  color: #1f8b1d;
}
.fb-icon.bad {
  color: #f14668;
}
.fb-icon.muted {
  color: #8a8a8a;
}
.fb-key {
  font-weight: 600;
}
.fb-measured {
  color: #555;
}
.fb-desc {
  color: #7a7a7a;
  font-size: 0.76rem;
}
.fb-optional {
  font-size: 0.66rem;
  text-transform: uppercase;
  color: #8a8a8a;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0 5px;
}
.fb-fail-msg {
  color: #f14668;
  font-size: 0.76rem;
}
html.dark-mode .fb-report {
  border-color: #444;
}
html.dark-mode .fb-counts,
html.dark-mode .fb-measured {
  color: #cfcfcf;
}
html.dark-mode .fb-market,
html.dark-mode .fb-desc {
  color: #b0b0b0;
}
</style>
```

- [ ] **Step 2: Verify the dev server still compiles**

With `npm run dev` running, confirm no Vite error overlay/terminal errors. The component is exercised visually in Task 5/6.

- [ ] **Step 3: Commit**

```bash
git add app/components/Host/BenchmarkFeedbackReport.vue
git commit -m "feat: add BenchmarkFeedbackReport banner component"
```

---

## Task 4: Run accordion item component

**Files:**
- Create: `app/components/Host/BenchmarkRunItem.vue`

- [ ] **Step 1: Create the component**

Create `app/components/Host/BenchmarkRunItem.vue` with exactly this content:

```vue
<template>
  <div class="run">
    <div class="run-row" :class="{ open: expanded, clickable: hasDetail }" @click="toggle">
      <span class="run-pill" :class="pillClass">{{ statusLabel }}</span>
      <span class="run-time" :title="absoluteTime(run.createdAt)">{{ relativeTime(run.createdAt) }}</span>

      <span v-if="spoof" class="run-badge" :class="{ ok: spoof.ok, bad: !spoof.ok }">{{ spoof.label }}</span>
      <span v-if="validMetricCount" class="run-badge">{{ validMetricCount }} metrics</span>
      <span v-if="run.operations?.length" class="run-badge">
        {{ run.operations.length }} op{{ run.operations.length === 1 ? "" : "s" }}
      </span>

      <span class="run-sp"></span>
      <span v-if="hasDetail" class="run-chev">{{ expanded ? "▾" : "▸" }}</span>
      <span v-else class="run-muted">no results yet…</span>
    </div>

    <div v-if="expanded && hasDetail" class="run-det">
      <template v-if="run.metrics.length">
        <div class="det-head">Metrics</div>
        <div class="det-kv">
          <template v-for="(m, i) in run.metrics" :key="m.metricKey + m.instance + i">
            <span :class="{ superseded: !m.isValid }">
              {{ m.metricKey }}<template v-if="m.instance"> · {{ m.instance }}</template>
            </span>
            <span :class="{ superseded: !m.isValid }">
              {{ formatMetricValue(m.value) }}<template v-if="!m.isValid"> (superseded)</template>
            </span>
          </template>
        </div>
      </template>

      <template v-if="run.antiSpoofs.length">
        <div class="det-head">Anti-spoof</div>
        <div class="det-kv">
          <template v-for="(a, i) in run.antiSpoofs" :key="a.gpuUUID + i">
            <span>{{ a.gpuType }} · {{ shortUUID(a.gpuUUID) }}</span>
            <span :class="a.verified ? 'ok' : 'bad'">{{ spoofText(a) }}</span>
          </template>
        </div>
      </template>

      <template v-if="run.rawResults">
        <div class="det-head">Raw output</div>
        <a class="raw-toggle" @click="showRaw = !showRaw">
          {{ showRaw ? "▾ hide raw JSON" : "▸ view raw JSON" }}
        </a>
        <pre v-if="showRaw" class="run-raw">{{ rawJson }}</pre>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  relativeTime,
  absoluteTime,
  formatMetricValue,
  shortUUID,
  antiSpoofSummary,
  spoofLatencySeconds,
  type BenchmarkRun,
  type AntiSpoof,
} from "~/composables/useRecentBenchmarks";

const props = defineProps<{ run: BenchmarkRun }>();

const expanded = ref(false);
const showRaw = ref(false);

const hasDetail = computed(
  () =>
    props.run.metrics.length > 0 ||
    props.run.antiSpoofs.length > 0 ||
    props.run.rawResults != null
);

const validMetricCount = computed(() => props.run.metrics.filter((m) => m.isValid).length);
const spoof = computed(() => antiSpoofSummary(props.run.antiSpoofs));

const statusLabel = computed(() => {
  const s = props.run.status || "";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown";
});
const pillClass = computed(() => {
  const s = (props.run.status || "").toLowerCase();
  if (s === "submitted") return "sub";
  if (s === "pending") return "pend";
  return "other";
});

const rawJson = computed(() => {
  try {
    return JSON.stringify(props.run.rawResults, null, 2);
  } catch {
    return "Unable to render raw output.";
  }
});

function spoofText(a: AntiSpoof): string {
  const base = a.verified ? "✓ verified" : "✗ not verified";
  const lat = spoofLatencySeconds(a.seedAt, a.predictedAt);
  return lat === null ? base : `${base} · seed→pred ${lat.toFixed(1)}s`;
}

function toggle() {
  if (hasDetail.value) expanded.value = !expanded.value;
}
</script>

<style scoped>
.run {
  margin-bottom: 8px;
}
.run-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e2e2e2;
  border-radius: 6px;
  font-size: 0.82rem;
  background: #fff;
}
.run-row.clickable {
  cursor: pointer;
}
.run-row.open {
  border-radius: 6px 6px 0 0;
}
.run-pill {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}
.run-pill.sub {
  background: #3273dc;
  color: #fff;
}
.run-pill.pend {
  background: #ffb020;
  color: #3a2700;
}
.run-pill.other {
  background: #b5b5b5;
  color: #fff;
}
.run-time {
  font-weight: 600;
}
.run-badge {
  font-size: 0.68rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1px 7px;
  color: #666;
}
.run-badge.ok {
  border-color: #bfe6bf;
  background: #f1fbf1;
  color: #1f8b1d;
}
.run-badge.bad {
  border-color: #f3c0cb;
  background: #fdf1f4;
  color: #f14668;
}
.run-sp {
  flex: 1;
}
.run-chev {
  color: #aaa;
}
.run-muted {
  color: #8a8a8a;
}
.run-det {
  border: 1px solid #e2e2e2;
  border-top: none;
  border-radius: 0 0 6px 6px;
  background: #fafafa;
  padding: 12px 14px;
  font-size: 0.78rem;
}
.det-head {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.62rem;
  color: #999;
  margin: 10px 0 4px;
}
.det-head:first-child {
  margin-top: 0;
}
.det-kv {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3px 16px;
  max-width: 560px;
}
.det-kv .ok {
  color: #1f8b1d;
}
.det-kv .bad {
  color: #f14668;
}
.superseded {
  color: #bbb;
  text-decoration: line-through;
}
.raw-toggle {
  font-size: 0.68rem;
  color: #3273dc;
  cursor: pointer;
}
.run-raw {
  font-family: ui-monospace, Menlo, monospace;
  font-size: 0.7rem;
  background: #0d1117;
  color: #8ae234;
  border-radius: 4px;
  padding: 10px;
  overflow: auto;
  margin-top: 6px;
  max-height: 320px;
}
html.dark-mode .run-row {
  background: #1f1f1f;
  border-color: #444;
}
html.dark-mode .run-det {
  background: #181818;
  border-color: #444;
}
html.dark-mode .run-badge {
  color: #cfcfcf;
  border-color: #555;
}
</style>
```

- [ ] **Step 2: Verify the dev server still compiles**

With `npm run dev` running, confirm no Vite error overlay/terminal errors. Exercised visually in Task 5/6.

- [ ] **Step 3: Commit**

```bash
git add app/components/Host/BenchmarkRunItem.vue
git commit -m "feat: add BenchmarkRunItem accordion component"
```

---

## Task 5: Container + wire into the page

**Files:**
- Create: `app/components/Host/RecentBenchmarks.vue`
- Modify: `app/pages/[id].vue` (import + replace the Task 1 placeholder)

- [ ] **Step 1: Create the container component**

Create `app/components/Host/RecentBenchmarks.vue` with exactly this content:

```vue
<template>
  <div class="box mt-5">
    <h3 class="title is-5 mb-4">
      Recent Benchmarks
      <span class="has-text-grey is-size-6 has-text-weight-normal">· last 24h</span>
    </h3>

    <progress v-if="pending" class="progress is-small is-info" max="100"></progress>

    <div v-else-if="error" class="notification is-warning">
      Couldn't load recent benchmarks. Please try again.
    </div>

    <template v-else>
      <BenchmarkFeedbackReport v-if="report" :report="report" />
      <div v-else class="notification is-light mb-4">
        No current feedback report for this node yet.
      </div>

      <p class="runs-heading">Runs · newest first</p>

      <div v-if="!runs.length" class="notification is-light">
        No benchmark runs in the last 24 hours.
      </div>

      <BenchmarkRunItem v-for="run in runs" :key="run.id" :run="run" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BenchmarkFeedbackReport from "~/components/Host/BenchmarkFeedbackReport.vue";
import BenchmarkRunItem from "~/components/Host/BenchmarkRunItem.vue";
import {
  useRecentBenchmarks,
  type RecentBenchmarksResponse,
  type FeedbackReport,
  type BenchmarkRun,
} from "~/composables/useRecentBenchmarks";

const props = defineProps<{
  nodeAddress: string;
  isOwner: boolean;
  connected: boolean;
  publicKey: any;
  wallet: any;
}>();

const { data, pending, error } = useRecentBenchmarks({
  isOwner: computed(() => props.isOwner),
  connected: computed(() => props.connected),
  publicKey: computed(() => props.publicKey),
  wallet: computed(() => props.wallet),
});

const report = computed<FeedbackReport | null>(
  () => (data.value as RecentBenchmarksResponse | null)?.feedbackReport ?? null
);
const runs = computed<BenchmarkRun[]>(
  () => (data.value as RecentBenchmarksResponse | null)?.benchmarks ?? []
);
</script>

<style scoped>
.runs-heading {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.62rem;
  color: #999;
  margin: 4px 0 10px;
}
</style>
```

- [ ] **Step 2: Import the container in `[id].vue`**

Find:

```ts
import HostQuickDetails from "~/components/Host/HostQuickDetails.vue";
import { createSignedWalletAuthHeader } from "~/utils/createSignedWalletAuthHeader";
```

Replace with:

```ts
import HostQuickDetails from "~/components/Host/HostQuickDetails.vue";
import RecentBenchmarks from "~/components/Host/RecentBenchmarks.vue";
import { createSignedWalletAuthHeader } from "~/utils/createSignedWalletAuthHeader";
```

- [ ] **Step 3: Replace the Task 1 placeholder with the real component**

Find:

```html
  <!-- TEMPORARY placeholder — replaced by <RecentBenchmarks> in Task 5 -->
  <div
    v-if="isOwner && benchmarksOpened"
    v-show="activeTab === 'benchmarks'"
    class="box mt-5"
  >
    <p>Benchmarks tab placeholder.</p>
  </div>
```

Replace with:

```html
  <RecentBenchmarks
    v-if="isOwner && benchmarksOpened"
    v-show="activeTab === 'benchmarks'"
    :node-address="nodeAddress"
    :is-owner="isOwner"
    :connected="connected"
    :public-key="publicKey"
    :wallet="wallet"
  />
```

- [ ] **Step 4: Verify in the browser (real fetch path)**

With `npm run dev` running, open your owned node page, connect the owning wallet, click **Benchmarks**. Expect a wallet signature prompt (once), then one of:
- runs + feedback report render, OR
- the empty state ("No benchmark runs in the last 24 hours.") / "No current feedback report" if the backend returns none, OR
- the warning notification if the request fails.

Confirm there is no Vite error overlay and the page does not crash. (The full visual sweep of every state is Task 6.)

- [ ] **Step 5: Commit**

```bash
git add app/components/Host/RecentBenchmarks.vue app/pages/[id].vue
git commit -m "feat: render RecentBenchmarks in the node page Benchmarks tab"
```

---

## Task 6: Full state verification with a temporary fixture, then final polish

This exercises every UI state without needing live backend data, then reverts the fixture so no test code ships.

**Files:**
- Temporarily modify, then revert: `app/components/Host/RecentBenchmarks.vue`

- [ ] **Step 1: Temporarily swap the composable call for a fixture**

In `app/components/Host/RecentBenchmarks.vue`, find:

```ts
const { data, pending, error } = useRecentBenchmarks({
  isOwner: computed(() => props.isOwner),
  connected: computed(() => props.connected),
  publicKey: computed(() => props.publicKey),
  wallet: computed(() => props.wallet),
});
```

Replace with (TEMPORARY — reverted in Step 4):

```ts
// TEMP FIXTURE — remove before commit (Task 6 Step 4)
const pending = ref(false);
const error = ref<unknown>(null);
const data = ref<RecentBenchmarksResponse | null>({
  feedbackReport: {
    marketAddress: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    marketName: "NVIDIA-3090",
    passed: false,
    metrics: [
      { metricKey: "tokens_per_second", measuredValue: 42.5, ruleDescription: "≥ 30 required", passed: true, isOptional: false },
      { metricKey: "gpu_count", measuredValue: 1, ruleDescription: "== 1 required", passed: true, isOptional: false },
      { metricKey: "disk_free_gb", measuredValue: 80, ruleDescription: "≥ 100 required", passed: false, failureMessage: "Insufficient free disk space", isOptional: false },
      { metricKey: "upload_mbps", measuredValue: 47, ruleDescription: "≥ 50 (optional)", passed: false, isOptional: true },
    ],
  },
  benchmarks: [
    {
      id: "run-1",
      status: "submitted",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      rawResults: { tokens_per_second: 42.5, gpu: [{ temp_c: 61, watt: 310 }] },
      operations: [{ operationId: 1 }],
      metrics: [
        { metricKey: "tokens_per_second", instance: "", value: 42.5, isValid: true, createdAt: new Date().toISOString() },
        { metricKey: "temperature", instance: "gpu:0", value: 61, isValid: true, createdAt: new Date().toISOString() },
        { metricKey: "latencies", instance: "gpu:0", value: [12, 13, 11], isValid: true, createdAt: new Date().toISOString() },
        { metricKey: "download_mb", instance: "", value: 920, isValid: false, createdAt: new Date().toISOString() },
      ],
      antiSpoofs: [
        { gpuType: "NVIDIA RTX 4090", gpuUUID: "GPU-a1b2c3d4e5f6", verified: true, seedAt: new Date(Date.now() - 5000).toISOString(), predictedAt: new Date(Date.now() - 3800).toISOString() },
      ],
    },
    {
      id: "run-2",
      status: "submitted",
      createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      rawResults: { tokens_per_second: 40.1 },
      operations: [{ operationId: 1 }],
      metrics: [
        { metricKey: "tokens_per_second", instance: "", value: 40.1, isValid: true, createdAt: new Date().toISOString() },
      ],
      antiSpoofs: [
        { gpuType: "NVIDIA RTX 4090", gpuUUID: "GPU-zzz999", verified: false, seedAt: new Date().toISOString(), predictedAt: null },
      ],
    },
    {
      id: "run-3",
      status: "pending",
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      submittedAt: null,
      rawResults: null,
      operations: [{ operationId: 1 }],
      metrics: [],
      antiSpoofs: [],
    },
  ],
});
```

Also add `ref` to the existing Vue import in this file. Find:

```ts
import { computed } from "vue";
```

Replace with:

```ts
import { computed, ref } from "vue";
```

- [ ] **Step 2: Verify every state in the browser**

With `npm run dev` running, open the Benchmarks tab on an owned node. Verify against this checklist:

1. **Feedback banner (fail)**: red left-border + "Failed" pill, market name "NVIDIA-3090", counts "2 passed · 1 failed · 1 optional". Click "show rules" → 4 rules with ✓/✗/○ icons; the disk rule shows the failure message; the optional rule shows the "optional" chip.
2. **Pass styling**: temporarily set the fixture `feedbackReport.passed` to `true` → green left-border + "Passed" pill. Revert it back to `false`.
3. **Run 1 (submitted, expandable)**: blue "Submitted" pill, "2h ago", "NVIDIA RTX 4090 ✓" green badge, "3 metrics" badge (the superseded one is excluded from the count), "1 op". Expand → metrics list incl. `temperature · gpu:0 = 61`, `latencies · gpu:0 = 12, 13, 11` (array joined), and `download_mb 920 (superseded)` shown dimmed + struck-through. Anti-spoof shows "✓ verified · seed→pred 1.2s". "view raw JSON" expands a dark JSON block.
4. **Run 2**: anti-spoof badge red "NVIDIA RTX 4090 ✗"; expanded anti-spoof shows "✗ not verified" with no latency.
5. **Run 3 (pending)**: yellow "Pending" pill, "25m ago", "no results yet…", not expandable.
6. **Empty state**: temporarily set `benchmarks: []` → "No benchmark runs in the last 24 hours." Revert.
7. **No feedback report**: temporarily set `feedbackReport: null` → "No current feedback report for this node yet." Revert.
8. **Dark mode**: toggle dark mode → banner, rows, and detail panels remain readable.

Fix any rendering issues in the components (Tasks 3-5) before continuing.

- [ ] **Step 3: Verify loading and error states**

- **Loading**: temporarily set `pending` to `ref(true)` → progress bar shows. Revert to `ref(false)`.
- **Error**: temporarily set `error` to `ref(new Error("boom"))` → yellow warning notification shows. Revert to `ref<unknown>(null)`.

- [ ] **Step 4: Revert the fixture**

Restore `app/components/Host/RecentBenchmarks.vue` to its committed form (undo Steps 1 & 3): the `<script setup>` must again use the real composable call and `import { computed } from "vue";`. Confirm with:

```bash
git diff app/components/Host/RecentBenchmarks.vue
```

Expected: **no diff** (file matches the Task 5 commit). If there is a diff, remove the fixture/temporary edits until the diff is empty.

- [ ] **Step 5: Final smoke test**

With `npm run dev` running and the fixture removed:
1. Non-owner view → no Benchmarks tab; page unchanged.
2. Owner view → Benchmarks tab present; clicking it triggers one signature prompt and renders real data (or the empty/error state).
3. No Vite error overlay; no console errors.

- [ ] **Step 6: Confirm no stray changes and finish**

```bash
git status --short
```

Expected: clean working tree for `app/` (only the pre-existing `.env*`/`package.json` modifications remain, untouched). Nothing else to commit for this task — the feature was committed across Tasks 1-5.

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Owner-only placement + in-page tab toggle → Task 1 (tab scaffold), Task 5 (mount).
- Fetch-once-on-open, signed like uptime-rewards → Task 2 (composable, no `watch`, mounts once via `benchmarksOpened`).
- Summary→expand feedback banner with counts/rules/failure message/optional → Task 3.
- Accordion runs: status pill, relative+absolute time, anti-spoof badge, metric/op counts; expanded metrics (dimmed superseded), anti-spoof (truncated UUID, verified, seed→pred timing), collapsible raw JSON → Task 4.
- jsonb value rendering (scalar/array) → `formatMetricValue` (Task 2), verified Task 6 Step 2.3.
- States: loading / error / empty / `feedbackReport` null / pending run / superseded metric → container Task 5 + verified Task 6 Steps 2-3.
- Non-owner unaffected → Task 1 Step 5, Task 6 Step 5.
- Manual verification only, no test framework → all verification via dev server + browser + fixture.

**Placeholder scan:** No "TBD"/"handle edge cases"/uncoded steps; every code step contains complete file content. The only intentional placeholder is the Task 1 temporary box, explicitly replaced in Task 5; and the Task 6 fixture, explicitly reverted in Task 6 Step 4.

**Type consistency:** `RecentBenchmarksResponse`, `FeedbackReport`, `FeedbackMetric`, `BenchmarkRun`, `BenchmarkRunMetric`, `AntiSpoof`, and helpers (`formatMetricValue`, `feedbackCounts`, `relativeTime`, `absoluteTime`, `shortUUID`, `spoofLatencySeconds`, `antiSpoofSummary`) are defined once in Task 2 and referenced with identical names/signatures in Tasks 3-6. `useRecentBenchmarks` args (`isOwner`, `connected`, `publicKey`, `wallet`) match the container's call in Task 5.
