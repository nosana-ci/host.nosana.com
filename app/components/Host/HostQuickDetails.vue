<template>
  <div class="box">
    <div class="columns is-multiline is-variable is-0 no-padding">
      <div v-for="f in otherFields" :key="f.key" class="column is-one-fifth is-full-mobile no-padding" style="min-width:220px;margin-bottom:0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">{{ f.label }}</span>
          <span class="quick-detail-value">{{ f.value ?? '-' }}</span>
        </div>
      </div>
    </div>
    <hr class="my-4" />
    <div class="columns is-multiline is-variable is-0 no-padding">
      <div v-for="f in importantFields" :key="f.key" class="column is-one-fifth is-full-mobile no-padding" style="min-width:220px;margin-bottom:0.75rem;">
        <div class="quick-detail-item">
          <span class="quick-detail-label">{{ f.label }}</span>
          <span class="quick-detail-value">{{ f.value ?? '-' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  nodeAddress: string
  combinedSpecs: any | null
  nodeRanking: any | null
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
const formatMbps = (val?: number | null) => (val === null || val === undefined || !Number.isFinite(Number(val))) ? null : `${Math.round(Number(val))} Mbps`

const runningJobAddress = computed(() => {
  const list = props.jobs?.jobs || []
  const running = list.find((j: any) => j.state === 1)
  return running ? running.address : null
})

const totalJobs = computed(() => props.jobs?.totalJobs ?? null)

const cliVersion = computed(() => props.combinedSpecs?.nodeVersion ? `v${props.combinedSpecs.nodeVersion}` : null)

const hostApiStatus = computed(() => props.loadingNodeInfo ? '...' : (props.nodeInfo?.info ? 'Online' : 'Offline'))

const statusText = computed(() => {
  if (props.loadingNodeInfo || props.loadingJobs) return '...'
  if (!props.combinedSpecs && !totalJobs.value) return 'Not a node'
  if (props.nodeInfo?.info || runningJobAddress.value) return 'Online'
  return 'Offline'
})

const availability = computed(() => {
  if (!props.combinedSpecs?.marketAddress) return '-'
  const val = props.nodeRanking?.uptimePercentage
  if (val === undefined || val === null) return 'unknown'
  return `${Number(val).toFixed(1)}%`
})

const antiSpoof = computed(() => {
  const src = props.nodeRanking
  const val = src?.antiSpoofSuccessRate ?? src?.participationRate
  return (val === undefined || val === null) ? null : `${Number(val).toFixed(1)}%`
})

const gpuName = computed(() => props.combinedSpecs?.gpus?.length ? props.combinedSpecs.gpus[0].gpu : null)
const cpu = computed(() => props.combinedSpecs?.cpu || null)
const ram = computed(() => props.combinedSpecs?.ram != null ? `${props.combinedSpecs.ram} MB` : null)
const diskSpace = computed(() => props.combinedSpecs?.diskSpace != null ? `${props.combinedSpecs.diskSpace} GB` : null)
const country = computed(() => props.combinedSpecs?.country || null)
const systemEnv = computed(() => props.combinedSpecs?.systemEnvironment || null)
const download = computed(() => formatMbps(props.combinedSpecs?.download))
const upload = computed(() => formatMbps(props.combinedSpecs?.upload))

const allFields = computed(() => [
  { key: 'hostApiStatus', label: 'Host API Status', value: hostApiStatus.value },
  { key: 'availability',  label: 'Availability',    value: availability.value },
  { key: 'antiSpoof',     label: 'Anti-spoof %',   value: antiSpoof.value },
  { key: 'cpu',           label: 'CPU',            value: cpu.value },
  { key: 'ram',           label: 'RAM',            value: ram.value },
  { key: 'download',      label: 'Download Speed', value: download.value },
  { key: 'upload',        label: 'Upload Speed',   value: upload.value },

  { key: 'status',        label: 'Status',         value: statusText.value },
  { key: 'account',       label: 'Account',        value: props.nodeAddress },
  { key: 'nosBalance',    label: 'NOS Balance',    value: props.loadingBalances ? '...' : formatNos(props.nosBalance) },
  { key: 'nosStaked',     label: 'NOS Staked',     value: props.loadingBalances ? '...' : formatStaked(props.nosStaked) },
  { key: 'solBalance',    label: 'SOL Balance',    value: props.loadingBalances ? '...' : formatSol(props.solBalance) },
  { key: 'solAddress',    label: 'Solana Address', value: props.nodeAddress },
  { key: 'runningJob',    label: 'Running job',    value: runningJobAddress.value },
  { key: 'hostMarket',    label: 'Host market',    value: props.combinedSpecs?.marketAddress || null },
  { key: 'totalJobs',     label: 'Total Jobs',     value: totalJobs.value },
  { key: 'cliVersion',    label: 'CLI Version',    value: cliVersion.value },
  { key: 'gpu',           label: 'GPU',            value: gpuName.value },
  { key: 'nvidiaDriver',  label: 'NVIDIA Driver',  value: props.combinedSpecs?.nvmlVersion || null },
  { key: 'cudaVersion',   label: 'CUDA Version',   value: props.combinedSpecs?.cudaVersion || null },
  { key: 'diskSpace',     label: 'Disk Space',     value: diskSpace.value },
  { key: 'country',       label: 'Country',        value: country.value },
  { key: 'systemEnv',     label: 'System Environment', value: systemEnv.value },
])

const importantKeys = new Set(['hostApiStatus','availability','antiSpoof','cpu','ram','download','upload'])

const importantFields = computed(() => allFields.value.filter(f => importantKeys.has(f.key)))
const otherFields     = computed(() => allFields.value.filter(f => !importantKeys.has(f.key)))
</script>

<style scoped>
.quick-detail-item{padding:0.2rem 0.5rem;border-radius:4px;display:flex;flex-direction:column;height:100%}
.quick-detail-label{font-size:.7rem;font-weight:600;color:#7a7a7a;text-transform:uppercase;margin-bottom:.1rem}
.quick-detail-value{font-size:.85rem;font-weight:500;color:#363636;word-break:break-word}
.no-padding{padding:0!important}
html.dark-mode .quick-detail-item .quick-detail-label{color:#b0b0b0}
html.dark-mode .quick-detail-item .quick-detail-value{color:#ffffff}
</style>


