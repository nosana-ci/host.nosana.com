    <template>
      <div class="box">
        <div class="filters mb-4">
      <div class="field">
        <label class="label">Metric</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select v-model="selectedMetric">
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
  defaultMetric: {
    type: String,
    default: 'tokensPerSecond',
  },
});

interface NodePerformance {
  tokensPerSecond: number;
  gpuTemperatureAvg: number;
  gpuWattageAvg: number;
  benchmarkCount: number;
}

type PerformanceMetrics = Partial<NodePerformance>;

interface TemplatePerformance {
  templateId: string;
  templateName: string;
  node: PerformanceMetrics;
  market: PerformanceMetrics;
}

interface TemplateData {
  nodeId: string;
  currentMarket: string | null;
  templates: TemplatePerformance[];
}

const hasMetricValue = (template: TemplatePerformance, metric: keyof NodePerformance) => {
  return typeof template.node[metric] === 'number';
};

const selectedMetric = ref(props.defaultMetric);

const metricOptions = [
  { value: 'tokensPerSecond', label: 'Tokens / Second', queryMetric: 'tokens_per_second' },
  { value: 'gpuTemperatureAvg', label: 'Temperature (°C)', queryMetric: 'gpu_temperature_avg' },
  { value: 'gpuWattageAvg', label: 'Power Usage (W)', queryMetric: 'gpu_wattage_avg' },
] as const;

const selectedMetricOption = computed(
  () => metricOptions.find((metric) => metric.value === selectedMetric.value) ?? metricOptions[0]
);

// Fetch template performance data using useAPI at the top level
const apiUrl = computed(() => {
  const params = new URLSearchParams({
    source: 'github',
    metrics: selectedMetricOption.value.queryMetric,
  });

  return `/api/benchmarks/node-template-performance/${props.nodeId}?${params.toString()}`;
});

const { data: templateData, pending: loading, error: fetchError } = useAPI(
  apiUrl,
  {
    watch: [apiUrl],
  }
);

// Compute error message
const error = computed(() => {
  if (fetchError.value) {
    return 'Failed to load benchmark data';
  }
  return null;
});

const filteredTemplates = computed(() => {
  if (!templateData.value?.templates) {
    return [];
  }

  return templateData.value.templates.filter((template: TemplatePerformance) =>
    hasMetricValue(template, selectedMetric.value as keyof NodePerformance)
  );
});

const hasRenderableData = computed(() => {
  return filteredTemplates.value.length > 0 && !loading.value && !error.value;
});

const chartData = computed(() => {
  if (filteredTemplates.value.length === 0) {
    return { labels: [], datasets: [] };
  }

  const templates = filteredTemplates.value;
  const labels = templates.map((t: TemplatePerformance) => t.templateName);
  
  const nodeData = templates.map((t: TemplatePerformance) => {
    const value = t.node[selectedMetric.value as keyof NodePerformance];
    return typeof value === 'number' ? value : 0;
  });

  const marketData = templates.map((t: TemplatePerformance) => {
    const value = t.market?.[selectedMetric.value as keyof NodePerformance];
    return typeof value === 'number' ? value : 0;
  });

  const hasMarketComparison = templates.some((t: TemplatePerformance) => {
    const value = t.market?.[selectedMetric.value as keyof NodePerformance];
    return typeof value === 'number';
  });

  const datasets = [
    {
      label: 'Node Performance',
      data: nodeData,
      backgroundColor: 'hsl(217, 100%, 50%)', // Bulma info color
      borderWidth: 1,
    },
  ];

  if (templateData.value.currentMarket && hasMarketComparison) {
    datasets.push({
      label: `${templateData.value.currentMarket} Average`,
      data: marketData,
      backgroundColor: 'hsl(116, 92%, 49%)', // Bulma secondary color
      borderWidth: 1,
    });
  }

  return {
    labels,
    datasets,
  };
});

const comparisonLegend = computed<
  Array<{ templateId: string; templateName: string; delta: number | null }>
>(() => {
  if (filteredTemplates.value.length === 0 || !templateData.value?.currentMarket) {
    return [];
  }

  return filteredTemplates.value.map((t: TemplatePerformance) => {
    const nodeVal = Number(
      t.node[selectedMetric.value as keyof NodePerformance] ?? 0
    );
    const marketVal = Number(
      t.market?.[selectedMetric.value as keyof NodePerformance] ?? 0
    );

    let delta: number | null = null;
    if (Number.isFinite(nodeVal) && Number.isFinite(marketVal) && marketVal !== 0) {
      delta = Math.round(((nodeVal - marketVal) / marketVal) * 100);
    }

    return {
      templateId: t.templateId,
      templateName: t.templateName,
      delta,
    };
  });
});

const comparisonDeltaByLabel = computed<Record<string, number>>(() => {
  return Object.fromEntries(
    comparisonLegend.value
      .filter((item): item is { templateId: string; templateName: string; delta: number } => item.delta !== null)
      .map((item) => [item.templateName, item.delta])
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
          callback(value: any, index: number) {
            return labels[index] ?? value;
          },
        },
      },
      y: {
        title: {
          display: true,
          text:
            metricOptions.find((m) => m.value === selectedMetric.value)?.label ||
            '',
        },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
      },
    },
  };
});

const percentileOverlayPlugin = {
  id: 'percentileOverlayPlugin',
  afterDraw(chart: any) {
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

