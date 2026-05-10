/**
 * CcpLogEntry represents a single raw entry from an Amazon Connect CCP log file.
 * CCP logs are exported as a JSON array of these objects.
 */
export interface CcpLogEntry {
  component: string;
  exception?: object;
  level: LogLevel;
  objects?: object[];
  text: string;
  time: string;
}

/**
 * LogLevel represents the severity of a CCP log entry.
 */
export type LogLevel = 'DEBUG' | 'ERROR' | 'INFO' | 'LOG' | 'TRACE' | 'WARN';

/**
 * LogLevelNumeric maps log level names to numeric priority values for comparison and filtering.
 */
export const LogLevelNumeric: Record<LogLevel, number> = {
  DEBUG: 2,
  ERROR: 6,
  INFO: 4,
  LOG: 1,
  TRACE: 3,
  WARN: 5,
};

/**
 * EnrichedLogEntry is a CcpLogEntry with additional computed fields added during parsing.
 */
export interface EnrichedLogEntry extends CcpLogEntry {
  /** Unique sequential index within the sorted log */
  _key: number;
  /** Original text before enrichment replaced it with a friendlier version */
  _originalText?: string;
  /** Original index before timestamp sort, used as a tiebreaker */
  _oriKey: number;
  /** Epoch milliseconds derived from the time field */
  _ts: number;
  /** If set, the API name referenced in this entry (for latency correlation) */
  apiName?: string;
  /** Contact IDs referenced in this entry (text or objects), if any */
  contactIds: string[];
  /** Whether this entry should be visually highlighted (e.g. a failed API call) */
  highlight?: boolean;
}

/**
 * AgentSnapshot represents a single agent state snapshot extracted from the log.
 */
export interface AgentSnapshot {
  /** Epoch ms of the snapshot entry */
  _ts: number;
  /** Key of the first log entry in this snapshot's range */
  fromKey: number;
  /** Agent state name extracted from the snapshot text */
  stateName: string;
  /** ISO timestamp of the snapshot entry */
  time: string;
  /** Exclusive upper bound of this snapshot's log range. Equal to the `fromKey` of the next snapshot, or `entries.length` for the last snapshot. The range is `[fromKey, toKey)`. */
  toKey: number;
}

/**
 * ApiLatencyPoint represents a measured API call latency from a SEND→REPLY pair.
 */
export interface ApiLatencyPoint {
  /** Epoch ms of the send event */
  _ts: number;
  apiName: string;
  /** Latency in milliseconds */
  latencyMs: number;
  status: 'failed' | 'succeeded';
}

/**
 * SkewPoint represents a single skew measurement from a GET_AGENT_SNAPSHOT log entry.
 * Skew is the difference (ms) between the agent workstation clock and the server clock.
 */
export interface SkewPoint {
  /** Epoch ms of the snapshot entry */
  _ts: number;
  /** ISO timestamp from the agent workstation (log entry time) */
  localTime: string;
  /** ISO timestamp from the Amazon Connect server (snapshotTimestamp) */
  serverTime: string;
  /** Skew value in milliseconds */
  skewMs: number;
  /** Agent state name at this snapshot (e.g. Available, Busy) */
  stateName: string;
}

/**
 * ContactSummary represents a single contact (call/chat) identified within the log.
 */
export interface ContactSummary {
  /** The Amazon Connect contact ID (UUID) */
  contactId: string;
  /** ISO timestamp of the last log entry referencing this contact */
  endTime: string;
  /** Key of the first log entry referencing this contact */
  firstKey: number;
  /** Short human-readable label, e.g. "Contact 1" */
  label: string;
  /** Key of the last log entry referencing this contact */
  lastKey: number;
  /** ISO timestamp of the first log entry referencing this contact */
  startTime: string;
}

/**
 * ParsedCcpLog is the fully processed result returned by parseCcpLog().
 */
export interface ParsedCcpLog {
  apiLatency: ApiLatencyPoint[];
  contacts: ContactSummary[];
  entries: EnrichedLogEntry[];
  errorCount: number;
  filename: string;
  skewPoints: SkewPoint[];
  snapshots: AgentSnapshot[];
  /** Periodic softphone stream metrics collected during a call (empty if no softphone data) */
  softphoneMetrics: SoftphoneMetricPoint[];
  /** Softphone call reports extracted at call end (one per call; empty if no softphone calls in log) */
  softphoneReports: SoftphoneCallReport[];
  /** Number of orphaned API sends discarded because no reply arrived within 30 seconds */
  staleApiSendCount: number;
  warnCount: number;
}

/**
 * Stream direction for softphone audio metrics.
 */
export type SoftphoneStreamType = 'audio_input' | 'audio_output';

/**
 * A single softphone audio metric sample, logged once per second during a call.
 * Each sample covers one stream direction (input = mic, output = speaker).
 */
export interface SoftphoneMetricPoint {
  /** Audio level (unitless, higher = louder; 0 = silence) */
  audioLevel: number;
  /** Number of audio concealment events (gap-filling due to lost packets) */
  concealmentEvents: number;
  /** Echo return loss in dB (negative values are normal) */
  echoReturnLoss: number;
  /** Echo return loss enhancement in dB */
  echoReturnLossEnhancement: number;
  /** Jitter buffer delay in milliseconds */
  jitterBufferDelayMs: number;
  /** Jitter buffer size in milliseconds */
  jitterBufferMs: number;
  /** Number of packets received/sent since last sample */
  packetsCount: number;
  /** Number of packets lost since last sample */
  packetsLost: number;
  /** Round-trip time to the media server in milliseconds */
  roundTripTimeMs: number;
  /** Whether this is microphone input or speaker output */
  streamType: SoftphoneStreamType;
  /** ISO timestamp of this metric sample */
  timestamp: string;
}

/**
 * End-of-call softphone report summarising call setup, duration, and any failures.
 */
export interface SoftphoneCallReport {
  /** ISO timestamp when the call ended */
  callEndTime: string;
  /** ISO timestamp when the call started */
  callStartTime: string;
  /** Time spent cleaning up after the call (ms) */
  cleanupTimeMs: null | number;
  /** Whether an offer creation failure occurred */
  createOfferFailure: boolean;
  /** Whether a getUserMedia failure occurred (non-timeout) */
  gumOtherFailure: boolean;
  /** Time to acquire the microphone via getUserMedia (ms) */
  gumTimeMs: number;
  /** Whether getUserMedia timed out */
  gumTimeoutFailure: boolean;
  /** Whether the handshake failed */
  handshakingFailure: boolean;
  /** Time to complete the DTLS handshake (ms) */
  handshakingTimeMs: number;
  /** Whether ICE candidate collection failed */
  iceCollectionFailure: boolean;
  /** Time to collect ICE candidates (ms) */
  iceCollectionTimeMs: number;
  /** Time to initialise the peer connection (ms) */
  initializationTimeMs: number;
  /** Whether an invalid remote SDP was received */
  invalidRemoteSDPFailure: boolean;
  /** Whether no remote ICE candidates were received */
  noRemoteIceCandidateFailure: boolean;
  /** Time between connection and first audio (ms) */
  preTalkingTimeMs: number;
  /** Whether setLocalDescription failed */
  setLocalDescriptionFailure: boolean;
  /** Whether setRemoteDescription failed */
  setRemoteDescriptionFailure: boolean;
  /** Whether the signalling connection failed */
  signallingConnectionFailure: boolean;
  /** Time to establish the signalling connection (ms) */
  signallingConnectTimeMs: number;
  /** Final stream statistics at call end */
  streamStatistics: SoftphoneMetricPoint[];
  /** Total talking/connected time (ms) */
  talkingTimeMs: number;
  /** Whether the agent was busy when the call arrived */
  userBusyFailure: boolean;
}

/**
 * CustomFilter represents a user-defined text prefix filter that can be persisted to localStorage.
 */
export interface CustomFilter {
  /** Unique identifier */
  id: string;
  /** User-friendly display name */
  label: string;
  /** The text prefix to match against log entry text */
  prefix: string;
}
