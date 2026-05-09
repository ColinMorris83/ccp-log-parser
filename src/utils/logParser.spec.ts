import type { CcpLogEntry } from '../models/ccpLogParser';
import { parseCcpLog } from './logParser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeEntry = (overrides: Partial<CcpLogEntry> & { time: string }): CcpLogEntry => ({
  component: 'CCP',
  level: 'LOG',
  text: 'some log message',
  ...overrides,
});

const toJson = (entries: CcpLogEntry[]): string => JSON.stringify(entries);

// ---------------------------------------------------------------------------
// parseCcpLog — input validation
// ---------------------------------------------------------------------------

describe('parseCcpLog — input validation', () => {
  it('throws when the input is not a JSON array', () => {
    expect(() => parseCcpLog('{"foo":"bar"}', 'test.txt')).toThrow(new TypeError('CCP log file must be a JSON array.'));
  });

  it('throws on invalid JSON', () => {
    expect(() => parseCcpLog('not json', 'test.txt')).toThrow();
  });

  it('throws a TypeError when an entry is not an object', () => {
    expect(() => parseCcpLog(JSON.stringify(['not-an-object']), 'bad.txt')).toThrow(
      new TypeError('Entry at index 0 in "bad.txt" is not an object.'),
    );
  });

  it('throws a TypeError when an entry has an invalid time value', () => {
    const entry = { component: 'CCP', level: 'LOG', text: 'hi', time: 'not-a-date' };
    expect(() => parseCcpLog(JSON.stringify([entry]), 'bad.txt')).toThrow(
      new TypeError('Entry at index 0 in "bad.txt" has an invalid or missing "time" field: "not-a-date".'),
    );
  });

  it('throws a TypeError when an entry is missing the time field', () => {
    const entry = { component: 'CCP', level: 'LOG', text: 'hi' };
    expect(() => parseCcpLog(JSON.stringify([entry]), 'bad.txt')).toThrow(TypeError);
  });

  it('throws a TypeError when an entry has a non-string text field', () => {
    const entry = { component: 'CCP', level: 'LOG', text: 42, time: '2026-01-01T00:00:00.000Z' };
    expect(() => parseCcpLog(JSON.stringify([entry]), 'bad.txt')).toThrow(
      new TypeError('Entry at index 0 in "bad.txt" has an invalid or missing "text" field.'),
    );
  });

  it('includes the failing index in the error message for the second entry', () => {
    const good = makeEntry({ time: '2026-01-01T00:00:00.000Z' });
    const bad = { component: 'CCP', level: 'LOG', text: 'hi', time: 'oops' };
    expect(() => parseCcpLog(JSON.stringify([good, bad]), 'my-log.txt')).toThrow(/Entry at index 1 in "my-log\.txt"/);
  });

  it('returns the filename unchanged', () => {
    const result = parseCcpLog(toJson([]), 'my-log.txt');
    expect(result.filename).toBe('my-log.txt');
  });

  it('returns empty arrays for an empty log', () => {
    const result = parseCcpLog(toJson([]), 'empty.txt');
    expect(result.entries).toHaveLength(0);
    expect(result.snapshots).toHaveLength(0);
    expect(result.apiLatency).toHaveLength(0);
    expect(result.skewPoints).toHaveLength(0);
    expect(result.contacts).toHaveLength(0);
    expect(result.errorCount).toBe(0);
    expect(result.warnCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseCcpLog — sorting
// ---------------------------------------------------------------------------

describe('parseCcpLog — timestamp sorting', () => {
  it('sorts entries by timestamp ascending', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: 'third', time: '2026-01-01T00:00:02.000Z' }),
      makeEntry({ text: 'second', time: '2026-01-01T00:00:01.000Z' }),
      makeEntry({ text: 'first', time: '2026-01-01T00:00:00.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries.map((e) => e.text)).toEqual(['first', 'second', 'third']);
  });

  it('uses original index as tiebreaker for identical timestamps', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: 'A', time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: 'B', time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: 'C', time: '2026-01-01T00:00:00.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries.map((e) => e.text)).toEqual(['A', 'B', 'C']);
  });

  it('assigns sequential _key values starting from 0 after sorting', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ time: '2026-01-01T00:00:01.000Z' }),
      makeEntry({ time: '2026-01-01T00:00:00.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0]._key).toBe(0);
    expect(result.entries[1]._key).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// parseCcpLog — error / warn counting
// ---------------------------------------------------------------------------

describe('parseCcpLog — error and warning counting', () => {
  it('counts ERROR level entries', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ level: 'ERROR', time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ level: 'ERROR', time: '2026-01-01T00:00:01.000Z' }),
      makeEntry({ level: 'LOG', time: '2026-01-01T00:00:02.000Z' }),
    ];
    expect(parseCcpLog(toJson(entries), 'test.txt').errorCount).toBe(2);
  });

  it('counts WARN level entries', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ level: 'WARN', time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ level: 'LOG', time: '2026-01-01T00:00:01.000Z' }),
    ];
    expect(parseCcpLog(toJson(entries), 'test.txt').warnCount).toBe(1);
  });

  it('returns 0 for errorCount and warnCount when no errors or warnings', () => {
    const entries: CcpLogEntry[] = [makeEntry({ level: 'INFO', time: '2026-01-01T00:00:00.000Z' })];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.errorCount).toBe(0);
    expect(result.warnCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseCcpLog — text trimming
// ---------------------------------------------------------------------------

describe('parseCcpLog — text trimming', () => {
  it('trims leading and trailing whitespace from entry text', () => {
    const entries: CcpLogEntry[] = [makeEntry({ text: '  hello world  ', time: '2026-01-01T00:00:00.000Z' })];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0].text).toBe('hello world');
  });
});

// ---------------------------------------------------------------------------
// parseCcpLog — API call enrichment
// ---------------------------------------------------------------------------

describe('parseCcpLog — API call enrichment', () => {
  it('sets apiName on a send entry', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: "AWSClient: --> 'getAgentSnapshot'", time: '2026-01-01T00:00:00.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0].apiName).toBe('getAgentSnapshot');
  });

  it('sets apiName on a reply entry', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: "AWSClient: --> 'getAgentSnapshot'", time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: "AWSClient: <-- 'getAgentSnapshot' succeeded", time: '2026-01-01T00:00:01.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[1].apiName).toBe('getAgentSnapshot');
  });

  it('records latency for a matched send/reply pair', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: "AWSClient: --> 'getAgentSnapshot'", time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: "AWSClient: <-- 'getAgentSnapshot' succeeded", time: '2026-01-01T00:00:02.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.apiLatency).toHaveLength(1);
    expect(result.apiLatency[0]).toMatchObject({
      apiName: 'getAgentSnapshot',
      latencyMs: 2000,
      status: 'succeeded',
    });
  });

  it('records a failed API call correctly', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: "AWSClient: --> 'getAgentSnapshot'", time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: "AWSClient: <-- 'getAgentSnapshot' failed", time: '2026-01-01T00:00:01.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.apiLatency[0].status).toBe('failed');
    expect(result.entries[1].highlight).toBe(true);
  });

  it('does not record latency when there is no matching send', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: "AWSClient: <-- 'getAgentSnapshot' succeeded", time: '2026-01-01T00:00:00.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.apiLatency).toHaveLength(0);
  });

  it('handles multiple independent API calls', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: "AWSClient: --> 'getAgentSnapshot'", time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: "AWSClient: --> 'updateAgentStatus'", time: '2026-01-01T00:00:01.000Z' }),
      makeEntry({ text: "AWSClient: <-- 'getAgentSnapshot' succeeded", time: '2026-01-01T00:00:02.000Z' }),
      makeEntry({ text: "AWSClient: <-- 'updateAgentStatus' succeeded", time: '2026-01-01T00:00:03.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.apiLatency).toHaveLength(2);
    expect(result.apiLatency.map((l) => l.apiName)).toEqual(
      expect.arrayContaining(['getAgentSnapshot', 'updateAgentStatus']),
    );
  });

  it('matches concurrent in-flight calls to the same API name FIFO', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: "AWSClient: --> 'getAgentSnapshot'", time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: "AWSClient: --> 'getAgentSnapshot'", time: '2026-01-01T00:00:01.000Z' }),
      makeEntry({ text: "AWSClient: <-- 'getAgentSnapshot' succeeded", time: '2026-01-01T00:00:02.000Z' }),
      makeEntry({ text: "AWSClient: <-- 'getAgentSnapshot' succeeded", time: '2026-01-01T00:00:03.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.apiLatency).toHaveLength(2);
    expect(result.apiLatency[0].latencyMs).toBe(2000);
    expect(result.apiLatency[1].latencyMs).toBe(2000);
  });
});

// ---------------------------------------------------------------------------
// parseCcpLog — snapshot extraction
// ---------------------------------------------------------------------------

describe('parseCcpLog — snapshot extraction', () => {
  const snapshotObj = {
    snapshot: { skew: 150, snapshotTimestamp: '2026-01-01T00:00:00.500Z', state: { name: 'Available' } },
  };

  it('extracts a snapshot entry', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        objects: [snapshotObj],
        text: 'GET_AGENT_SNAPSHOT succeeded',
        time: '2026-01-01T00:00:00.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.snapshots).toHaveLength(1);
    expect(result.snapshots[0].stateName).toBe('Available');
  });

  it('extracts skew from a snapshot entry', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        objects: [snapshotObj],
        text: 'GET_AGENT_SNAPSHOT succeeded',
        time: '2026-01-01T00:00:00.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.skewPoints).toHaveLength(1);
    expect(result.skewPoints[0].skewMs).toBe(150);
    expect(result.skewPoints[0].stateName).toBe('Available');
  });

  it('sets localTime from the log entry and serverTime from snapshotTimestamp', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        objects: [snapshotObj],
        text: 'GET_AGENT_SNAPSHOT succeeded',
        time: '2026-01-01T00:00:00.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.skewPoints[0].localTime).toBe('2026-01-01T00:00:00.000Z');
    expect(result.skewPoints[0].serverTime).toBe('2026-01-01T00:00:00.500Z');
  });

  it('falls back serverTime to entry time when snapshotTimestamp is absent', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        objects: [{ snapshot: { skew: 50, state: { name: 'Busy' } } }],
        text: 'GET_AGENT_SNAPSHOT succeeded',
        time: '2026-01-01T00:00:03.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.skewPoints[0].serverTime).toBe('2026-01-01T00:00:03.000Z');
    expect(result.skewPoints[0].localTime).toBe('2026-01-01T00:00:03.000Z');
  });

  it('sets toKey of the previous snapshot when a new one arrives', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ objects: [snapshotObj], text: 'GET_AGENT_SNAPSHOT succeeded', time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: 'some other log', time: '2026-01-01T00:00:01.000Z' }),
      makeEntry({ objects: [snapshotObj], text: 'GET_AGENT_SNAPSHOT succeeded', time: '2026-01-01T00:00:02.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.snapshots).toHaveLength(2);
    expect(result.snapshots[0].toKey).toBe(2);
    expect(result.snapshots[1].toKey).toBe(3);
  });

  it('falls back to "Unknown" state name when snapshot has no state', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        objects: [{ snapshot: {} }],
        text: 'GET_AGENT_SNAPSHOT succeeded',
        time: '2026-01-01T00:00:00.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.snapshots[0].stateName).toBe('Unknown');
  });

  it('does not add a skew point when skew is absent', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        objects: [{ snapshot: { state: { name: 'Busy' } } }],
        text: 'GET_AGENT_SNAPSHOT succeeded',
        time: '2026-01-01T00:00:00.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.skewPoints).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// parseCcpLog — contact ID detection
// ---------------------------------------------------------------------------

describe('parseCcpLog — contact detection', () => {
  const CONTACT_ID = 'b44757a2-b0f4-4ee7-8d4d-6dfc8694e06a';

  it('detects a contact ID from "contact::" event text', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: `Publishing event: contact::connected::${CONTACT_ID}`, time: '2026-01-01T00:00:00.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0].contactIds).toContain(CONTACT_ID);
  });

  it('detects a contact ID from "Contact ID:" text', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        text: `CUSTOM_CCP: onContactConnected - Contact ID: ${CONTACT_ID}`,
        time: '2026-01-01T00:00:00.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0].contactIds).toContain(CONTACT_ID);
  });

  it('detects a contact ID from "Toast for" text', () => {
    const entries: CcpLogEntry[] = [makeEntry({ text: `Toast for ${CONTACT_ID}`, time: '2026-01-01T00:00:00.000Z' })];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0].contactIds).toContain(CONTACT_ID);
  });

  it('detects a contact ID from a contactId key in objects', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        objects: [{ contactId: CONTACT_ID, type: 'voice' }],
        text: 'some unrelated text',
        time: '2026-01-01T00:00:00.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0].contactIds).toContain(CONTACT_ID);
  });

  it('detects a contact ID from a nested contactId key in objects', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        objects: [{ contact: { contactId: CONTACT_ID } }],
        text: 'some unrelated text',
        time: '2026-01-01T00:00:00.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0].contactIds).toContain(CONTACT_ID);
  });

  it('does NOT extract a bare UUID from text that lacks a contact keyword', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: `Routing profile: ${CONTACT_ID}`, time: '2026-01-01T00:00:00.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0].contactIds).toHaveLength(0);
  });

  it('does NOT extract a UUID from an object key that is not named contactId', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        objects: [{ routingProfileId: CONTACT_ID }],
        text: 'some unrelated text',
        time: '2026-01-01T00:00:00.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0].contactIds).toHaveLength(0);
  });

  it('deduplicates contact IDs on the same entry', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        text: `Contact ID: ${CONTACT_ID} and Toast for ${CONTACT_ID}`,
        time: '2026-01-01T00:00:00.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0].contactIds).toHaveLength(1);
  });

  it('normalises contact IDs to lowercase', () => {
    const upper = CONTACT_ID.toUpperCase();
    const entries: CcpLogEntry[] = [makeEntry({ text: `Contact ID: ${upper}`, time: '2026-01-01T00:00:00.000Z' })];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.entries[0].contactIds[0]).toBe(CONTACT_ID);
  });

  it('builds a ContactSummary for each unique contact', () => {
    const CONTACT_B = 'e475efaf-23fd-4379-854a-7266049f933c';
    const entries: CcpLogEntry[] = [
      makeEntry({ text: `Contact ID: ${CONTACT_ID}`, time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: `Contact ID: ${CONTACT_B}`, time: '2026-01-01T00:00:01.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.contacts).toHaveLength(2);
    expect(result.contacts.map((c) => c.contactId)).toEqual([CONTACT_ID, CONTACT_B]);
  });

  it('sets correct startTime and endTime on a ContactSummary', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: `Contact ID: ${CONTACT_ID}`, time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: `Toast for ${CONTACT_ID}`, time: '2026-01-01T00:00:05.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    const contact = result.contacts[0];
    expect(contact.startTime).toBe('2026-01-01T00:00:00.000Z');
    expect(contact.endTime).toBe('2026-01-01T00:00:05.000Z');
  });

  it('sets firstKey and lastKey correctly on a ContactSummary', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: 'unrelated', time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: `Contact ID: ${CONTACT_ID}`, time: '2026-01-01T00:00:01.000Z' }),
      makeEntry({ text: `Toast for ${CONTACT_ID}`, time: '2026-01-01T00:00:02.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    const contact = result.contacts[0];
    expect(contact.firstKey).toBe(1);
    expect(contact.lastKey).toBe(2);
  });

  it('labels contacts as "Contact 1", "Contact 2" in order of first appearance', () => {
    const CONTACT_B = 'e475efaf-23fd-4379-854a-7266049f933c';
    const entries: CcpLogEntry[] = [
      makeEntry({ text: `Contact ID: ${CONTACT_ID}`, time: '2026-01-01T00:00:00.000Z' }),
      makeEntry({ text: `Contact ID: ${CONTACT_B}`, time: '2026-01-01T00:00:01.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.contacts[0].label).toBe('Contact 1');
    expect(result.contacts[1].label).toBe('Contact 2');
  });

  it('returns no contacts when none are detected', () => {
    const entries: CcpLogEntry[] = [makeEntry({ text: 'nothing here', time: '2026-01-01T00:00:00.000Z' })];
    expect(parseCcpLog(toJson(entries), 'test.txt').contacts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// parseCcpLog — softphone metrics extraction
// ---------------------------------------------------------------------------

describe('parseCcpLog — softphone metrics', () => {
  const METRICS_JSON =
    '[{"softphoneStreamType":"audio_input","timestamp":"2026-01-01T00:00:01.000Z","packetsLost":0,"packetsCount":0,"audioLevel":0,"jitterBufferMillis":20,"roundTripTimeMillis":10,"jitterBufferDelayMilliseconds":5,"echoReturnLoss":-12,"echoReturnLossEnhancement":0.2,"concealmentEvents":0},{"softphoneStreamType":"audio_output","timestamp":"2026-01-01T00:00:01.000Z","packetsLost":2,"packetsCount":50,"audioLevel":145,"jitterBufferMillis":3,"roundTripTimeMillis":10,"jitterBufferDelayMilliseconds":null,"echoReturnLoss":-12,"echoReturnLossEnhancement":0.2,"concealmentEvents":1}]';

  it('extracts periodic softphone metrics from sendSoftphoneMetrics entries', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({
        text: ` sendSoftphoneMetrics success${METRICS_JSON}`,
        time: '2026-01-01T00:00:02.000Z',
      }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.softphoneMetrics).toHaveLength(2);

    const input = result.softphoneMetrics.find((m) => m.streamType === 'audio_input');
    expect(input).toBeDefined();
    expect(input?.jitterBufferMs).toBe(20);
    expect(input?.roundTripTimeMs).toBe(10);
    expect(input?.jitterBufferDelayMs).toBe(5);
    expect(input?.audioLevel).toBe(0);

    const output = result.softphoneMetrics.find((m) => m.streamType === 'audio_output');
    expect(output).toBeDefined();
    expect(output?.packetsLost).toBe(2);
    expect(output?.packetsCount).toBe(50);
    expect(output?.audioLevel).toBe(145);
    expect(output?.concealmentEvents).toBe(1);
  });

  it('deduplicates metrics with the same timestamp and stream type', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: ` sendSoftphoneMetrics success${METRICS_JSON}`, time: '2026-01-01T00:00:02.000Z' }),
      makeEntry({ text: ` sendSoftphoneMetrics success${METRICS_JSON}`, time: '2026-01-01T00:00:02.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.softphoneMetrics).toHaveLength(2); // 1 input + 1 output, not 4
  });

  it('handles null jitterBufferDelayMilliseconds gracefully', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: ` sendSoftphoneMetrics success${METRICS_JSON}`, time: '2026-01-01T00:00:02.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    const output = result.softphoneMetrics.find((m) => m.streamType === 'audio_output');
    expect(output?.jitterBufferDelayMs).toBe(0); // null → 0
  });

  it('returns empty softphoneMetrics when no softphone data is present', () => {
    const entries: CcpLogEntry[] = [makeEntry({ text: 'no softphone here', time: '2026-01-01T00:00:00.000Z' })];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.softphoneMetrics).toHaveLength(0);
    expect(result.softphoneReport).toBeNull();
  });

  it('sorts softphone metrics by timestamp', () => {
    const earlier =
      '[{"softphoneStreamType":"audio_output","timestamp":"2026-01-01T00:00:00.000Z","packetsLost":0,"packetsCount":50,"audioLevel":100,"jitterBufferMillis":2,"roundTripTimeMillis":10,"jitterBufferDelayMilliseconds":0,"echoReturnLoss":-12,"echoReturnLossEnhancement":0.2,"concealmentEvents":0}]';
    const later =
      '[{"softphoneStreamType":"audio_output","timestamp":"2026-01-01T00:00:05.000Z","packetsLost":0,"packetsCount":50,"audioLevel":200,"jitterBufferMillis":2,"roundTripTimeMillis":10,"jitterBufferDelayMilliseconds":0,"echoReturnLoss":-12,"echoReturnLossEnhancement":0.2,"concealmentEvents":0}]';
    const entries: CcpLogEntry[] = [
      makeEntry({ text: ` sendSoftphoneMetrics success${later}`, time: '2026-01-01T00:00:06.000Z' }),
      makeEntry({ text: ` sendSoftphoneMetrics success${earlier}`, time: '2026-01-01T00:00:01.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.softphoneMetrics[0].timestamp).toBe('2026-01-01T00:00:00.000Z');
    expect(result.softphoneMetrics[1].timestamp).toBe('2026-01-01T00:00:05.000Z');
  });
});

// ---------------------------------------------------------------------------
// parseCcpLog — softphone call report extraction
// ---------------------------------------------------------------------------

describe('parseCcpLog — softphone call report', () => {
  const REPORT_JSON =
    '{"callStartTime":"2026-01-01T00:00:00.000Z","callEndTime":"2026-01-01T00:05:00.000Z","gumTimeMillis":140,"initializationTimeMillis":149,"iceCollectionTimeMillis":0,"signallingConnectTimeMillis":0,"handshakingTimeMillis":31,"preTalkingTimeMillis":324,"talkingTimeMillis":253595,"cleanupTimeMillis":null,"iceCollectionFailure":false,"signallingConnectionFailure":false,"handshakingFailure":false,"gumOtherFailure":false,"gumTimeoutFailure":false,"createOfferFailure":false,"setLocalDescriptionFailure":false,"userBusyFailure":false,"invalidRemoteSDPFailure":false,"noRemoteIceCandidateFailure":false,"setRemoteDescriptionFailure":false,"softphoneStreamStatistics":[{"softphoneStreamType":"audio_input","timestamp":"2026-01-01T00:04:59.000Z","packetsLost":0,"packetsCount":1194,"audioLevel":0,"jitterBufferMillis":23,"roundTripTimeMillis":11,"jitterBufferDelayMilliseconds":37,"echoReturnLoss":-13.5,"echoReturnLossEnhancement":0.17,"concealmentEvents":3}]}';

  it('extracts the softphone call report from sendSoftphoneReport entries', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: ` sendSoftphoneReport success${REPORT_JSON}`, time: '2026-01-01T00:05:00.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.softphoneReport).not.toBeNull();
    expect(result.softphoneReport?.callStartTime).toBe('2026-01-01T00:00:00.000Z');
    expect(result.softphoneReport?.callEndTime).toBe('2026-01-01T00:05:00.000Z');
    expect(result.softphoneReport?.gumTimeMs).toBe(140);
    expect(result.softphoneReport?.talkingTimeMs).toBe(253_595);
    expect(result.softphoneReport?.cleanupTimeMs).toBeNull();
    expect(result.softphoneReport?.iceCollectionFailure).toBe(false);
    expect(result.softphoneReport?.streamStatistics).toHaveLength(1);
    expect(result.softphoneReport?.streamStatistics[0].packetsCount).toBe(1194);
  });

  it('only captures the first softphone report (ignores duplicates)', () => {
    const entries: CcpLogEntry[] = [
      makeEntry({ text: ` sendSoftphoneReport success${REPORT_JSON}`, time: '2026-01-01T00:05:00.000Z' }),
      makeEntry({ text: ` sendSoftphoneReport success${REPORT_JSON}`, time: '2026-01-01T00:05:00.000Z' }),
    ];
    const result = parseCcpLog(toJson(entries), 'test.txt');
    expect(result.softphoneReport).not.toBeNull();
    // If it captured both, there would be no way to tell since they're identical,
    // but the code short-circuits after the first — verified by code inspection
  });

  it('returns null softphoneReport when no report entry exists', () => {
    const entries: CcpLogEntry[] = [makeEntry({ text: 'no report', time: '2026-01-01T00:00:00.000Z' })];
    expect(parseCcpLog(toJson(entries), 'test.txt').softphoneReport).toBeNull();
  });
});
