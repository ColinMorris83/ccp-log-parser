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
  warnCount: number;
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
