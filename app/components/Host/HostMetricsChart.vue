<template>
  <div class="box">
    <h3 class="title is-5 mb-4">{{ title }}</h3>
    <div class="filters mb-4">
      <div class="field">
        <label class="label">Metric</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="selectedMetric" @change="hasUserSelectedMetric = true">
              <option
                v-for="metric in metricOptions"
                :key="metric.value"
                :value="metric.value"
              >
                {{ metric.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-wrapper" :class="{ 'has-chart': hasRenderableData }">
      <div v-if="loading" class="has-text-centered">
        <progress class="progress is-small is-info" max="100"></progress>
        <p>Loading benchmark data...</p>
      </div>
      <div v-else-if="error" class="notification is-warning">
        {{ error }}
      </div>
      <div v-else-if="!hasRenderableData" class="notification">
        No benchmark data available for this host
      </div>
      <Bar
        v-else
        :data="chartData"
        :options="chartOptions"
        :plugins="chartPlugins"
        :height="300"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "vue-chartjs";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  nodeId: {
    type: String,
    required: true,
  },
  marketAddress: {
    type: String,
    default: null,
  },
  defaultMetric: {
    type: String,
    default: 'tokensPerSecond',
  },
});

const config = useRuntimeConfig();

interface MarketMetricAggregatesResponse {
  aggregate: 'average' | 'min' | 'max' | 'median';
  markets: Array<{
    marketAddress: string;
    metrics: Record<string, number>;
  }>;
  node?: {
    nodeId: string;
    metrics: Record<string, number>;
  };
}

type ComparisonMode = 'template' | 'scalar' | 'all';

interface ComparableChartItem {
  id: string;
  label: string;
  node: number | null;
  market: number | null;
  metricGroupLabel: string;
  unitLabel: string | null;
}

interface MetricOption {
  value: string;
  label: string;
  metricKeys: string[];
  comparisonMode: ComparisonMode;
  metricLabels?: Record<string, string>;
  order: number;
  unitLabel?: string | null;
}

interface MetricGrouping {
  optionId: string;
  label: string;
  comparisonMode: ComparisonMode;
  order: number;
  metricLabel: string;
  unitLabel: string | null;
}

interface MarketSummary {
  address: string;
  name?: string;
}

const ALL_METRICS_OPTION: MetricOption = {
  value: 'all',
  label: 'All Metrics',
  metricKeys: [],
  comparisonMode: 'all',
  order: -1,
  unitLabel: null,
};

const normalizeMetricValue = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();

const prettifyTemplateId = (templateId: string) => {
  return templateId
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const prettifyMetricKey = (metricKey: string) => {
  return metricKey
    .split('_')
    .filter(Boolean)
    .map((part) => {
      if (part === 'mb') return 'MB';
      if (part === 'mbps') return 'Mbps';
      if (part === 'gpu') return 'GPU';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
};

const metricSuffixToCanonicalName: Array<[string, string]> = [
  ['users_1_tokens_per_second_mean', 'tokens_per_second'],
  ['tokens_per_second', 'tokens_per_second'],
  ['users_1_gpu_wattage_avg', 'gpu_wattage_avg'],
  ['gpu_wattage_avg', 'gpu_wattage_avg'],
  ['users_1_gpu_temperature_avg', 'gpu_temperature_avg'],
  ['gpu_temperature_avg', 'gpu_temperature_avg'],
  ['download_speed_mbps', 'download_speed_mbps'],
  ['upload_speed_mbps', 'upload_speed_mbps'],
  ['download_speed_mb', 'download_speed_mb'],
  ['upload_speed_mb', 'upload_speed_mb'],
];

const metricGroupConfig: Record<
  string,
  {
    label: string;
    groupId?: string;
    comparisonMode: ComparisonMode;
    order: number;
    metricLabel?: string;
    unitLabel?: string;
  }
> = {
  tokens_per_second: {
    label: 'Tokens / Second',
    comparisonMode: 'template',
    order: 0,
    unitLabel: 'tokens/s',
  },
  gpu_temperature_avg: {
    label: 'GPU Temperature',
    comparisonMode: 'scalar',
    order: 10,
    metricLabel: 'GPU Temperature',
    unitLabel: '°C',
  },
  gpu_wattage_avg: {
    label: 'GPU Power Usage',
    comparisonMode: 'scalar',
    order: 20,
    metricLabel: 'GPU Power Usage',
    unitLabel: 'W',
  },
  download_speed_mb: {
    label: 'Download Speed',
    comparisonMode: 'scalar',
    order: 30,
    metricLabel: 'Download Speed',
    unitLabel: 'MB/s',
  },
  upload_speed_mb: {
    label: 'Upload Speed',
    comparisonMode: 'scalar',
    order: 30,
    metricLabel: 'Upload Speed',
    unitLabel: 'MB/s',
  },
  download_speed_mbps: {
    label: 'Download Speed',
    comparisonMode: 'scalar',
    order: 31,
    metricLabel: 'Download Speed',
    unitLabel: 'Mbps',
  },
  upload_speed_mbps: {
    label: 'Upload Speed',
    comparisonMode: 'scalar',
    order: 31,
    metricLabel: 'Upload Speed',
    unitLabel: 'Mbps',
  },
};

const defaultMetricValue = normalizeMetricValue(props.defaultMetric);
const selectedMetric = ref(defaultMetricValue);
const hasUserSelectedMetric = ref(false);

const apiUrl = computed(() => {
  const params = new URLSearchParams({
    nodeId: props.nodeId,
  });

  return `/api/benchmarks/market-metric-aggregates?${params.toString()}`;
});

const { data: aggregateData, pending: loading, error: fetchError } = useAPI(
  apiUrl,
  {
    watch: [apiUrl],
  }
);

const { data: marketSummaries } = useMyAsyncData(
  `template-performance-markets-${props.nodeId}`,
  async () =>
    await $fetch<MarketSummary[]>('/api/markets', {
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
      },
    }),
  {
    default: () => [],
  }
);

const ensureArray = <T>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

const getCanonicalMetricName = (metricKey: string) => {
  for (const [suffix, canonicalName] of metricSuffixToCanonicalName) {
    if (
      metricKey === suffix ||
      metricKey.endsWith(`.${suffix}`) ||
      metricKey.endsWith(`_${suffix}`)
    ) {
      return canonicalName;
    }
  }

  return metricKey;
};

const inferMetricGrouping = (metricName: string): MetricGrouping => {
  const config = metricGroupConfig[metricName];
  if (config) {
    return {
      optionId: config.groupId ?? metricName,
      label: config.label,
      comparisonMode: config.comparisonMode,
      order: config.order,
      metricLabel: config.metricLabel ?? prettifyMetricKey(metricName),
      unitLabel: config.unitLabel ?? null,
    };
  }

  if (metricName === 'tokens_per_second') {
    return {
      optionId: 'tokens_per_second',
      label: 'Tokens / Second',
      comparisonMode: 'template',
      order: 0,
      metricLabel: 'Tokens / Second',
      unitLabel: 'tokens/s',
    };
  }

  return {
    optionId: metricName,
    label: prettifyMetricKey(metricName),
    comparisonMode: 'scalar',
    order: 100,
    metricLabel: prettifyMetricKey(metricName),
    unitLabel: null,
  };
};

const resolveTemplateName = (templateId: string) => {
  return prettifyTemplateId(templateId);
};

const extractMetricTemplateId = (metricKey: string) => {
  for (const [suffix] of metricSuffixToCanonicalName) {
    if (metricKey.endsWith(`.${suffix}`)) {
      return metricKey.slice(0, -(suffix.length + 1));
    }

    if (metricKey.endsWith(`_${suffix}`)) {
      return metricKey.slice(0, -(suffix.length + 1));
    }
  }

  const lastDot = metricKey.lastIndexOf('.');
  return lastDot > 0 ? metricKey.substring(0, lastDot) : metricKey;
};

const extractMetricShortName = (metricKey: string) => {
  return getCanonicalMetricName(metricKey);
};

const aggregatePayload = computed<MarketMetricAggregatesResponse | null | undefined>(
  () => aggregateData.value as MarketMetricAggregatesResponse | null | undefined
);

const getCurrentMarketAggregate = (payload: MarketMetricAggregatesResponse | null | undefined) => {
  if (!payload?.markets?.length) {
    return null;
  }

  if (props.marketAddress) {
    // The fetched payload can lag behind props.marketAddress while a new
    // fetch triggered by a marketAddress change is still in flight (see
    // apiUrl/useAPI below). Falling back to markets[0] in that window
    // would silently compare against an unrelated market, so treat a
    // missing match as "no data yet" instead.
    return payload.markets.find((market) => market.marketAddress === props.marketAddress) ?? null;
  }

  return payload.markets[0];
};

const currentMarketAggregate = computed(() => getCurrentMarketAggregate(aggregatePayload.value));

const getReturnedMetricNames = (payload: MarketMetricAggregatesResponse | null | undefined) => {
  const currentMarket = getCurrentMarketAggregate(payload);
  const nodeMetrics = Object.keys(payload?.node?.metrics ?? {});
  const marketMetrics = Object.keys(currentMarket?.metrics ?? {});

  return [
    ...new Set([...nodeMetrics, ...marketMetrics].map((metricKey) => extractMetricShortName(metricKey))),
  ].filter((metricName) => metricName !== 'index');
};

const metricOptions = computed<MetricOption[]>(() => {
  const metricNames = getReturnedMetricNames(aggregatePayload.value);
  const optionMap = new Map<string, MetricOption>();

  for (const metricName of metricNames) {
    const grouping = inferMetricGrouping(metricName);
    const existing = optionMap.get(grouping.optionId);

    if (existing) {
      if (!existing.metricKeys.includes(metricName)) {
        existing.metricKeys.push(metricName);
      }
      existing.metricLabels = {
        ...(existing.metricLabels ?? {}),
        [metricName]: grouping.metricLabel,
      };
      continue;
    }

    optionMap.set(grouping.optionId, {
      value: grouping.optionId,
      label: grouping.label,
      metricKeys: [metricName],
      comparisonMode: grouping.comparisonMode,
      metricLabels: {
        [metricName]: grouping.metricLabel,
      },
      order: grouping.order,
      unitLabel: grouping.unitLabel,
    });
  }

  const options = Array.from(optionMap.values()).sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.label.localeCompare(right.label);
  });

  if (options.length > 1) {
    options.unshift(ALL_METRICS_OPTION);
  }

  return options;
});

const selectedMetricOption = computed(
  () => metricOptions.value.find((metric) => metric.value === selectedMetric.value) ?? null
);

const preferredMetricOption = computed(() => {
  if (metricOptions.value.length === 0) {
    return null;
  }

  return (
    metricOptions.value.find((metric) => metric.value === 'all') ??
    metricOptions.value.find((metric) => metric.metricKeys.includes('tokens_per_second')) ??
    metricOptions.value.find((metric) => metric.value === defaultMetricValue) ??
    metricOptions.value[0]
  );
});

watch(
  [metricOptions, preferredMetricOption],
  ([options, preferredOption]) => {
    if (!options.length || !preferredOption) {
      return;
    }

    const hasCurrentOption = options.some((metric) => metric.value === selectedMetric.value);

    if (!hasUserSelectedMetric.value && (!hasCurrentOption || selectedMetric.value !== preferredOption.value)) {
      selectedMetric.value = preferredOption.value;
    }
  },
  { immediate: true }
);

const roundMetricValue = (value: number) => Math.round(value * 100) / 100;

const getExactMetricValue = (metrics: Record<string, number>, metricKey: string) => {
  const exactValue = metrics[metricKey];
  if (typeof exactValue === 'number') {
    return exactValue;
  }

  const canonicalMetricName = getCanonicalMetricName(metricKey);
  const matchingEntry = Object.entries(metrics).find(
    ([candidateKey, candidateValue]) =>
      getCanonicalMetricName(candidateKey) === canonicalMetricName && typeof candidateValue === 'number'
  );

  return matchingEntry ? matchingEntry[1] : null;
};

const getFallbackAverageMetricValue = (metrics: Record<string, number>, metricKey: string) => {
  const values = Object.entries(metrics)
    .filter(([key, value]) => key.includes('.') && extractMetricShortName(key) === metricKey && typeof value === 'number')
    .map(([, value]) => value);

  if (values.length === 0) {
    return null;
  }

  return roundMetricValue(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const getScalarMetricValue = (metrics: Record<string, number>, metricKey: string) => {
  const exact = getExactMetricValue(metrics, metricKey);
  if (exact !== null) {
    return exact;
  }

  return getFallbackAverageMetricValue(metrics, metricKey);
};

const buildTemplateComparisonItems = (
  payload: MarketMetricAggregatesResponse | null | undefined,
  option: MetricOption,
): ComparableChartItem[] => {
  const metricKey = option.metricKeys[0];
  const currentMarket = getCurrentMarketAggregate(payload);
  const resolvedNodeMetrics = payload?.node?.metrics ?? {};
  const marketMetrics = currentMarket?.metrics ?? {};
  const templateMap = new Map<string, ComparableChartItem>();

  const assignMetricValue = (
    sourceMetrics: Record<string, number>,
    source: 'node' | 'market'
  ) => {
    for (const [rawMetricKey, value] of Object.entries(sourceMetrics)) {
      if (extractMetricShortName(rawMetricKey) !== metricKey) {
        continue;
      }

      const templateId = extractMetricTemplateId(rawMetricKey);
      if (!templateId || templateId === rawMetricKey) {
        continue;
      }

      const existing = templateMap.get(templateId) ?? {
        id: templateId,
        label: resolveTemplateName(templateId),
        node: null,
        market: null,
        metricGroupLabel: option.label,
        unitLabel: option.unitLabel ?? null,
      };

      existing[source] = value;
      templateMap.set(templateId, existing);
    }
  };

  assignMetricValue(resolvedNodeMetrics, 'node');
  assignMetricValue(marketMetrics, 'market');

  return Array.from(templateMap.values())
    .filter((item) => item.node !== null || item.market !== null)
    .sort((left, right) => left.label.localeCompare(right.label));
};

const buildScalarComparisonItems = (
  payload: MarketMetricAggregatesResponse | null | undefined,
  option: MetricOption,
): ComparableChartItem[] => {
  const currentMarket = getCurrentMarketAggregate(payload);
  const resolvedNodeMetrics = payload?.node?.metrics ?? {};
  const marketMetrics = currentMarket?.metrics ?? {};

  return option.metricKeys
    .map((metricKey) => ({
      id: metricKey,
      label: option.metricLabels?.[metricKey] ?? prettifyMetricKey(metricKey),
      node: getScalarMetricValue(resolvedNodeMetrics, metricKey),
      market: getScalarMetricValue(marketMetrics, metricKey),
      metricGroupLabel: option.label,
      unitLabel: option.unitLabel ?? null,
    }))
    .filter((item) => item.node !== null || item.market !== null);
};

const buildItemsForOption = (
  payload: MarketMetricAggregatesResponse | null | undefined,
  option: MetricOption,
) => {
  if (option.comparisonMode === 'template') {
    return buildTemplateComparisonItems(payload, option);
  }

  if (option.comparisonMode === 'scalar') {
    return buildScalarComparisonItems(payload, option);
  }

  return [];
};

const currentMarketLabel = computed(() => {
  return currentMarketAggregate.value?.marketAddress ?? null;
});

const currentMarketName = computed(() => {
  const address = currentMarketLabel.value;
  if (!address) {
    return null;
  }

  const market = ensureArray<MarketSummary>(marketSummaries.value).find(
    (entry) => String(entry.address).trim() === address
  );
  return market?.name || address;
});

const chartItems = computed<ComparableChartItem[]>(() => {
  const payload = aggregatePayload.value;
  const option = selectedMetricOption.value;

  if (!option) {
    return [];
  }

  if (option.comparisonMode === 'all') {
    return metricOptions.value
      .filter((metricOption) => metricOption.comparisonMode !== 'all')
      .flatMap((metricOption) => buildItemsForOption(payload, metricOption))
      .filter((item) => item.market !== null);
  }

  return buildItemsForOption(payload, option);
});

const isAllMetricsView = computed(() => selectedMetricOption.value?.comparisonMode === 'all');

const getChartAxisLabel = (item: ComparableChartItem) => {
  if (isAllMetricsView.value) {
    if (item.metricGroupLabel === 'Tokens / Second') {
      return item.label;
    }

    return item.metricGroupLabel || item.label;
  }

  return item.label;
};

const getTooltipTitle = (item: ComparableChartItem) => {
  if (!isAllMetricsView.value) {
    return item.label;
  }

  return item.metricGroupLabel === item.label
    ? item.label
    : `${item.metricGroupLabel}: ${item.label}`;
};

const error = computed(() => {
  if (fetchError.value) {
    return 'Failed to load benchmark data';
  }
  return null;
});

const hasRenderableData = computed(() => {
  return chartItems.value.length > 0 && !loading.value && !error.value;
});

const chartData = computed(() => {
  if (chartItems.value.length === 0) {
    return { labels: [], datasets: [] };
  }

  const labels = chartItems.value.map((item) => getChartAxisLabel(item));
  const toNormalizedValue = (item: ComparableChartItem, value: number | null) => {
    if (value === null || item.market === null || item.market === 0) {
      return null;
    }

    return roundMetricValue((value / item.market) * 100);
  };

  const nodeData = chartItems.value.map((item) =>
    isAllMetricsView.value ? toNormalizedValue(item, item.node) : (item.node ?? 0)
  );

  const datasets = [
    {
      label: 'Node Avg',
      data: nodeData,
      backgroundColor: 'hsl(217, 100%, 50%)',
      borderWidth: 1,
    },
  ];

  const marketData = chartItems.value.map((item) =>
    isAllMetricsView.value ? (item.market !== null ? 100 : null) : (item.market ?? 0)
  );
  const hasMarketComparison = chartItems.value.some((item) => item.market !== null);

  if (currentMarketLabel.value && hasMarketComparison) {
    datasets.push({
      label: currentMarketName.value ? `${currentMarketName.value} Avg` : 'Market Avg',
      data: marketData,
      backgroundColor: 'hsl(116, 92%, 49%)',
      borderWidth: 1,
    });
  }

  return {
    labels,
    datasets,
  };
});

const comparisonLegend = computed<Array<{ id: string; label: string; delta: number | null }>>(() => {
  if (chartItems.value.length === 0 || !currentMarketLabel.value) {
    return [];
  }

  return chartItems.value.map((item) => {
    const nodeVal = Number(item.node ?? 0);
    const marketVal = Number(item.market ?? 0);

    let delta: number | null = null;
    if (Number.isFinite(nodeVal) && Number.isFinite(marketVal) && marketVal !== 0) {
      delta = Math.round(((nodeVal - marketVal) / marketVal) * 100);
    }

    return {
      id: item.id,
      label: item.label,
      delta,
    };
  });
});

const comparisonDeltaByLabel = computed<Record<string, number>>(() => {
  return Object.fromEntries(
    comparisonLegend.value
      .filter((item): item is { id: string; label: string; delta: number } => item.delta !== null)
      .map((item) => [item.label, item.delta])
  );
});

const chartOptions = computed(() => {
  const labels = chartData.value.labels || [];

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 10,
      },
    },
    scales: {
      x: {
        title: {
          display: false,
        },
        ticks: {
          callback(_value: unknown, index: number) {
            return labels[index] ?? '';
          },
        },
      },
      y: {
        title: {
          display: true,
          text: isAllMetricsView.value
            ? '% of Market Average (100% = average)'
            : selectedMetricOption.value?.label ?? '',
        },
        beginAtZero: true,
        ticks: isAllMetricsView.value
          ? {
              callback(value: unknown) {
                return `${value}%`;
              },
            }
          : undefined,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
      },
      tooltip: {
        callbacks: {
          title(items: any[]) {
            const item = chartItems.value[items[0]?.dataIndex];
            return item ? getTooltipTitle(item) : '';
          },
          label(context: any) {
            const item = chartItems.value[context.dataIndex];
            if (!item) {
              return `${context.dataset.label}: ${context.parsed.y}`;
            }

            const rawValue = context.datasetIndex === 0 ? item.node : item.market;
            const formattedRawValue =
              rawValue === null ? 'n/a' : `${roundMetricValue(rawValue)}${item.unitLabel ? ` ${item.unitLabel}` : ''}`;

            if (isAllMetricsView.value) {
              const normalizedValue = typeof context.parsed.y === 'number' ? `${roundMetricValue(context.parsed.y)}%` : 'n/a';
              return `${context.dataset.label}: ${formattedRawValue} (${normalizedValue})`;
            }

            return `${context.dataset.label}: ${formattedRawValue}`;
          },
        },
      },
    },
  };
});

const percentileOverlayPlugin = {
  id: 'percentileOverlayPlugin',
  afterDraw(chart: any) {
    if (selectedMetricOption.value?.comparisonMode === 'all') {
      return;
    }

    const deltaMap = comparisonDeltaByLabel.value;
    const labels = chartData.value.labels || [];
    const xScale = chart.scales?.x;
    if (!xScale || !labels.length) return;

    const ctx = chart.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 10px "Helvetica Neue", Arial, sans-serif';

    const baseY = chart.chartArea.bottom + 26;
    labels.forEach((label: string, idx: number) => {
      const delta = deltaMap[label];
      if (delta === undefined) return;
      const x = xScale.getPixelForTick(idx);
      ctx.fillStyle = delta >= 0 ? '#23d160' : '#f14668';
      const text = `${delta >= 0 ? '+' : ''}${delta}%`;
      ctx.fillText(text, x, baseY);
    });

    ctx.restore();
  },
};

const chartPlugins = computed(() => {
  if (selectedMetricOption.value?.comparisonMode === 'all') {
    return [];
  }

  const hasComparison = comparisonLegend.value.length > 0;
  return hasComparison ? [percentileOverlayPlugin] : [];
});
</script>

<style lang="scss" scoped>
.label {
  display: inline-block;
  font-size: 0.9rem;
  font-weight: 600;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  margin: 0;
  min-height: auto;

  &.has-chart {
    height: 400px;
  }
}

.filters {
  display: flex;
  gap: 1rem;
}

.field {
  max-width: 300px;
}
</style>

