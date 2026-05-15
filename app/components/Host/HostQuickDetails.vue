<template>
  <div>
    <div class="columns is-multiline is-variable is-0 no-padding">
      <div v-for="f in allFields" :key="f.key" class="column is-one-fifth is-full-mobile no-padding quick-detail-column" style="min-width:220px;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">{{ f.label }}</span>
          <span class="quick-detail-value">
            <template v-if="f.key === 'account' && f.value">
              <a :href="`https://solscan.io/account/${nodeAddress}`" target="_blank" class="address is-family-monospace">
                {{ nodeAddress }}
              </a>
            </template>
            <template v-else-if="f.key === 'status'">
              <div v-if="statusType === 'RUNNING'" style="width: fit-content" class="is-flex">
                <JobStatus :status="'RUNNING'" />
              </div>
              <div v-else-if="statusType === 'QUEUED'" style="width: fit-content" class="is-flex">
                <JobStatus :status="'QUEUED'" />
              </div>
              <div v-else-if="statusType === 'OFFLINE'" style="width: fit-content" class="is-flex">
                <JobStatus :status="'OFFLINE'" />
              </div>
              <span v-else>{{ f.value ?? '-' }}</span>
            </template>
            <template v-else-if="f.key === 'runningJob' && f.value">
              <a :href="`https://explore.nosana.com/jobs/${f.value}`" target="_blank" rel="noopener noreferrer" class="address is-family-monospace">
                {{ f.value }}
              </a>
            </template>
            <template v-else-if="f.key === 'hostMarket' && f.value">
              <a :href="`https://explore.nosana.com/markets/${f.value}`" target="_blank" rel="noopener noreferrer" class="address" :class="{ 'is-family-monospace': !testgridMarkets?.find((tgm: any) => tgm.address === f.value) }">
                <span v-if="testgridMarkets?.find((tgm: any) => tgm.address === f.value)">
                  {{ testgridMarkets.find((tgm: any) => tgm.address === f.value).name }}
                </span>
                <span v-else>{{ f.value }}</span>
              </a>
            </template>
            <template v-else>
              {{ f.value ?? '-' }}
            </template>
          </span>
        </div>
      </div>
    </div>
    <hr class="my-4" />
    <AdaptiveMetricsGrid :sources="gridSources" :fields="metricFields" />
  </div>
</template>

<script setup lang="ts">
import JobStatus from "~/components/Job/Status.vue"
import AdaptiveMetricsGrid from "~/components/UI/AdaptiveMetricsGrid.vue"
import type { MetricField } from "~/components/UI/AdaptiveMetricsGrid.vue"
import { useMarkets } from "~/composables/useMarkets"
import { useAPI } from "~/composables/useAPI"

const props = defineProps<{
  nodeAddress: string
  nodeSpecs: any | null
  metrics: any | null
  jobs: any | null
  loadingJobs: boolean
  nodeInfo: any | null
  loadingNodeInfo: boolean
  nosBalance: any | null
  nosStaked: any | null
  solBalance: number | null
  loadingBalances: boolean
}>()

const formatNos = (val: any) => val && typeof val.uiAmount === 'number' ? `${val.uiAmount.toFixed(4)} NOS` : null
const formatStaked = (val: any) => val && val.amount && !parseInt(val.timeUnstake) ? `${(val.amount / 1e6).toFixed(4)} NOS` : null
const formatSol = (lamports: number | null) => typeof lamports === 'number' ? `${(lamports / 1e9).toFixed(4)} SOL` : null

const runningJobAddress = computed(() => {
  const list = props.jobs?.jobs || []
  const running = list.find((j: any) => j.state === 1)
  return running ? running.address : null
})

const totalJobs = computed(() => props.jobs?.totalJobs ?? null)

const hostApiStatus = computed(() => props.loadingNodeInfo ? '...' : (props.nodeInfo?.info ? 'Online' : 'Offline'))

const { markets, getMarkets } = useMarkets()
if (!markets.value) {
  getMarkets()
}

// Fetch markets data for market names
const { data: testgridMarkets } = useAPI('/api/markets', { default: () => [] })

const queueInfo = computed(() => {
  let position = -1
  const market = markets.value?.find((m) => {
    position = m.queue.findIndex((a: any) => a.toString() === props.nodeAddress)
    return position !== -1
  })
  if (market) {
    return { market, position }
  }
  return undefined
})

const isNode = computed(() => {
  return runningJobAddress.value || totalJobs.value || props.nodeSpecs?.marketAddress || queueInfo.value
})

const statusType = computed(() => {
  if (props.loadingNodeInfo || props.loadingJobs) return null
  if (!isNode.value) return null
  if (queueInfo.value) return 'QUEUED'
  if (runningJobAddress.value) return 'RUNNING'
  if (!props.nodeInfo?.info) return 'OFFLINE'
  return null
})

const statusText = computed(() => {
  if (props.loadingNodeInfo || props.loadingJobs) return '...'
  if (!isNode.value) return 'Not a node'
  if (statusType.value === 'RUNNING') return 'Running'
  if (statusType.value === 'QUEUED') return 'Queued'
  if (statusType.value === 'OFFLINE') return 'Offline'
  if (props.nodeInfo?.info) return '(Re)starting'
  return 'Offline'
})

const metricFields: MetricField[] = [
  {
    key: 'gpu',
    label: 'GPU',
    paths: ['nodeInfo.info.gpus.devices.0.name', 'metrics.gpu.devices.0.name', 'nodeSpecs.gpus.0.gpu'],
  },
  {
    key: 'cliVersion',
    label: 'CLI Version',
    paths: ['nodeInfo.info.version', 'metrics.node_version', 'nodeSpecs.nodeVersion'],
    formatter: 'version',
  },
  {
    key: 'nvidiaDriver',
    label: 'NVIDIA Driver',
    paths: ['nodeInfo.info.gpus.nvml_driver_version', 'metrics.gpu.nvml_driver_version', 'metrics.nvml_version', 'nodeSpecs.nvmlVersion'],
    formatter: 'version',
  },
  {
    key: 'cudaVersion',
    label: 'CUDA Version',
    paths: ['nodeInfo.info.gpus.cuda_driver_version', 'metrics.gpu.runtime_version', 'metrics.cuda_runtime_version', 'nodeSpecs.cudaVersion'],
    formatter: 'version',
  },
  {
    key: 'country',
    label: 'Country',
    paths: ['nodeInfo.info.country', 'metrics.network.country', 'metrics.country', 'nodeSpecs.country'],
    formatter: 'country',
  },
  {
    key: 'systemEnv',
    label: 'System Environment',
    paths: ['nodeInfo.info.system_environment', 'metrics.system_environment', 'nodeSpecs.systemEnvironment'],
  },
  {
    key: 'cpu',
    label: 'CPU',
    paths: ['nodeInfo.info.cpu.model', 'metrics.cpu.cpu_model', 'metrics.cpu_model', 'nodeSpecs.cpu'],
  },
  {
    key: 'diskSpace',
    label: 'Disk Space',
    paths: ['nodeInfo.info.disk_gb', 'metrics.disk_gb', 'nodeSpecs.diskSpace'],
    formatter: 'gb',
  },
  {
    key: 'ram',
    label: 'RAM',
    paths: ['nodeInfo.info.ram_mb', 'metrics.ram_gb', 'nodeSpecs.ram'],
    transformPaths: {
      'metrics.ram_gb': 'gbToMb',
    },
    formatter: 'mb',
  },
  {
    key: 'download',
    label: 'Download Speed',
    paths: ['metrics.network.download_mbps', 'metrics.download_mbps', 'nodeSpecs.avgDownload10'],
    formatter: 'mbps',
  },
]

const gridSources = computed(() => ({
  nodeInfo: props.nodeInfo,
  metrics: props.metrics,
  nodeSpecs: props.nodeSpecs,
}))

const allFields = computed(() => [
  { key: 'account',       label: 'Account',        value: props.nodeAddress },
  { key: 'status',        label: 'Status',         value: statusText.value },
  { key: 'nosBalance',    label: 'NOS Balance',    value: props.loadingBalances ? '...' : formatNos(props.nosBalance) },
  { key: 'nosStaked',     label: 'NOS Staked',     value: props.loadingBalances ? '...' : formatStaked(props.nosStaked) },
  { key: 'solBalance',    label: 'SOL Balance',    value: props.loadingBalances ? '...' : formatSol(props.solBalance) },
  { key: 'runningJob',    label: 'Running job',    value: runningJobAddress.value },
  { key: 'hostMarket',    label: 'GPU pool',       value: props.nodeSpecs?.marketAddress || null },
  { key: 'hostApiStatus', label: 'Host API Status', value: hostApiStatus.value },
])
</script>

<style scoped>
.quick-detail-item{padding:0.2rem 0.5rem;border-radius:4px;display:flex;flex-direction:column;height:100%}
.quick-detail-label{font-size:.7rem;font-weight:600;color:#7a7a7a;text-transform:uppercase;margin-bottom:.1rem}
.quick-detail-value{font-size:.85rem;font-weight:500;color:#363636;word-break:break-word}
.quick-detail-column{margin-bottom:0!important}
.no-padding{padding:0!important}
html.dark-mode .quick-detail-item .quick-detail-label{color:#b0b0b0}
html.dark-mode .quick-detail-item .quick-detail-value{color:#ffffff}
</style>


