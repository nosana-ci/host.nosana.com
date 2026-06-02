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
html.dark-mode .fb-report strong {
  color: #ffffff;
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
