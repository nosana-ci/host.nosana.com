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
