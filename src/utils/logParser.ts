import type {
  AgentSnapshot,
  ApiLatencyPoint,
  CcpLogEntry,
  ContactSummary,
  EnrichedLogEntry,
  ParsedCcpLog,
  SkewPoint,
  SoftphoneCallReport,
  SoftphoneMetricPoint,
  SoftphoneStreamType,
} from '../models/ccpLogParser';

/**
 * Regex patterns used to enrich raw log text with structured data.
 */
const API_CALL_RE = /AWSClient:\s*-->\s*(?:Calling operation\s*)?'(\w+)'/;
const API_REPLY_RE = /AWSClient:\s*<--\s*(?:Operation\s*)?'(\w+)'\s*(succeeded|failed)/;
const SNAPSHOT_GET_RE = /GET_AGENT_SNAPSHOT\s+succeeded/i;
/** Matches periodic softphone metrics: "sendSoftphoneMetrics success[...]" */
const SOFTPHONE_METRICS_RE = /sendSoftphoneMetrics\s+success(\[.+)$/;
/** Matches end-of-call softphone report: "sendSoftphoneReport success{...}" */
const SOFTPHONE_REPORT_RE = /sendSoftphoneReport\s+success(\{.+)$/;
/** UUID capture group string (used inside larger regexes) */
const UUID_CAP = '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})';
/** Matches a standalone UUID — used for quick object-value checks */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Regex patterns that capture a contact ID UUID from the log text field.
 * Each regex has exactly one capture group containing the UUID.
 */
const CONTACT_ID_TEXT_RES = [
  // "Publishing event: contact::connected::b44757a2-..."
  new RegExp(String.raw`contact::[^:\s]+::${UUID_CAP}`, 'gi'),
  // "Contact ID: b44757a2-..."
  new RegExp(String.raw`Contact ID:\s*${UUID_CAP}`, 'gi'),
  // "Toast for b44757a2-..."
  new RegExp(String.raw`Toast for ${UUID_CAP}`, 'gi'),
  // "Chat Session Successfully established for contactId b44757a2-..." or "contactId":"b44757a2-..."
  new RegExp(String.raw`contactId['":\s]+${UUID_CAP}`, 'gi'),
];

/**
 * Shape of the snapshot object stored in a GET_AGENT_SNAPSHOT log entry's objects array.
 */
interface SnapshotObject {
  snapshot?: {
    skew?: number;
    snapshotTimestamp?: string;
    state?: {
      name?: string;
    };
  };
}

/**
 * Raw softphone stream metric as found in the CCP log JSON.
 */
interface RawSoftphoneStream {
  audioLevel?: number;
  concealmentEvents?: number;
  echoReturnLoss?: number;
  echoReturnLossEnhancement?: number;
  jitterBufferDelayMilliseconds?: null | number;
  jitterBufferMillis?: number;
  packetsCount?: number;
  packetsLost?: number;
  roundTripTimeMillis?: number;
  softphoneStreamType?: string;
  timestamp?: string;
}

/**
 * Raw softphone call report as found in the CCP log JSON.
 */
interface RawSoftphoneReport {
  callEndTime?: string;
  callStartTime?: string;
  cleanupTimeMillis?: null | number;
  createOfferFailure?: boolean;
  gumOtherFailure?: boolean;
  gumTimeMillis?: number;
  gumTimeoutFailure?: boolean;
  handshakingFailure?: boolean;
  handshakingTimeMillis?: number;
  iceCollectionFailure?: boolean;
  iceCollectionTimeMillis?: number;
  initializationTimeMillis?: number;
  invalidRemoteSDPFailure?: boolean;
  noRemoteIceCandidateFailure?: boolean;
  preTalkingTimeMillis?: number;
  setLocalDescriptionFailure?: boolean;
  setRemoteDescriptionFailure?: boolean;
  signallingConnectionFailure?: boolean;
  signallingConnectTimeMillis?: number;
  softphoneStreamStatistics?: RawSoftphoneStream[];
  talkingTimeMillis?: number;
  userBusyFailure?: boolean;
}

/**
 * Maps a raw softphone stream metric to the normalised SoftphoneMetricPoint shape.
 *
 * @param raw - Raw stream metric from CCP log JSON.
 * @returns Normalised metric point.
 */
const mapStreamMetric = (raw: RawSoftphoneStream): SoftphoneMetricPoint => ({
  audioLevel: raw.audioLevel ?? 0,
  concealmentEvents: raw.concealmentEvents ?? 0,
  echoReturnLoss: raw.echoReturnLoss ?? 0,
  echoReturnLossEnhancement: raw.echoReturnLossEnhancement ?? 0,
  jitterBufferDelayMs: raw.jitterBufferDelayMilliseconds ?? 0,
  jitterBufferMs: raw.jitterBufferMillis ?? 0,
  packetsCount: raw.packetsCount ?? 0,
  packetsLost: raw.packetsLost ?? 0,
  roundTripTimeMs: raw.roundTripTimeMillis ?? 0,
  streamType: (raw.softphoneStreamType ?? 'audio_output') as SoftphoneStreamType,
  timestamp: raw.timestamp ?? '',
});

/**
 * Recursively walks an object/array, collecting values of any key named `contactId`
 * that are valid UUID strings.
 *
 * @param obj - Arbitrary value from the log entry's objects array.
 * @returns Array of lowercase contact ID UUIDs found.
 */
const collectContactIdsFromObject = (obj: unknown): string[] => {
  if (!obj || typeof obj !== 'object') return [];
  const results: string[] = [];
  if (Array.isArray(obj)) {
    for (const item of obj) results.push(...collectContactIdsFromObject(item));
  } else {
    const record = obj as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      if (key === 'contactId' && typeof value === 'string' && UUID_RE.test(value)) {
        results.push(value.toLowerCase());
      }
      results.push(...collectContactIdsFromObject(value));
    }
  }
  return results;
};

/**
 * Extracts contact ID UUIDs from a log entry using targeted patterns.
 *
 * @param entry - The raw log entry to scan.
 * @returns Deduplicated array of lowercase contact ID UUIDs.
 */
const extractContactIds = (entry: CcpLogEntry): string[] => {
  const ids: string[] = [];

  for (const re of CONTACT_ID_TEXT_RES) {
    re.lastIndex = 0;
    let m: null | RegExpExecArray;
    while ((m = re.exec(entry.text)) !== null) {
      ids.push(m[1].toLowerCase());
    }
  }

  ids.push(...collectContactIdsFromObject(entry.objects));

  return [...new Set(ids)];
};

/**
 * Builds a ContactSummary list by identifying which UUIDs are contact IDs.
 *
 * @param entries - All enriched entries (with contactIds already assigned).
 * @returns Sorted list of ContactSummary (earliest first).
 */
const buildContactSummaries = (entries: EnrichedLogEntry[]): ContactSummary[] => {
  const contactMeta = new Map<string, { endTime: string; firstKey: number; lastKey: number; startTime: string }>();

  for (const entry of entries) {
    for (const cid of entry.contactIds) {
      const existing = contactMeta.get(cid);
      if (existing) {
        existing.lastKey = entry._key;
        existing.endTime = entry.time;
      } else {
        contactMeta.set(cid, { endTime: entry.time, firstKey: entry._key, lastKey: entry._key, startTime: entry.time });
      }
    }
  }

  return [...contactMeta.entries()]
    .sort((a, b) => a[1].firstKey - b[1].firstKey)
    .map(([contactId, meta], i) => ({
      contactId,
      endTime: meta.endTime,
      firstKey: meta.firstKey,
      label: `Contact ${String(i + 1)}`,
      lastKey: meta.lastKey,
      startTime: meta.startTime,
    }));
};

/**
 * Parses a raw CCP log JSON string into an enriched, structured ParsedCcpLog.
 *
 * @param raw - Raw file contents as a string.
 * @param filename - The original filename (for display).
 * @returns A fully enriched ParsedCcpLog ready for rendering.
 */
export const parseCcpLog = (raw: string, filename: string): ParsedCcpLog => {
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new TypeError('CCP log file must be a JSON array.');
  }

  for (const [idx, entry] of (parsed as unknown[]).entries()) {
    if (!entry || typeof entry !== 'object') {
      throw new TypeError(`Entry at index ${String(idx)} in "${filename}" is not an object.`);
    }
    const e = entry as Record<string, unknown>;
    if (typeof e.time !== 'string' || Number.isNaN(new Date(e.time).getTime())) {
      throw new TypeError(
        `Entry at index ${String(idx)} in "${filename}" has an invalid or missing "time" field: ${JSON.stringify(e.time)}.`,
      );
    }
    if (typeof e.text !== 'string') {
      throw new TypeError(`Entry at index ${String(idx)} in "${filename}" has an invalid or missing "text" field.`);
    }
  }

  const rawEntries = parsed as CcpLogEntry[];

  const sorted = rawEntries
    .map((entry, idx) => ({ ...entry, _oriKey: idx, _ts: new Date(entry.time).getTime() }))
    .sort((a, b) => (a._ts === b._ts ? a._oriKey - b._oriKey : a._ts - b._ts));

  const entries: EnrichedLogEntry[] = [];
  const snapshots: AgentSnapshot[] = [];
  const apiLatency: ApiLatencyPoint[] = [];
  const skewPoints: SkewPoint[] = [];
  const softphoneMetrics: SoftphoneMetricPoint[] = [];
  let softphoneReport: null | SoftphoneCallReport = null;
  /** Tracks seen softphone metric timestamps to deduplicate (logs often contain duplicates) */
  const seenMetricTimestamps = new Set<string>();

  const pendingSends = new Map<string, { _key: number; _ts: number }[]>();

  let errorCount = 0;
  let warnCount = 0;

  for (const [idx, raw] of sorted.entries()) {
    const entry: EnrichedLogEntry = { ...raw, _key: idx, contactIds: [], text: raw.text.trim() };

    entry.contactIds = extractContactIds(raw);

    if (entry.level === 'ERROR') errorCount++;
    if (entry.level === 'WARN') warnCount++;

    const callMatch = API_CALL_RE.exec(entry.text);
    if (callMatch) {
      const apiName = callMatch[1];
      entry.apiName = apiName;
      const queue = pendingSends.get(apiName);
      if (queue) {
        queue.push({ _key: idx, _ts: entry._ts });
      } else {
        pendingSends.set(apiName, [{ _key: idx, _ts: entry._ts }]);
      }
    }

    const replyMatch = API_REPLY_RE.exec(entry.text);
    if (replyMatch) {
      const apiName = replyMatch[1];
      const status = replyMatch[2] as 'failed' | 'succeeded';
      entry.apiName = apiName;
      entry.highlight = status === 'failed';
      const queue = pendingSends.get(apiName);
      const send = queue?.shift();
      if (send) {
        apiLatency.push({
          _ts: send._ts,
          apiName,
          latencyMs: entry._ts - send._ts,
          status,
        });
        if (queue?.length === 0) pendingSends.delete(apiName);
      }
    }

    if (SNAPSHOT_GET_RE.test(entry.text)) {
      const snapshotObj = (entry.objects?.[0] as SnapshotObject | undefined)?.snapshot;
      const stateName = snapshotObj?.state?.name ?? 'Unknown';
      const skew = snapshotObj?.skew;

      const lastSnapshot = snapshots.at(-1);
      if (lastSnapshot) {
        lastSnapshot.toKey = idx;
      }

      snapshots.push({
        _ts: entry._ts,
        fromKey: idx,
        stateName,
        time: entry.time,
        toKey: sorted.length,
      });

      if (typeof skew === 'number') {
        skewPoints.push({
          _ts: entry._ts,
          localTime: entry.time,
          serverTime: snapshotObj?.snapshotTimestamp ?? entry.time,
          skewMs: skew,
          stateName,
        });
      }
    }

    // Extract periodic softphone metrics
    const metricsMatch = SOFTPHONE_METRICS_RE.exec(entry.text);
    if (metricsMatch) {
      try {
        const rawStreams = JSON.parse(metricsMatch[1]) as RawSoftphoneStream[];
        for (const stream of rawStreams) {
          const key = `${stream.timestamp ?? ''}_${stream.softphoneStreamType ?? ''}`;
          if (!seenMetricTimestamps.has(key)) {
            seenMetricTimestamps.add(key);
            softphoneMetrics.push(mapStreamMetric(stream));
          }
        }
      } catch {
        // Malformed JSON — skip silently
      }
    }

    // Extract end-of-call softphone report
    if (!softphoneReport) {
      const reportMatch = SOFTPHONE_REPORT_RE.exec(entry.text);
      if (reportMatch) {
        try {
          const raw = JSON.parse(reportMatch[1]) as RawSoftphoneReport;
          softphoneReport = {
            callEndTime: raw.callEndTime ?? '',
            callStartTime: raw.callStartTime ?? '',
            cleanupTimeMs: raw.cleanupTimeMillis ?? null,
            createOfferFailure: raw.createOfferFailure ?? false,
            gumOtherFailure: raw.gumOtherFailure ?? false,
            gumTimeMs: raw.gumTimeMillis ?? 0,
            gumTimeoutFailure: raw.gumTimeoutFailure ?? false,
            handshakingFailure: raw.handshakingFailure ?? false,
            handshakingTimeMs: raw.handshakingTimeMillis ?? 0,
            iceCollectionFailure: raw.iceCollectionFailure ?? false,
            iceCollectionTimeMs: raw.iceCollectionTimeMillis ?? 0,
            initializationTimeMs: raw.initializationTimeMillis ?? 0,
            invalidRemoteSDPFailure: raw.invalidRemoteSDPFailure ?? false,
            noRemoteIceCandidateFailure: raw.noRemoteIceCandidateFailure ?? false,
            preTalkingTimeMs: raw.preTalkingTimeMillis ?? 0,
            setLocalDescriptionFailure: raw.setLocalDescriptionFailure ?? false,
            setRemoteDescriptionFailure: raw.setRemoteDescriptionFailure ?? false,
            signallingConnectionFailure: raw.signallingConnectionFailure ?? false,
            signallingConnectTimeMs: raw.signallingConnectTimeMillis ?? 0,
            streamStatistics: (raw.softphoneStreamStatistics ?? []).map(mapStreamMetric),
            talkingTimeMs: raw.talkingTimeMillis ?? 0,
            userBusyFailure: raw.userBusyFailure ?? false,
          };
        } catch {
          // Malformed JSON — skip silently
        }
      }
    }

    entries.push(entry);
  }

  // Sort softphone metrics by timestamp for chronological charting
  softphoneMetrics.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    apiLatency,
    contacts: buildContactSummaries(entries),
    entries,
    errorCount,
    filename,
    skewPoints,
    snapshots,
    softphoneMetrics,
    softphoneReport,
    warnCount,
  };
};
