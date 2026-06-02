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
