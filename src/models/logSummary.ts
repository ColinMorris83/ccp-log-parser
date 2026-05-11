/**
 * Health status for a summary section.
 */
export type HealthStatus = 'error' | 'healthy' | 'unknown' | 'warning';

/**
 * Complete log summary derived from Amazon Connect infrastructure data.
 * This is the standalone (non-namespace-dependent) version — it covers
 * API health, clock skew, softphone, agent snapshots, contacts,
 * CCP lifecycle, and WebSocket health.
 */
export interface LogSummary {
  /** Agent state summary derived from snapshots */
  agent: AgentSummarySection;
  /** AWS API call health derived from apiLatency data */
  apiHealth: ApiHealthSection;
  /** CCP lifecycle signals derived from Amazon Connect log entries */
  ccpLifecycle: CcpLifecycleSection;
  /** Clock skew health derived from skewPoints */
  clockHealth: ClockHealthSection;
  /** Contact summary derived from contacts array */
  contacts: ContactsSection;
  /** Combined health assessment across all sections */
  overallHealth: HealthStatus;
  /** Session time window and entry counts */
  sessionWindow: SessionWindowSection;
  /** Softphone call health derived from softphoneReports */
  softphoneHealth: SoftphoneHealthSection;
  /** WebSocket connection health derived from Amazon Connect log entries */
  webSocket: WebSocketSection;
}

/**
 * Session time window and basic entry statistics.
 */
export interface SessionWindowSection {
  /** Total duration of the log in milliseconds */
  durationMs: number;
  /** ISO timestamp of the last entry */
  endTime: string;
  /** Total number of log entries */
  entryCount: number;
  /** Total ERROR-level entries across all sources */
  errorCount: number;
  /** ISO timestamp of the first entry */
  startTime: string;
  /** Total WARN-level entries across all sources */
  warnCount: number;
}

/**
 * Agent state summary derived from snapshots.
 */
export interface AgentSummarySection {
  health: HealthStatus;
  /** Total number of GET_AGENT_SNAPSHOT responses received */
  snapshotCount: number;
  /** Number of actual agent state transitions (consecutive snapshots with different stateName) */
  stateChangeCount: number;
}

/**
 * AWS API call health derived from parsed apiLatency data.
 */
export interface ApiHealthSection {
  /** Average latency across all measured calls (ms) */
  avgLatencyMs: number;
  /** Number of API calls that failed */
  failedCalls: number;
  health: HealthStatus;
  /** Maximum latency observed (ms) */
  maxLatencyMs: number;
  /** Number of orphaned sends with no reply */
  staleSendCount: number;
  /** Total measured API call/reply pairs */
  totalCalls: number;
}

/**
 * Clock skew health derived from parsed skewPoints.
 */
export interface ClockHealthSection {
  /** Average absolute skew (ms) */
  avgSkewMs: number;
  health: HealthStatus;
  /** Maximum absolute skew observed (ms) */
  maxSkewMs: number;
  /** Total skew measurements */
  sampleCount: number;
}

/**
 * Contact summary derived from the contacts array.
 */
export interface ContactsSection {
  health: HealthStatus;
  /** Total unique contacts detected */
  total: number;
}

/**
 * Softphone call health derived from parsed softphoneReports.
 */
export interface SoftphoneHealthSection {
  /** Average talking duration across calls (ms) */
  avgTalkingMs: number;
  /** Number of softphone calls */
  callCount: number;
  /** Number of calls with at least one failure flag */
  failureCount: number;
  health: HealthStatus;
  /** Whether any packet loss was detected in softphone metrics */
  packetLossDetected: boolean;
}

/**
 * CCP lifecycle signals derived from Amazon Connect's own log entries.
 */
export interface CcpLifecycleSection {
  /** Browser name and version, e.g. "Chrome 147" */
  browser: string;
  /** Inner CCP Streams library version, e.g. "1.7.4" */
  ccpVersion: string;
  health: HealthStatus;
  /** Time taken for the CCP iframe to initialise (ms), or null if not found */
  iframeInitTimeMs: null | number;
  /** Whether an "Agent initialized" signal was found */
  initialised: boolean;
  /** Outer StreamsJS library version, e.g. "2.25.0" */
  streamsVersion: string;
}

/**
 * WebSocket connection health derived from Amazon Connect's own log entries.
 */
export interface WebSocketSection {
  /** Number of WebSocket connection close events */
  connectionCloseCount: number;
  /** Number of WebSocket connection open events */
  connectionOpenCount: number;
  /** Number of successful deep heartbeats (indicates connection is alive) */
  deepHeartbeatCount: number;
  health: HealthStatus;
  /** Number of scheduled WebSocket reconnections (normal rotation) */
  scheduledReconnections: number;
}
