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
