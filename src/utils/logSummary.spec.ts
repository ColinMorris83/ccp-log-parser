import type {
  AgentSnapshot,
  ApiLatencyPoint,
  ContactSummary,
  ParsedCcpLog,
  SkewPoint,
  SoftphoneCallReport,
  SoftphoneMetricPoint,
} from '../models/ccpLogParser';
import { buildLogSummary } from './logSummary';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a minimal empty ParsedCcpLog for testing. Override fields as needed.
 *
 * @param overrides - Partial fields to override on the default log.
 * @returns A complete ParsedCcpLog with sensible defaults.
 */
const makeEmptyLog = (overrides: Partial<ParsedCcpLog> = {}): ParsedCcpLog => ({
  apiLatency: [],
  contacts: [],
  entries: [],
  errorCount: 0,
  filename: 'test.txt',
  skewPoints: [],
  snapshots: [],
  softphoneMetrics: [],
  softphoneReports: [],
  staleApiSendCount: 0,
  warnCount: 0,
  ...overrides,
});

const makeEntry = (ts: number, level: 'ERROR' | 'INFO' | 'WARN' = 'INFO') => ({
  _key: ts,
  _oriKey: ts,
  _ts: ts,
  component: 'CCP',
  contactIds: [] as string[],
  level,
  text: 'msg',
  time: new Date(ts).toISOString(),
});

const makeSnapshot = (ts: number, stateName: string, fromKey = 0, toKey = 1): AgentSnapshot => ({
  _ts: ts,
  fromKey,
  stateName,
  time: new Date(ts).toISOString(),
  toKey,
});

const makeLatencyPoint = (
  apiName: string,
  latencyMs: number,
  status: 'failed' | 'succeeded' = 'succeeded',
): ApiLatencyPoint => ({
  _ts: 1_000,
  apiName,
  latencyMs,
  status,
});

const makeSkewPoint = (skewMs: number): SkewPoint => ({
  _ts: 1_000,
  localTime: '2026-01-01T00:00:00.000Z',
  serverTime: '2026-01-01T00:00:01.000Z',
  skewMs,
  stateName: 'Available',
});

const makeContact = (contactId: string, label: string): ContactSummary => ({
  contactId,
  endTime: '2026-01-01T00:05:00.000Z',
  firstKey: 0,
  label,
  lastKey: 10,
  startTime: '2026-01-01T00:00:00.000Z',
});

const makeReport = (overrides: Partial<SoftphoneCallReport> = {}): SoftphoneCallReport => ({
  callEndTime: '2026-01-01T00:05:00.000Z',
  callStartTime: '2026-01-01T00:00:00.000Z',
  cleanupTimeMs: 100,
  createOfferFailure: false,
  gumOtherFailure: false,
  gumTimeMs: 50,
  gumTimeoutFailure: false,
  handshakingFailure: false,
  handshakingTimeMs: 200,
  iceCollectionFailure: false,
  iceCollectionTimeMs: 100,
  initializationTimeMs: 10,
  invalidRemoteSDPFailure: false,
  noRemoteIceCandidateFailure: false,
  preTalkingTimeMs: 300,
  setLocalDescriptionFailure: false,
  setRemoteDescriptionFailure: false,
  signallingConnectionFailure: false,
  signallingConnectTimeMs: 150,
  streamStatistics: [],
  talkingTimeMs: 60_000,
  userBusyFailure: false,
  ...overrides,
});

const makeMetric = (packetsLost = 0): SoftphoneMetricPoint => ({
  audioLevel: 100,
  concealmentEvents: 0,
  echoReturnLoss: -30,
  echoReturnLossEnhancement: 10,
  jitterBufferDelayMs: 5,
  jitterBufferMs: 20,
  packetsCount: 50,
  packetsLost,
  roundTripTimeMs: 80,
  streamType: 'audio_output',
  timestamp: '2026-01-01T00:01:00.000Z',
});

// ---------------------------------------------------------------------------
// buildLogSummary — sessionWindow
// ---------------------------------------------------------------------------

describe('buildLogSummary — sessionWindow', () => {
  it('returns zeros for an empty log', () => {
    const { sessionWindow } = buildLogSummary(makeEmptyLog());
    expect(sessionWindow.durationMs).toBe(0);
    expect(sessionWindow.entryCount).toBe(0);
    expect(sessionWindow.errorCount).toBe(0);
    expect(sessionWindow.warnCount).toBe(0);
    expect(sessionWindow.startTime).toBe('');
    expect(sessionWindow.endTime).toBe('');
  });

  it('computes duration and counts from entries', () => {
    const log = makeEmptyLog({
      entries: [makeEntry(1_000), makeEntry(2_000), makeEntry(5_000)],
      errorCount: 2,
      warnCount: 1,
    });
    const { sessionWindow } = buildLogSummary(log);
    expect(sessionWindow.durationMs).toBe(4_000);
    expect(sessionWindow.entryCount).toBe(3);
    expect(sessionWindow.errorCount).toBe(2);
    expect(sessionWindow.warnCount).toBe(1);
    expect(sessionWindow.startTime).toBe(new Date(1_000).toISOString());
    expect(sessionWindow.endTime).toBe(new Date(5_000).toISOString());
  });
});

// ---------------------------------------------------------------------------
// buildLogSummary — agent
// ---------------------------------------------------------------------------

describe('buildLogSummary — agent', () => {
  it('returns unknown health and zero counts when no snapshots', () => {
    const { agent } = buildLogSummary(makeEmptyLog());
    expect(agent.health).toBe('unknown');
    expect(agent.snapshotCount).toBe(0);
    expect(agent.stateChangeCount).toBe(0);
  });

  it('returns healthy with correct snapshot and state change counts', () => {
    const snapshots = [
      makeSnapshot(1_000, 'Available'),
      makeSnapshot(2_000, 'Available'),
      makeSnapshot(3_000, 'Busy'),
      makeSnapshot(4_000, 'AfterCallWork'),
      makeSnapshot(5_000, 'AfterCallWork'),
    ];
    const { agent } = buildLogSummary(makeEmptyLog({ snapshots }));
    expect(agent.health).toBe('healthy');
    expect(agent.snapshotCount).toBe(5);
    expect(agent.stateChangeCount).toBe(2); // Available→Busy, Busy→AfterCallWork
  });

  it('counts no state changes when all snapshots have the same state', () => {
    const snapshots = [makeSnapshot(1_000, 'Available'), makeSnapshot(2_000, 'Available')];
    const { agent } = buildLogSummary(makeEmptyLog({ snapshots }));
    expect(agent.stateChangeCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildLogSummary — apiHealth
// ---------------------------------------------------------------------------

describe('buildLogSummary — apiHealth', () => {
  it('returns unknown health when no API calls', () => {
    const { apiHealth } = buildLogSummary(makeEmptyLog());
    expect(apiHealth.health).toBe('unknown');
    expect(apiHealth.totalCalls).toBe(0);
  });

  it('excludes getAgentSnapshot from latency stats', () => {
    const apiLatency = [makeLatencyPoint('getAgentSnapshot', 100), makeLatencyPoint('createContact', 200)];
    const { apiHealth } = buildLogSummary(makeEmptyLog({ apiLatency }));
    expect(apiHealth.totalCalls).toBe(1);
    expect(apiHealth.avgLatencyMs).toBe(200);
  });

  it('returns healthy when all calls succeed with low latency', () => {
    const apiLatency = [makeLatencyPoint('createContact', 100), makeLatencyPoint('updateContact', 200)];
    const { apiHealth } = buildLogSummary(makeEmptyLog({ apiLatency }));
    expect(apiHealth.health).toBe('healthy');
    expect(apiHealth.avgLatencyMs).toBe(150);
    expect(apiHealth.maxLatencyMs).toBe(200);
    expect(apiHealth.failedCalls).toBe(0);
  });

  it('returns warning when avg latency exceeds 500ms', () => {
    const apiLatency = [makeLatencyPoint('createContact', 600), makeLatencyPoint('updateContact', 500)];
    const { apiHealth } = buildLogSummary(makeEmptyLog({ apiLatency }));
    expect(apiHealth.health).toBe('warning');
  });

  it('returns warning when any call failed but rate is below 10%', () => {
    const apiLatency = Array.from({ length: 20 }, (_, i) =>
      makeLatencyPoint('api', 100, i === 0 ? 'failed' : 'succeeded'),
    );
    const { apiHealth } = buildLogSummary(makeEmptyLog({ apiLatency }));
    expect(apiHealth.health).toBe('warning');
    expect(apiHealth.failedCalls).toBe(1);
  });

  it('returns error when failure rate exceeds 10%', () => {
    const apiLatency = [
      makeLatencyPoint('api', 100, 'failed'),
      makeLatencyPoint('api', 100, 'failed'),
      makeLatencyPoint('api', 100, 'succeeded'),
    ];
    const { apiHealth } = buildLogSummary(makeEmptyLog({ apiLatency }));
    expect(apiHealth.health).toBe('error');
  });

  it('includes staleApiSendCount in the result', () => {
    const { apiHealth } = buildLogSummary(makeEmptyLog({ staleApiSendCount: 5 }));
    expect(apiHealth.staleSendCount).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// buildLogSummary — clockHealth
// ---------------------------------------------------------------------------

describe('buildLogSummary — clockHealth', () => {
  it('returns unknown when no skew points', () => {
    const { clockHealth } = buildLogSummary(makeEmptyLog());
    expect(clockHealth.health).toBe('unknown');
    expect(clockHealth.sampleCount).toBe(0);
  });

  it('returns healthy when max skew is below 1000ms', () => {
    const skewPoints = [makeSkewPoint(500), makeSkewPoint(-300)];
    const { clockHealth } = buildLogSummary(makeEmptyLog({ skewPoints }));
    expect(clockHealth.health).toBe('healthy');
    expect(clockHealth.maxSkewMs).toBe(500);
    expect(clockHealth.avgSkewMs).toBe(400); // (500+300)/2
    expect(clockHealth.sampleCount).toBe(2);
  });

  it('returns warning when max skew is between 1000 and 5000ms', () => {
    const skewPoints = [makeSkewPoint(2_000)];
    const { clockHealth } = buildLogSummary(makeEmptyLog({ skewPoints }));
    expect(clockHealth.health).toBe('warning');
  });

  it('returns error when max skew exceeds 5000ms', () => {
    const skewPoints = [makeSkewPoint(6_000)];
    const { clockHealth } = buildLogSummary(makeEmptyLog({ skewPoints }));
    expect(clockHealth.health).toBe('error');
  });

  it('uses absolute values for negative skew', () => {
    const skewPoints = [makeSkewPoint(-3_000)];
    const { clockHealth } = buildLogSummary(makeEmptyLog({ skewPoints }));
    expect(clockHealth.maxSkewMs).toBe(3_000);
    expect(clockHealth.health).toBe('warning');
  });
});

// ---------------------------------------------------------------------------
// buildLogSummary — contacts
// ---------------------------------------------------------------------------

describe('buildLogSummary — contacts', () => {
  it('returns unknown when no contacts', () => {
    const { contacts } = buildLogSummary(makeEmptyLog());
    expect(contacts.health).toBe('unknown');
    expect(contacts.total).toBe(0);
  });

  it('returns healthy with correct total', () => {
    const contactList = [makeContact('id-1', 'Contact 1'), makeContact('id-2', 'Contact 2')];
    const { contacts } = buildLogSummary(makeEmptyLog({ contacts: contactList }));
    expect(contacts.health).toBe('healthy');
    expect(contacts.total).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// buildLogSummary — softphoneHealth
// ---------------------------------------------------------------------------

describe('buildLogSummary — softphoneHealth', () => {
  it('returns unknown when no softphone reports', () => {
    const { softphoneHealth } = buildLogSummary(makeEmptyLog());
    expect(softphoneHealth.health).toBe('unknown');
    expect(softphoneHealth.callCount).toBe(0);
  });

  it('returns healthy when no failures and no packet loss', () => {
    const softphoneReports = [makeReport({ talkingTimeMs: 60_000 }), makeReport({ talkingTimeMs: 120_000 })];
    const softphoneMetrics = [makeMetric(0)];
    const { softphoneHealth } = buildLogSummary(makeEmptyLog({ softphoneMetrics, softphoneReports }));
    expect(softphoneHealth.health).toBe('healthy');
    expect(softphoneHealth.callCount).toBe(2);
    expect(softphoneHealth.avgTalkingMs).toBe(90_000);
    expect(softphoneHealth.failureCount).toBe(0);
    expect(softphoneHealth.packetLossDetected).toBe(false);
  });

  it('returns warning when packet loss is detected', () => {
    const softphoneReports = [makeReport()];
    const softphoneMetrics = [makeMetric(5)];
    const { softphoneHealth } = buildLogSummary(makeEmptyLog({ softphoneMetrics, softphoneReports }));
    expect(softphoneHealth.health).toBe('warning');
    expect(softphoneHealth.packetLossDetected).toBe(true);
  });

  it('returns error when any report has a failure flag', () => {
    const softphoneReports = [makeReport({ handshakingFailure: true })];
    const { softphoneHealth } = buildLogSummary(makeEmptyLog({ softphoneReports }));
    expect(softphoneHealth.health).toBe('error');
    expect(softphoneHealth.failureCount).toBe(1);
  });

  it('failure takes priority over packet loss for health status', () => {
    const softphoneReports = [makeReport({ iceCollectionFailure: true })];
    const softphoneMetrics = [makeMetric(10)];
    const { softphoneHealth } = buildLogSummary(makeEmptyLog({ softphoneMetrics, softphoneReports }));
    expect(softphoneHealth.health).toBe('error');
  });
});

// ---------------------------------------------------------------------------
// buildLogSummary — ccpLifecycle
// ---------------------------------------------------------------------------

describe('buildLogSummary — ccpLifecycle', () => {
  it('returns unknown when no lifecycle signals found', () => {
    const { ccpLifecycle } = buildLogSummary(makeEmptyLog());
    expect(ccpLifecycle.health).toBe('unknown');
    expect(ccpLifecycle.initialised).toBe(false);
    expect(ccpLifecycle.browser).toBe('');
    expect(ccpLifecycle.streamsVersion).toBe('');
    expect(ccpLifecycle.ccpVersion).toBe('');
    expect(ccpLifecycle.iframeInitTimeMs).toBeNull();
  });

  it('returns healthy when "Agent initialized" is found', () => {
    const entries = [makeEntry(1_000)];
    entries[0].text = 'Agent initialized';
    const { ccpLifecycle } = buildLogSummary(makeEmptyLog({ entries }));
    expect(ccpLifecycle.health).toBe('healthy');
    expect(ccpLifecycle.initialised).toBe(true);
  });

  it('parses iframe init time', () => {
    const entries = [makeEntry(1_000)];
    entries[0].text = 'Iframe initialization time 1732';
    const { ccpLifecycle } = buildLogSummary(makeEmptyLog({ entries }));
    expect(ccpLifecycle.iframeInitTimeMs).toBe(1732);
  });

  it('parses StreamsJS version', () => {
    const entries = [makeEntry(1_000)];
    entries[0].text = 'StreamsJS Version: 2.25.0';
    const { ccpLifecycle } = buildLogSummary(makeEmptyLog({ entries }));
    expect(ccpLifecycle.streamsVersion).toBe('2.25.0');
  });

  it('parses Inner/CCP Streams version', () => {
    const entries = [makeEntry(1_000)];
    entries[0].text = 'Inner/CCP Streams Version: 1.7.4 Outer/Public Streams Version: 2.25.0';
    const { ccpLifecycle } = buildLogSummary(makeEmptyLog({ entries }));
    expect(ccpLifecycle.ccpVersion).toBe('1.7.4');
  });

  it('parses browser name and version', () => {
    const entries = [makeEntry(1_000)];
    entries[0].text = 'Browser: Chrome Version: 147';
    const { ccpLifecycle } = buildLogSummary(makeEmptyLog({ entries }));
    expect(ccpLifecycle.browser).toBe('Chrome 147');
  });

  it('collects all signals from multiple entries', () => {
    const entries = [
      { ...makeEntry(1_000), text: 'Agent initialized' },
      { ...makeEntry(2_000), text: 'Iframe initialization time 876' },
      { ...makeEntry(3_000), text: 'StreamsJS Version: 2.25.0' },
      { ...makeEntry(4_000), text: 'Inner/CCP Streams Version: 1.7.4 Outer/Public Streams Version: 2.25.0' },
      { ...makeEntry(5_000), text: 'Browser: Chrome Version: 147' },
    ];
    const { ccpLifecycle } = buildLogSummary(makeEmptyLog({ entries }));
    expect(ccpLifecycle.health).toBe('healthy');
    expect(ccpLifecycle.initialised).toBe(true);
    expect(ccpLifecycle.iframeInitTimeMs).toBe(876);
    expect(ccpLifecycle.streamsVersion).toBe('2.25.0');
    expect(ccpLifecycle.ccpVersion).toBe('1.7.4');
    expect(ccpLifecycle.browser).toBe('Chrome 147');
  });
});

// ---------------------------------------------------------------------------
// buildLogSummary — webSocket
// ---------------------------------------------------------------------------

describe('buildLogSummary — webSocket', () => {
  it('returns unknown when no WebSocket events found', () => {
    const { webSocket } = buildLogSummary(makeEmptyLog());
    expect(webSocket.health).toBe('unknown');
    expect(webSocket.connectionOpenCount).toBe(0);
    expect(webSocket.connectionCloseCount).toBe(0);
    expect(webSocket.deepHeartbeatCount).toBe(0);
    expect(webSocket.scheduledReconnections).toBe(0);
  });

  it('returns healthy when connection opens are detected', () => {
    const entries = [{ ...makeEntry(1_000), text: 'Publishing event: webSocket::connection_open' }];
    const { webSocket } = buildLogSummary(makeEmptyLog({ entries }));
    expect(webSocket.health).toBe('healthy');
    expect(webSocket.connectionOpenCount).toBe(1);
  });

  it('returns healthy when heartbeats are detected', () => {
    const entries = [
      { ...makeEntry(1_000), text: '[web-socket.engine-web-socket]: WebSocket deep heartbeat success' },
      { ...makeEntry(2_000), text: '[web-socket.engine-web-socket]: WebSocket deep heartbeat success' },
    ];
    const { webSocket } = buildLogSummary(makeEmptyLog({ entries }));
    expect(webSocket.health).toBe('healthy');
    expect(webSocket.deepHeartbeatCount).toBe(2);
  });

  it('counts connection close events', () => {
    const entries = [
      { ...makeEntry(1_000), text: 'Publishing event: webSocket::connection_open' },
      { ...makeEntry(2_000), text: 'Publishing event: webSocket::connection_close' },
    ];
    const { webSocket } = buildLogSummary(makeEmptyLog({ entries }));
    expect(webSocket.connectionCloseCount).toBe(1);
  });

  it('counts scheduled reconnections', () => {
    const entries = [
      { ...makeEntry(1_000), text: 'Publishing event: webSocket::connection_open' },
      {
        ...makeEntry(2_000),
        text: '[web-socket.engine-web-socket]: DEBUG AMZ_WEB_SOCKET_MANAGER::Starting scheduled WebSocket manager reconnection',
      },
    ];
    const { webSocket } = buildLogSummary(makeEmptyLog({ entries }));
    expect(webSocket.scheduledReconnections).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// buildLogSummary — overallHealth
// ---------------------------------------------------------------------------

describe('buildLogSummary — overallHealth', () => {
  it('returns unknown when all sections are unknown', () => {
    const { overallHealth } = buildLogSummary(makeEmptyLog());
    expect(overallHealth).toBe('unknown');
  });

  it('returns healthy when all active sections are healthy', () => {
    const log = makeEmptyLog({
      apiLatency: [makeLatencyPoint('api', 100)],
      contacts: [makeContact('id', 'Contact 1')],
      entries: [
        { ...makeEntry(1_000), text: 'Agent initialized' },
        { ...makeEntry(2_000), text: 'Publishing event: webSocket::connection_open' },
      ],
      skewPoints: [makeSkewPoint(100)],
      snapshots: [makeSnapshot(1_000, 'Available')],
      softphoneReports: [makeReport()],
    });
    const { overallHealth } = buildLogSummary(log);
    expect(overallHealth).toBe('healthy');
  });

  it('returns warning when any section is warning', () => {
    const log = makeEmptyLog({
      skewPoints: [makeSkewPoint(2_000)], // warning
      snapshots: [makeSnapshot(1_000, 'Available')], // healthy
    });
    const { overallHealth } = buildLogSummary(log);
    expect(overallHealth).toBe('warning');
  });

  it('returns error when any section is error', () => {
    const log = makeEmptyLog({
      skewPoints: [makeSkewPoint(6_000)], // error
      snapshots: [makeSnapshot(1_000, 'Available')], // healthy
    });
    const { overallHealth } = buildLogSummary(log);
    expect(overallHealth).toBe('error');
  });

  it('returns healthy when some sections are unknown but at least one is healthy', () => {
    const log = makeEmptyLog({
      snapshots: [makeSnapshot(1_000, 'Available')], // healthy; rest are unknown
    });
    const { overallHealth } = buildLogSummary(log);
    expect(overallHealth).toBe('healthy');
  });
});
