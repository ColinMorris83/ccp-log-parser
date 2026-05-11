import type { ParsedCcpLog } from '../models/ccpLogParser';
import type {
  AgentSummarySection,
  ApiHealthSection,
  CcpLifecycleSection,
  ClockHealthSection,
  ContactsSection,
  HealthStatus,
  LogSummary,
  SessionWindowSection,
  SoftphoneHealthSection,
  WebSocketSection,
} from '../models/logSummary';

/** Skew above this threshold (ms) is considered a warning */
const SKEW_WARNING_MS = 1_000;
/** Skew above this threshold (ms) is considered an error */
const SKEW_ERROR_MS = 5_000;
/** API latency above this threshold (ms) is considered slow */
const LATENCY_WARNING_MS = 500;
/** API failure rate above this threshold is an error */
const API_FAILURE_RATE_ERROR = 0.1;

// ---------------------------------------------------------------------------
// Section builders — each is a small pure function
// ---------------------------------------------------------------------------

/**
 * Builds the session time window from the first and last entries.
 *
 * @param parsedLog - The fully parsed CCP log.
 * @returns Session window section.
 */
const buildSessionWindow = (parsedLog: ParsedCcpLog): SessionWindowSection => {
  const { entries } = parsedLog;
  if (entries.length === 0) {
    return { durationMs: 0, endTime: '', entryCount: 0, errorCount: 0, startTime: '', warnCount: 0 };
  }
  const first = entries[0];
  const last = entries[entries.length - 1];
  return {
    durationMs: last._ts - first._ts,
    endTime: last.time,
    entryCount: entries.length,
    errorCount: parsedLog.errorCount,
    startTime: first.time,
    warnCount: parsedLog.warnCount,
  };
};

/**
 * Builds the agent section from snapshots.
 * Health is based on snapshot presence only (no namespace error counts available).
 *
 * @param parsedLog - The fully parsed CCP log.
 * @returns Agent summary section.
 */
const buildAgent = (parsedLog: ParsedCcpLog): AgentSummarySection => {
  const { snapshots } = parsedLog;
  const snapshotCount = snapshots.length;

  // Count actual state transitions — consecutive snapshots with a different stateName.
  let stateChangeCount = 0;
  for (let i = 1; i < snapshots.length; i++) {
    if (snapshots[i].stateName !== snapshots[i - 1].stateName) {
      stateChangeCount++;
    }
  }

  const health: HealthStatus = snapshotCount === 0 ? 'unknown' : 'healthy';

  return { health, snapshotCount, stateChangeCount };
};

/**
 * API names excluded from latency stats — these are high-frequency polling calls
 * already represented in the Clock Skew section. Matches MetricsPanel's filter.
 */
const LATENCY_API_FILTER = new Set(['getAgentSnapshot']);

/**
 * Builds the API health section from parsed apiLatency data.
 *
 * @param parsedLog - The fully parsed CCP log.
 * @returns API health section.
 */
const buildApiHealth = (parsedLog: ParsedCcpLog): ApiHealthSection => {
  const { staleApiSendCount } = parsedLog;
  const filtered = parsedLog.apiLatency.filter((p) => !LATENCY_API_FILTER.has(p.apiName));
  const totalCalls = filtered.length;

  if (totalCalls === 0) {
    return {
      avgLatencyMs: 0,
      failedCalls: 0,
      health: 'unknown',
      maxLatencyMs: 0,
      staleSendCount: staleApiSendCount,
      totalCalls: 0,
    };
  }

  const failedCalls = filtered.filter((p) => p.status === 'failed').length;
  const totalLatency = filtered.reduce((sum, p) => sum + p.latencyMs, 0);
  const avgLatencyMs = Math.round(totalLatency / totalCalls);
  const maxLatencyMs = Math.max(...filtered.map((p) => p.latencyMs));

  const failureRate = failedCalls / totalCalls;
  const health: HealthStatus =
    failureRate > API_FAILURE_RATE_ERROR
      ? 'error'
      : failedCalls > 0 || avgLatencyMs > LATENCY_WARNING_MS
        ? 'warning'
        : 'healthy';

  return { avgLatencyMs, failedCalls, health, maxLatencyMs, staleSendCount: staleApiSendCount, totalCalls };
};

/**
 * Builds the clock health section from parsed skewPoints.
 *
 * @param parsedLog - The fully parsed CCP log.
 * @returns Clock health section.
 */
const buildClockHealth = (parsedLog: ParsedCcpLog): ClockHealthSection => {
  const { skewPoints } = parsedLog;

  if (skewPoints.length === 0) {
    return { avgSkewMs: 0, health: 'unknown', maxSkewMs: 0, sampleCount: 0 };
  }

  const absSkews = skewPoints.map((p) => Math.abs(p.skewMs));
  const maxSkewMs = Math.max(...absSkews);
  const avgSkewMs = Math.round(absSkews.reduce((sum, s) => sum + s, 0) / absSkews.length);

  const health: HealthStatus =
    maxSkewMs > SKEW_ERROR_MS ? 'error' : maxSkewMs > SKEW_WARNING_MS ? 'warning' : 'healthy';

  return { avgSkewMs, health, maxSkewMs, sampleCount: skewPoints.length };
};

/**
 * Builds the contacts section from the contacts array.
 * Without namespace data, health is based purely on whether contacts were detected.
 *
 * @param parsedLog - The fully parsed CCP log.
 * @returns Contacts section.
 */
const buildContacts = (parsedLog: ParsedCcpLog): ContactsSection => {
  const total = parsedLog.contacts.length;
  const health: HealthStatus = total === 0 ? 'unknown' : 'healthy';

  return { health, total };
};

/**
 * Builds the softphone health section from parsed softphoneReports and metrics.
 *
 * @param parsedLog - The fully parsed CCP log.
 * @returns Softphone health section.
 */
const buildSoftphoneHealth = (parsedLog: ParsedCcpLog): SoftphoneHealthSection => {
  const { softphoneMetrics, softphoneReports } = parsedLog;
  const callCount = softphoneReports.length;

  if (callCount === 0) {
    return { avgTalkingMs: 0, callCount: 0, failureCount: 0, health: 'unknown', packetLossDetected: false };
  }

  const failureCount = softphoneReports.filter((r) =>
    Object.entries(r).some(([key, val]) => key.endsWith('Failure') && val === true),
  ).length;

  const totalTalking = softphoneReports.reduce((sum, r) => sum + r.talkingTimeMs, 0);
  const avgTalkingMs = Math.round(totalTalking / callCount);
  const packetLossDetected = softphoneMetrics.some((m) => m.packetsLost > 0);

  const health: HealthStatus = failureCount > 0 ? 'error' : packetLossDetected ? 'warning' : 'healthy';

  return { avgTalkingMs, callCount, failureCount, health, packetLossDetected };
};

// ---------------------------------------------------------------------------
// Text-pattern matchers for Amazon Connect's own log entries
// ---------------------------------------------------------------------------

const RE_IFRAME_INIT_TIME = /Iframe initialization time (\d+)/;
const RE_STREAMS_VERSION = /StreamsJS Version: ([\d.]+)/;
const RE_CCP_VERSION = /Inner\/CCP Streams Version: ([\d.]+)/;
const RE_BROWSER = /Browser: (\w+) Version: (\d+)/;

/**
 * Builds the CCP lifecycle section by scanning log entries for Amazon Connect's
 * own initialisation signals
 *
 * @param parsedLog - The fully parsed CCP log.
 * @returns CCP lifecycle section.
 */
const buildCcpLifecycle = (parsedLog: ParsedCcpLog): CcpLifecycleSection => {
  let initialised = false;
  let iframeInitTimeMs: null | number = null;
  let streamsVersion = '';
  let ccpVersion = '';
  let browser = '';

  for (const entry of parsedLog.entries) {
    const { text } = entry;

    if (text === 'Agent initialized') {
      initialised = true;
      continue;
    }

    if (iframeInitTimeMs === null) {
      const iframeMatch = RE_IFRAME_INIT_TIME.exec(text);
      if (iframeMatch) {
        iframeInitTimeMs = Number(iframeMatch[1]);
        continue;
      }
    }

    if (!streamsVersion) {
      const streamsMatch = RE_STREAMS_VERSION.exec(text);
      if (streamsMatch) {
        streamsVersion = streamsMatch[1];
        continue;
      }
    }

    if (!ccpVersion) {
      const ccpMatch = RE_CCP_VERSION.exec(text);
      if (ccpMatch) {
        ccpVersion = ccpMatch[1];
        continue;
      }
    }

    if (!browser) {
      const browserMatch = RE_BROWSER.exec(text);
      if (browserMatch) {
        browser = `${browserMatch[1]} ${browserMatch[2]}`;
        continue;
      }
    }
  }

  const health: HealthStatus = initialised ? 'healthy' : 'unknown';

  return { browser, ccpVersion, health, iframeInitTimeMs, initialised, streamsVersion };
};

/**
 * Builds the WebSocket section by scanning log entries for Amazon Connect's
 * own WebSocket lifecycle events.
 *
 * @param parsedLog - The fully parsed CCP log.
 * @returns WebSocket section.
 */
const buildWebSocket = (parsedLog: ParsedCcpLog): WebSocketSection => {
  let connectionOpenCount = 0;
  let connectionCloseCount = 0;
  let deepHeartbeatCount = 0;
  let scheduledReconnections = 0;

  for (const entry of parsedLog.entries) {
    const { text } = entry;

    if (text === 'Publishing event: webSocket::connection_open') {
      connectionOpenCount++;
    } else if (text === 'Publishing event: webSocket::connection_close') {
      connectionCloseCount++;
    } else if (text.includes('WebSocket deep heartbeat success')) {
      deepHeartbeatCount++;
    } else if (text.includes('Starting scheduled WebSocket manager reconnection')) {
      scheduledReconnections++;
    }
  }

  const hasAnyData = connectionOpenCount > 0 || deepHeartbeatCount > 0;
  const health: HealthStatus = hasAnyData ? 'healthy' : 'unknown';

  return { connectionCloseCount, connectionOpenCount, deepHeartbeatCount, health, scheduledReconnections };
};

/**
 * Derives the overall health from all section health statuses.
 * Returns the worst health across all sections.
 *
 * @param sections - Array of individual section health statuses.
 * @returns The worst health status found.
 */
const deriveOverallHealth = (sections: HealthStatus[]): HealthStatus => {
  if (sections.includes('error')) return 'error';
  if (sections.includes('warning')) return 'warning';
  if (sections.every((s) => s === 'unknown')) return 'unknown';
  return 'healthy';
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds a complete log summary from a parsed CCP log, using Amazon Connect
 * infrastructure data (API latency, snapshots, softphone, contacts, clock skew).
 *
 * This is a pure function — no side effects, deterministic output for a given input.
 *
 * @param parsedLog - The fully parsed CCP log from parseCcpLog().
 * @returns A structured LogSummary ready for rendering.
 */
export const buildLogSummary = (parsedLog: ParsedCcpLog): LogSummary => {
  const sessionWindow = buildSessionWindow(parsedLog);
  const agent = buildAgent(parsedLog);
  const apiHealth = buildApiHealth(parsedLog);
  const ccpLifecycle = buildCcpLifecycle(parsedLog);
  const clockHealth = buildClockHealth(parsedLog);
  const contacts = buildContacts(parsedLog);
  const softphoneHealth = buildSoftphoneHealth(parsedLog);
  const webSocket = buildWebSocket(parsedLog);

  const overallHealth = deriveOverallHealth([
    agent.health,
    apiHealth.health,
    ccpLifecycle.health,
    clockHealth.health,
    contacts.health,
    softphoneHealth.health,
    webSocket.health,
  ]);

  return {
    agent,
    apiHealth,
    ccpLifecycle,
    clockHealth,
    contacts,
    overallHealth,
    sessionWindow,
    softphoneHealth,
    webSocket,
  };
};
