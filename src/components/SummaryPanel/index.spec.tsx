import { render, screen } from '@testing-library/react';

import type { LogSummary } from '../../models/logSummary';
import SummaryPanel from './index';

const makeEmptySummary = (overrides: Partial<LogSummary> = {}): LogSummary => ({
  agent: { health: 'unknown', snapshotCount: 0, stateChangeCount: 0 },
  apiHealth: { avgLatencyMs: 0, failedCalls: 0, health: 'unknown', maxLatencyMs: 0, staleSendCount: 0, totalCalls: 0 },
  ccpLifecycle: {
    browser: '',
    ccpVersion: '',
    health: 'unknown',
    iframeInitTimeMs: null,
    initialised: false,
    streamsVersion: '',
  },
  clockHealth: { avgSkewMs: 0, health: 'unknown', maxSkewMs: 0, sampleCount: 0 },
  contacts: { health: 'unknown', total: 0 },
  overallHealth: 'unknown',
  sessionWindow: { durationMs: 0, endTime: '', entryCount: 0, errorCount: 0, startTime: '', warnCount: 0 },
  softphoneHealth: { avgTalkingMs: 0, callCount: 0, failureCount: 0, health: 'unknown', packetLossDetected: false },
  webSocket: {
    connectionCloseCount: 0,
    connectionOpenCount: 0,
    deepHeartbeatCount: 0,
    health: 'unknown',
    scheduledReconnections: 0,
  },
  ...overrides,
});

describe('SummaryPanel', () => {
  it('renders the overall health banner', () => {
    render(<SummaryPanel summary={makeEmptySummary()} />);
    expect(screen.getByRole('heading', { name: 'No Data' })).toBeInTheDocument();
  });

  it('shows "Healthy" when overall health is healthy', () => {
    render(<SummaryPanel summary={makeEmptySummary({ overallHealth: 'healthy' })} />);
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('shows "Issues Detected" when overall health is error', () => {
    render(<SummaryPanel summary={makeEmptySummary({ overallHealth: 'error' })} />);
    expect(screen.getByText('Issues Detected')).toBeInTheDocument();
  });

  it('renders session window entry count and duration', () => {
    const summary = makeEmptySummary({
      sessionWindow: {
        durationMs: 300_000,
        endTime: '2026-01-01T00:05:00.000Z',
        entryCount: 1500,
        errorCount: 0,
        startTime: '2026-01-01T00:00:00.000Z',
        warnCount: 0,
      },
    });
    render(<SummaryPanel summary={summary} />);
    expect(screen.getByText(/1,500 entries/)).toBeInTheDocument();
    expect(screen.getByText(/5m/)).toBeInTheDocument();
  });

  it('renders all section cards', () => {
    render(<SummaryPanel summary={makeEmptySummary()} />);
    expect(screen.getByText('CCP Lifecycle')).toBeInTheDocument();
    expect(screen.getByText('WebSocket')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('AWS API Calls')).toBeInTheDocument();
    expect(screen.getByText('Clock Skew')).toBeInTheDocument();
    expect(screen.getByText('Softphone')).toBeInTheDocument();
  });

  it('shows error and warning chips when present in session window', () => {
    const summary = makeEmptySummary({
      sessionWindow: {
        durationMs: 0,
        endTime: '',
        entryCount: 10,
        errorCount: 3,
        startTime: '',
        warnCount: 5,
      },
    });
    render(<SummaryPanel summary={summary} />);
    expect(screen.getByText('3 errors')).toBeInTheDocument();
    expect(screen.getByText('5 warnings')).toBeInTheDocument();
  });

  it('renders CCP lifecycle details when initialised', () => {
    const summary = makeEmptySummary({
      ccpLifecycle: {
        browser: 'Chrome 147',
        ccpVersion: '1.7.4',
        health: 'healthy',
        iframeInitTimeMs: 1732,
        initialised: true,
        streamsVersion: '2.25.0',
      },
    });
    render(<SummaryPanel summary={summary} />);
    expect(screen.getByText('Yes')).toBeInTheDocument(); // Initialised
    expect(screen.getByText('1,732 ms')).toBeInTheDocument(); // iframe init time
    expect(screen.getByText('2.25.0')).toBeInTheDocument(); // StreamsJS
    expect(screen.getByText('1.7.4')).toBeInTheDocument(); // CCP Streams
    expect(screen.getByText('Chrome 147')).toBeInTheDocument(); // Browser
  });

  it('renders CCP lifecycle with "No" when not initialised', () => {
    render(<SummaryPanel summary={makeEmptySummary()} />);
    expect(screen.getByText('No')).toBeInTheDocument(); // Initialised = No
  });

  it('renders WebSocket metrics', () => {
    const summary = makeEmptySummary({
      webSocket: {
        connectionCloseCount: 1,
        connectionOpenCount: 3,
        deepHeartbeatCount: 774,
        health: 'healthy',
        scheduledReconnections: 5,
      },
    });
    render(<SummaryPanel summary={summary} />);
    expect(screen.getByText('3')).toBeInTheDocument(); // connections opened
    expect(screen.getByText('1')).toBeInTheDocument(); // connections closed
    expect(screen.getByText('774')).toBeInTheDocument(); // deep heartbeats
    expect(screen.getByText('5')).toBeInTheDocument(); // scheduled reconnections
  });

  it('hides scheduled reconnections when zero', () => {
    const summary = makeEmptySummary({
      webSocket: {
        connectionCloseCount: 0,
        connectionOpenCount: 1,
        deepHeartbeatCount: 100,
        health: 'healthy',
        scheduledReconnections: 0,
      },
    });
    render(<SummaryPanel summary={summary} />);
    expect(screen.queryByText('Scheduled reconnections')).not.toBeInTheDocument();
  });

  it('renders API health metrics when calls are present', () => {
    const summary = makeEmptySummary({
      apiHealth: {
        avgLatencyMs: 250,
        failedCalls: 2,
        health: 'warning',
        maxLatencyMs: 800,
        staleSendCount: 1,
        totalCalls: 50,
      },
    });
    render(<SummaryPanel summary={summary} />);
    expect(screen.getByText('50')).toBeInTheDocument(); // total calls
    expect(screen.getByText('250 ms')).toBeInTheDocument(); // avg latency
    expect(screen.getByText('800 ms')).toBeInTheDocument(); // max latency
  });

  it('renders softphone health when calls exist', () => {
    const summary = makeEmptySummary({
      softphoneHealth: {
        avgTalkingMs: 120_000,
        callCount: 2,
        failureCount: 0,
        health: 'healthy',
        packetLossDetected: false,
      },
    });
    render(<SummaryPanel summary={summary} />);
    expect(screen.getByText('2m')).toBeInTheDocument(); // avg talking time
    expect(screen.getByText('None')).toBeInTheDocument(); // packet loss
  });

  it('shows dashes for latency when no API calls present', () => {
    render(<SummaryPanel summary={makeEmptySummary()} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2); // avg + max latency
  });

  it('renders clock skew details when samples exist', () => {
    const summary = makeEmptySummary({
      clockHealth: {
        avgSkewMs: 400,
        health: 'healthy',
        maxSkewMs: 800,
        sampleCount: 10,
      },
    });
    render(<SummaryPanel summary={summary} />);
    expect(screen.getByText('10')).toBeInTheDocument(); // samples
    expect(screen.getByText('400 ms')).toBeInTheDocument(); // avg skew
    expect(screen.getByText('800 ms')).toBeInTheDocument(); // max skew
  });

  it('renders agent snapshot and state change counts', () => {
    const summary = makeEmptySummary({
      agent: { health: 'healthy', snapshotCount: 25, stateChangeCount: 3 },
    });
    render(<SummaryPanel summary={summary} />);
    expect(screen.getByText('25')).toBeInTheDocument(); // snapshots
    expect(screen.getByText('3')).toBeInTheDocument(); // state changes
  });
});
