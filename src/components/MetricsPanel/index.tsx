import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Link,
  Paper,
  Slider,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useDrawingArea, useXScale } from '@mui/x-charts';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartsTooltipContainer, useAxesTooltip } from '@mui/x-charts/ChartsTooltip';
import { LineChart } from '@mui/x-charts/LineChart';
import {
  createContext,
  type FC,
  type SyntheticEvent,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { ApiLatencyPoint, SkewPoint, SoftphoneCallReport, SoftphoneMetricPoint } from '../../models/ccpLogParser';
import { SegmentedTabCompact, SegmentedTabsCompact } from '../SegmentedTabs';

/** Maximum skew (ms) before highlighting as problematic */
const SKEW_WARNING_THRESHOLD = 1_000;
/** API names excluded from latency charts (already represented in the skew chart) */
const LATENCY_API_FILTER = new Set(['getAgentSnapshot']);
const LATENCY_WARNING_THRESHOLD = 500;
/** Setup time (ms) above which an individual call is flagged as concerning */
const SETUP_WARNING_THRESHOLD = 1_000;

/** Colour palette for agent state — used for legend swatches and chart background bands */
const STATE_COLORS: Record<string, string> = {
  AfterCallWork: 'rgba(251, 192, 45, 0.28)',
  Available: 'rgba(67, 160, 71, 0.28)',
  Busy: 'rgba(229, 57, 53, 0.28)',
  CallingCustomer: 'rgba(229, 57, 53, 0.28)',
  Offline: 'rgba(97, 97, 97, 0.22)',
  PendingBusy: 'rgba(239, 108, 0, 0.28)',
  Routable: 'rgba(67, 160, 71, 0.18)',
};
const DEFAULT_STATE_COLOR = 'rgba(144, 164, 174, 0.18)';

/** Navigation sections for the chart scroll-to tabs */
const CHART_SECTIONS = [
  { id: 'clock-skew', label: 'Clock Skew' },
  { id: 'latency-time-series', label: 'API Latency' },
  { id: 'latency-aggregated', label: 'API Aggregated' },
  { id: 'webrtc-metrics', label: 'WebRTC Metrics' },
] as const;

type ChartSectionId = (typeof CHART_SECTIONS)[number]['id'];

/** Sub-tab types for the WebRTC metrics section */
type WebRtcStreamTab = 'audio_input' | 'audio_output';

/** React context used to pass skew data into the custom tooltip component */
const SkewDataContext = createContext<SkewPoint[]>([]);

/** Intl options for tooltip timestamps (HH:mm:ss.SSS, UTC) */
const TOOLTIP_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  fractionalSecondDigits: 3,
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC',
};

/**
 * Formats an ISO timestamp for tooltip display (HH:mm:ss.SSS).
 *
 * @param isoTime - ISO 8601 timestamp string.
 * @returns Formatted time string.
 */
const formatTooltipTime = (isoTime: string): string => new Date(isoTime).toLocaleTimeString([], TOOLTIP_TIME_FORMAT);

/**
 * Formats a skew value with a directional label (e.g. "150 ms ahead").
 *
 * @param skewMs - Skew in milliseconds (positive = local ahead).
 * @returns Human-readable skew string.
 */
const formatSkewDirection = (skewMs: number): string => {
  const abs = Math.abs(skewMs).toLocaleString();
  if (skewMs > 0) return `${abs} ms ahead`;
  if (skewMs < 0) return `${abs} ms behind`;
  return '0 ms (in sync)';
};

/**
 * Custom tooltip for the skew chart showing server time, local time,
 * agent state, and skew direction.
 *
 * @returns Tooltip JSX or null when no item is hovered.
 */
const CustomSkewTooltip: FC = () => {
  const axesData = useAxesTooltip();
  const skewPoints = use(SkewDataContext);

  if (!axesData || axesData.length === 0) return null;

  const dataIndex = axesData[0].dataIndex;
  if (dataIndex < 0 || dataIndex >= skewPoints.length) return null;

  const point = skewPoints[dataIndex];
  const isWarning = Math.abs(point.skewMs) > SKEW_WARNING_THRESHOLD;

  return (
    <ChartsTooltipContainer trigger="axis">
      <Paper
        elevation={3}
        sx={{
          maxWidth: 280,
          p: 1.5,
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
            mb: 0.5,
          }}
          variant="subtitle2"
        >
          {point.stateName}
        </Typography>
        <Box
          sx={{
            columnGap: 1,
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            rowGap: 0.25,
          }}
        >
          <Typography color="text.secondary" variant="caption">
            Server:
          </Typography>
          <Typography variant="caption">{formatTooltipTime(point.serverTime)}</Typography>
          <Typography color="text.secondary" variant="caption">
            Local:
          </Typography>
          <Typography variant="caption">{formatTooltipTime(point.localTime)}</Typography>
        </Box>
        <Typography
          sx={{
            color: isWarning ? 'error.main' : 'text.primary',
            fontWeight: 'bold',
            mt: 0.5,
          }}
          variant="body2"
        >
          {formatSkewDirection(point.skewMs)}
        </Typography>
      </Paper>
    </ChartsTooltipContainer>
  );
};

/** React context used to pass latency data into the custom tooltip */
const LatencyDataContext = createContext<ApiLatencyPoint[]>([]);

/**
 * Custom tooltip for the API latency line chart showing API name,
 * latency, status, and timestamp.
 *
 * @returns Tooltip JSX or null when no item is hovered.
 */
const CustomLatencyTooltip: FC = () => {
  const axesData = useAxesTooltip();
  const latencyPoints = use(LatencyDataContext);

  if (!axesData || axesData.length === 0) return null;

  const { dataIndex } = axesData[0];
  if (dataIndex < 0 || dataIndex >= latencyPoints.length) return null;

  const point = latencyPoints[dataIndex];
  const isFailed = point.status === 'failed';
  const time = new Date(point._ts).toLocaleTimeString([], TOOLTIP_TIME_FORMAT);

  return (
    <ChartsTooltipContainer trigger="axis">
      <Paper
        elevation={3}
        sx={{
          maxWidth: 280,
          p: 1.5,
        }}
      >
        <Typography
          sx={{
            fontWeight: 'bold',
            mb: 0.5,
          }}
          variant="subtitle2"
        >
          {point.apiName}
        </Typography>
        <Box
          sx={{
            columnGap: 1,
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            rowGap: 0.25,
          }}
        >
          <Typography color="text.secondary" variant="caption">
            Time:
          </Typography>
          <Typography variant="caption">{time}</Typography>
          <Typography color="text.secondary" variant="caption">
            Latency:
          </Typography>
          <Typography variant="caption">{point.latencyMs.toLocaleString()} ms</Typography>
          <Typography color="text.secondary" variant="caption">
            Status:
          </Typography>
          <Typography color={isFailed ? 'error.main' : 'success.main'} variant="caption">
            {point.status}
          </Typography>
        </Box>
      </Paper>
    </ChartsTooltipContainer>
  );
};

/** Type for the d3 time scale returned by useXScale */
type TimeScale = (value: Date) => number;

interface StateBackgroundBandsProps {
  dates: Date[];
  skewPoints: SkewPoint[];
}

/**
 * Renders coloured background bands as SVG rects inside a LineChart.
 *
 * @param root0 Component props.
 * @param root0.dates X-axis Date array (same order as skewPoints).
 * @param root0.skewPoints Parsed skew data points with stateName.
 * @returns SVG rect elements, one per contiguous state period.
 */
const StateBackgroundBands: FC<StateBackgroundBandsProps> = ({ dates, skewPoints }) => {
  const { height, left, top, width } = useDrawingArea();
  const xScale = useXScale() as unknown as TimeScale;

  const n = skewPoints.length;
  if (n === 0) return null;

  const bands: { color: string; endX: number; startX: number }[] = [];
  let bandStart = 0;
  for (let i = 1; i <= n; i++) {
    if (i === n || skewPoints[i].stateName !== skewPoints[i - 1].stateName) {
      const x0 = xScale(dates[bandStart]);
      const x1 = xScale(dates[Math.min(i - 1, n - 1)]);
      // Use midpoint between adjacent data points as the band edge;
      // first band starts at drawing area left, last band ends at drawing area right.
      const midBefore = bandStart > 0 ? (xScale(dates[bandStart - 1]) + x0) / 2 : left;
      const midAfter = i < n ? (x1 + xScale(dates[i])) / 2 : left + width;
      bands.push({
        color: STATE_COLORS[skewPoints[bandStart].stateName] ?? DEFAULT_STATE_COLOR,
        endX: midAfter,
        startX: midBefore,
      });
      bandStart = i;
    }
  }

  return (
    <>
      {bands.map((band, idx) => (
        <rect
          fill={band.color}
          height={height}
          key={`state-band-${String(idx)}`}
          style={{ pointerEvents: 'none' }}
          width={Math.max(0, band.endX - band.startX)}
          x={band.startX}
          y={top}
        />
      ))}
    </>
  );
};

interface MetricsPanelProps {
  apiLatency: ApiLatencyPoint[];
  skewPoints: SkewPoint[];
  softphoneMetrics: SoftphoneMetricPoint[];
  /** Softphone call reports extracted at call end (one per call) */
  softphoneReports: SoftphoneCallReport[];
  /** Number of orphaned API sends that were discarded during parsing */
  staleApiSendCount: number;
}

const EmptyMetric: FC<{ message: string }> = ({ message }) => (
  <Box
    sx={{
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      minHeight: 160,
    }}
  >
    <Typography
      sx={{
        color: 'text.secondary',
      }}
      variant="body2"
    >
      {message}
    </Typography>
  </Box>
);

/**
 * Renders metrics charts derived from the parsed CCP log:
 * - Skew over time (LineChart): clock skew between agent workstation and Connect service
 * - API call latency over time (LineChart): individual API call latency plotted chronologically
 * - API call latency aggregated (BarChart): average and max latency per API call type
 * - Audio levels (LineChart): microphone and speaker audio levels during softphone calls
 * - Network quality (LineChart): jitter, round-trip time, and packet loss during softphone calls
 *
 * @param root0 Component props.
 * @param root0.apiLatency Array of API latency measurements.
 * @param root0.skewPoints Array of skew measurements over time.
 * @param root0.softphoneMetrics Periodic softphone audio metrics (empty if no softphone call).
 * @param root0.softphoneReports Softphone call reports (one per call; empty if no calls).
 * @param root0.staleApiSendCount Number of orphaned API sends discarded during parsing.
 * @returns JSX for the metrics panel component.
 */
const MetricsPanel: FC<MetricsPanelProps> = ({
  apiLatency,
  skewPoints,
  softphoneMetrics,
  softphoneReports,
  staleApiSendCount,
}) => {
  const [skewInfoOpen, setSkewInfoOpen] = useState(false);
  const [latencyTimeSeriesInfoOpen, setLatencyTimeSeriesInfoOpen] = useState(false);
  const [latencyAggregatedInfoOpen, setLatencyAggregatedInfoOpen] = useState(false);
  const [webrtcInfoOpen, setWebrtcInfoOpen] = useState(false);
  const [webrtcStreamTab, setWebrtcStreamTab] = useState<WebRtcStreamTab>('audio_output');
  const [activeSection, setActiveSection] = useState<ChartSectionId>('clock-skew');
  const sectionRef = useRef<Record<ChartSectionId, HTMLDivElement | null>>({
    'clock-skew': null,
    'latency-aggregated': null,
    'latency-time-series': null,
    'webrtc-metrics': null,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const skewData = skewPoints.map((p) => p.skewMs);
  const maxSkew = Math.max(...skewData.map(Math.abs), 0);

  const skewDates = skewPoints.map((p) => new Date(p._ts));

  const filteredLatency = apiLatency.filter((p) => !LATENCY_API_FILTER.has(p.apiName));

  const aggregated = Object.values(
    filteredLatency.reduce<
      Record<string, { apiName: string; count: number; failCount: number; maxMs: number; totalMs: number }>
    >((acc, p) => {
      const existing = acc[p.apiName] ?? { apiName: p.apiName, count: 0, failCount: 0, maxMs: 0, totalMs: 0 };
      existing.count += 1;
      existing.totalMs += p.latencyMs;
      existing.maxMs = Math.max(existing.maxMs, p.latencyMs);
      if (p.status === 'failed') existing.failCount += 1;
      acc[p.apiName] = existing;
      return acc;
    }, {}),
  )
    .map((a) => ({ ...a, avgMs: Math.round(a.totalMs / a.count) }))
    .sort((a, b) => b.avgMs - a.avgMs);

  const apiNames = aggregated.map((a) => a.apiName);
  const avgData = aggregated.map((a) => a.avgMs);
  const maxData = aggregated.map((a) => a.maxMs);
  const latencyChartHeight = Math.max(200, aggregated.length * 48 + 100);
  const hasSlowOrFailed = aggregated.some((a) => a.failCount > 0 || a.avgMs > LATENCY_WARNING_THRESHOLD);

  const sortedLatency = [...filteredLatency].sort((a, b) => a._ts - b._ts);
  const latencyDates = sortedLatency.map((p) => new Date(p._ts));
  const latencyData = sortedLatency.map((p) => p.latencyMs);
  const failedOverlay = sortedLatency.map((p) => (p.status === 'failed' ? p.latencyMs : null));
  const hasFailedCalls = failedOverlay.some((v) => v !== null);

  // Softphone data preparation
  const inputMetrics = useMemo(
    () => softphoneMetrics.filter((m) => m.streamType === 'audio_input'),
    [softphoneMetrics],
  );
  const outputMetrics = useMemo(
    () => softphoneMetrics.filter((m) => m.streamType === 'audio_output'),
    [softphoneMetrics],
  );
  const hasSoftphoneData = softphoneMetrics.length > 0;
  const hasPacketLoss = softphoneMetrics.some((m) => m.packetsLost > 0);
  const hasAnyFailure = softphoneReports.some((report) =>
    Object.entries(report).some(([key, val]) => key.endsWith('Failure') && val === true),
  );

  /**
   * Formats a duration in milliseconds as "Xm Ys" or "Ys".
   *
   * @param ms - Duration in milliseconds.
   * @returns Human-readable duration string.
   */
  const formatDuration = (ms: number): string => {
    const totalSec = Math.round(ms / 1_000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min > 0 ? `${String(min)}m ${String(sec)}s` : `${String(sec)}s`;
  };

  /** Aggregated call summary stats across all softphone reports */
  const overallCallSummary = useMemo(() => {
    const totalCalls = softphoneReports.length;
    if (totalCalls === 0) return null;
    const totalDurationMs = softphoneReports.reduce((sum, r) => sum + r.talkingTimeMs, 0);
    const avgDurationMs = Math.round(totalDurationMs / totalCalls);
    const totalFailures = softphoneReports.filter((r) =>
      Object.entries(r).some(([key, val]) => key.endsWith('Failure') && val === true),
    ).length;
    const avg = (fn: (r: SoftphoneCallReport) => number): number =>
      Math.round(softphoneReports.reduce((s, r) => s + fn(r), 0) / totalCalls);
    const max = (fn: (r: SoftphoneCallReport) => number): number => Math.max(...softphoneReports.map(fn));

    return {
      avgDurationMs,
      avgGum: avg((r) => r.gumTimeMs),
      avgHandshaking: avg((r) => r.handshakingTimeMs),
      avgIce: avg((r) => r.iceCollectionTimeMs),
      avgPreTalking: avg((r) => r.preTalkingTimeMs),
      avgSignalling: avg((r) => r.signallingConnectTimeMs),
      maxGum: max((r) => r.gumTimeMs),
      maxHandshaking: max((r) => r.handshakingTimeMs),
      maxIce: max((r) => r.iceCollectionTimeMs),
      maxPreTalking: max((r) => r.preTalkingTimeMs),
      maxSignalling: max((r) => r.signallingConnectTimeMs),
      totalCalls,
      totalDurationMs,
      totalFailures,
    };
  }, [softphoneReports]);

  // Time range zoom slider — timestamp-based so both streams share the same
  // time axis covering the earliest-to-latest across input AND output.
  const activeMetrics = webrtcStreamTab === 'audio_input' ? inputMetrics : outputMetrics;
  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 0]);
  const prevZoomKeyRef = useRef('');

  // Compute overall time bounds across both streams (epoch ms)
  const overallTimeBounds = useMemo<[number, number]>(() => {
    const allTimestamps = softphoneMetrics.map((m) => new Date(m.timestamp).getTime());
    if (allTimestamps.length === 0) return [0, 0];
    return [Math.min(...allTimestamps), Math.max(...allTimestamps)];
  }, [softphoneMetrics]);

  // Reset zoom when the data changes (new file loaded)
  const zoomKey = `${String(overallTimeBounds[0])}_${String(overallTimeBounds[1])}`;
  if (prevZoomKeyRef.current !== zoomKey) {
    prevZoomKeyRef.current = zoomKey;
    if (zoomRange[0] !== overallTimeBounds[0] || zoomRange[1] !== overallTimeBounds[1]) {
      setZoomRange(overallTimeBounds);
    }
  }

  // Filter active stream to the zoom time range
  const zoomedMetrics = useMemo(() => {
    if (activeMetrics.length === 0) return [];
    return activeMetrics.filter((m) => {
      const t = new Date(m.timestamp).getTime();
      return t >= zoomRange[0] && t <= zoomRange[1];
    });
  }, [activeMetrics, zoomRange]);

  // Date array for the time-scale x-axis
  const zoomedDates = useMemo(() => zoomedMetrics.map((p) => new Date(p.timestamp)), [zoomedMetrics]);

  // Slider marks — evenly spaced across the overall time range
  const sliderMarks = useMemo(() => {
    const [tMin, tMax] = overallTimeBounds;
    if (tMin === tMax) return [];
    const markCount = 5;
    const step = (tMax - tMin) / (markCount - 1);
    return Array.from({ length: markCount }, (_, i) => {
      const value = Math.round(tMin + i * step);
      return {
        label: new Date(value).toLocaleTimeString([], {
          hour: '2-digit',
          hour12: false,
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'UTC',
        }),
        value,
      };
    });
  }, [overallTimeBounds]);

  const sectionWarnings: Record<ChartSectionId, boolean> = {
    'clock-skew': maxSkew > SKEW_WARNING_THRESHOLD,
    'latency-aggregated': hasSlowOrFailed,
    'latency-time-series': hasFailedCalls,
    'webrtc-metrics': hasPacketLoss || hasAnyFailure,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollParent: HTMLElement | null = container.parentElement;
    while (scrollParent) {
      const { overflowY } = getComputedStyle(scrollParent);
      if (overflowY === 'auto' || overflowY === 'scroll') break;
      scrollParent = scrollParent.parentElement;
    }

    const visibleIds = new Set<ChartSectionId>();
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-section') as ChartSectionId;
          if (entry.isIntersecting) {
            visibleIds.add(id);
          } else {
            visibleIds.delete(id);
          }
        }
        const topVisible = CHART_SECTIONS.find((s) => visibleIds.has(s.id));
        if (topVisible) setActiveSection(topVisible.id);
      },
      { root: scrollParent, rootMargin: '-56px 0px 0px 0px', threshold: 0.1 },
    );

    for (const el of Object.values(sectionRef.current)) {
      if (el) observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleTabClick = useCallback((_event: SyntheticEvent, value: ChartSectionId) => {
    setActiveSection(value);
    const el = sectionRef.current[value];
    if (el) {
      isScrollingRef.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  }, []);

  return (
    <Stack
      ref={containerRef}
      sx={{
        gap: 4,
      }}
    >
      {/* Chart navigation tabs */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          mt: -2,
          mx: -2,
          pb: 0.5,
          position: 'sticky',
          top: 0,
          zIndex: 2,
        }}
      >
        <Tabs
          onChange={handleTabClick}
          scrollButtons="auto"
          sx={{ minHeight: 42, pl: 1 }}
          value={activeSection}
          variant="scrollable"
        >
          {CHART_SECTIONS.map((section) => (
            <Tab
              key={section.id}
              label={
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <span>{section.label}</span>
                  {sectionWarnings[section.id] && (
                    <Box
                      sx={{
                        bgcolor: 'warning.main',
                        borderRadius: '50%',
                        height: 8,
                        minWidth: 8,
                        width: 8,
                      }}
                    />
                  )}
                </Stack>
              }
              sx={{ minHeight: 42, textTransform: 'none' }}
              value={section.id}
            />
          ))}
        </Tabs>
      </Box>
      {/* Skew chart */}
      <Box
        data-section="clock-skew"
        ref={(el: HTMLDivElement | null) => {
          sectionRef.current['clock-skew'] = el;
        }}
        sx={{ scrollMarginTop: '56px' }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
            variant="subtitle1"
          >
            Clock Skew Over Time
          </Typography>
          {maxSkew > SKEW_WARNING_THRESHOLD && (
            <Tooltip
              arrow
              title="Skew above 1,000 ms can cause missed state transitions, phantom 'missed' contacts, and inaccurate historical reporting. Verify NTP sync on the workstation."
            >
              <Chip color="warning" label={`Max skew: ${maxSkew.toLocaleString()} ms`} size="small" />
            </Tooltip>
          )}
        </Stack>
        <Typography
          sx={{
            color: 'text.secondary',
            mb: 1,
          }}
          variant="body2"
        >
          Skew is the difference between the agent workstation clock and the Amazon Connect server clock (ms). Large
          values can cause state transition problems.{' '}
          <Link
            component="button"
            onClick={() => {
              setSkewInfoOpen((prev) => !prev);
            }}
            sx={{ verticalAlign: 'baseline' }}
            underline="hover"
            variant="body2"
          >
            {skewInfoOpen ? 'Show less' : 'Learn more'}
          </Link>
        </Typography>
        <Collapse in={skewInfoOpen}>
          <Box
            component="ul"
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 1,
              color: 'text.secondary',
              mb: 1.5,
              mt: 0,
              pl: 4,
              pr: 2,
              py: 1,
            }}
          >
            {[
              'Ahead: local clock is ahead of the server — timestamps appear in the future from the server\u2019s perspective.',
              'Behind: local clock is behind the server — events may appear to arrive late.',
              'Common causes: NTP misconfiguration, VM clock drift, VPN latency.',
              'Impact: >1,000 ms can cause missed state transitions, phantom \u201Cmissed\u201D contacts, and inaccurate historical reporting.',
              'Fix: verify NTP sync on the workstation, restart the CCP, or contact IT if skew persists.',
            ].map((item) => (
              <Typography component="li" key={item} sx={{ mb: 0.25 }} variant="body2">
                {item}
              </Typography>
            ))}
          </Box>
        </Collapse>
        {skewPoints.length === 0 ? (
          <EmptyMetric message="No skew data found in this log (requires GET_AGENT_SNAPSHOT entries with skew values)." />
        ) : (
          <>
            <SkewDataContext value={skewPoints}>
              <LineChart
                height={280}
                margin={{ bottom: 22, left: 16, right: 40 }}
                series={[
                  {
                    color: maxSkew > SKEW_WARNING_THRESHOLD ? '#d32f2f' : '#1976d2',
                    data: skewData,
                    showMark: skewData.length < 50,
                  },
                ]}
                slots={{ tooltip: CustomSkewTooltip }}
                xAxis={[
                  {
                    data: skewDates,
                    scaleType: 'time',
                    tickLabelStyle: { fontSize: 10 },
                    valueFormatter: (value: Date) =>
                      value.toLocaleTimeString([], {
                        hour: '2-digit',
                        hour12: false,
                        minute: '2-digit',
                        second: '2-digit',
                        timeZone: 'UTC',
                      }),
                  },
                ]}
                yAxis={[{ label: 'Skew (ms)' }]}
              >
                <StateBackgroundBands dates={skewDates} skewPoints={skewPoints} />
              </LineChart>
            </SkewDataContext>
            <Stack
              direction="row"
              sx={{
                flexWrap: 'wrap',
                gap: 1.5,
                justifyContent: 'center',
              }}
            >
              {[...new Set(skewPoints.map((p) => p.stateName))].map((state) => (
                <Box
                  key={state}
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: STATE_COLORS[state] ?? DEFAULT_STATE_COLOR,
                      border: '1px solid rgba(0,0,0,0.15)',
                      borderRadius: 0.5,
                      flexShrink: 0,
                      height: 12,
                      width: 20,
                    }}
                  />
                  <Typography variant="caption">{state}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Box>
      <Divider />
      {/* API latency time series */}
      <Box
        data-section="latency-time-series"
        ref={(el: HTMLDivElement | null) => {
          sectionRef.current['latency-time-series'] = el;
        }}
        sx={{ scrollMarginTop: '56px' }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
            variant="subtitle1"
          >
            API Latency Over Time
          </Typography>
          {hasSlowOrFailed && (
            <Tooltip
              arrow
              title="One or more API calls averaged above 500 ms or returned failures. This may indicate network congestion, server-side throttling, or DNS resolution delays."
            >
              <Chip color="warning" label="Slow or failed calls detected" size="small" />
            </Tooltip>
          )}
        </Stack>
        {staleApiSendCount > 0 && (
          <Alert severity="info" sx={{ mb: 1 }}>
            {staleApiSendCount} orphaned API {staleApiSendCount === 1 ? 'call was' : 'calls were'} excluded from latency
            charts — {staleApiSendCount === 1 ? 'a send was' : 'sends were'} logged without a reply within 30 seconds,
            likely due to a network interruption or WebSocket reconnection.
          </Alert>
        )}
        <Typography
          sx={{
            color: 'text.secondary',
            mb: 1,
          }}
          variant="body2"
        >
          Individual API call latency plotted chronologically. Hover a point to see the API name and status.{' '}
          <Link
            component="button"
            onClick={() => {
              setLatencyTimeSeriesInfoOpen((prev) => !prev);
            }}
            sx={{ verticalAlign: 'baseline' }}
            underline="hover"
            variant="body2"
          >
            {latencyTimeSeriesInfoOpen ? 'Show less' : 'Learn more'}
          </Link>
        </Typography>
        <Collapse in={latencyTimeSeriesInfoOpen}>
          <Box
            component="ul"
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 1,
              color: 'text.secondary',
              mb: 1.5,
              mt: 0,
              pl: 4,
              pr: 2,
              py: 1,
            }}
          >
            {[
              'Each point represents a single API call (request → response) and how long it took in milliseconds.',
              'Purple dots are successful calls; red dots indicate failed calls (timeout, network error, or server error).',
              'Sudden spikes may indicate network congestion, server-side throttling, or DNS resolution delays.',
              'Sustained high latency (>1,000 ms) can degrade agent experience — slow screen pops, delayed state changes, or dropped actions.',
              'getAgentSnapshot calls are excluded — that polling data is already represented in the Clock Skew chart above.',
            ].map((item) => (
              <Typography component="li" key={item} sx={{ mb: 0.25 }} variant="body2">
                {item}
              </Typography>
            ))}
          </Box>
        </Collapse>
        {filteredLatency.length === 0 ? (
          <EmptyMetric message="No API latency data found in this log." />
        ) : (
          <LatencyDataContext value={sortedLatency}>
            <LineChart
              height={280}
              margin={{ bottom: 22, left: 16, right: 20 }}
              series={[
                {
                  color: '#8884d8',
                  curve: 'linear',
                  data: latencyData,
                  label: 'Latency',
                  showMark: latencyData.length < 200,
                },
                ...(hasFailedCalls
                  ? [
                      {
                        color: '#d32f2f',
                        connectNulls: false,
                        curve: 'linear' as const,
                        data: failedOverlay,
                        label: 'Failed',
                        showMark: true,
                      },
                    ]
                  : []),
              ]}
              slots={{ tooltip: CustomLatencyTooltip }}
              xAxis={[
                {
                  data: latencyDates,
                  scaleType: 'time',
                  tickLabelStyle: { fontSize: 10 },
                  valueFormatter: (value: Date) =>
                    value.toLocaleTimeString([], {
                      hour: '2-digit',
                      hour12: false,
                      minute: '2-digit',
                      second: '2-digit',
                      timeZone: 'UTC',
                    }),
                },
              ]}
              yAxis={[
                {
                  label: 'Latency (ms)',
                  valueFormatter: (v: number) =>
                    v >= 10_000
                      ? `${String(Math.round(v / 1_000))}k`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(1)}k`
                        : String(v),
                },
              ]}
            />
          </LatencyDataContext>
        )}
      </Box>
      <Divider />
      {/* API latency aggregated chart */}
      <Box
        data-section="latency-aggregated"
        ref={(el: HTMLDivElement | null) => {
          sectionRef.current['latency-aggregated'] = el;
        }}
        sx={{ scrollMarginTop: '56px' }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
            variant="subtitle1"
          >
            API Call Latency (Aggregated)
          </Typography>
          {hasSlowOrFailed && (
            <Tooltip
              arrow
              title="One or more API calls averaged above 500 ms or returned failures. This may indicate network congestion, server-side throttling, or DNS resolution delays."
            >
              <Chip color="warning" label="Slow or failed calls detected" size="small" />
            </Tooltip>
          )}
        </Stack>
        <Typography
          sx={{
            color: 'text.secondary',
            mb: 2,
          }}
          variant="body2"
        >
          Average and max latency per API call type, sorted by average. Hover a bar to see call count.{' '}
          <Link
            component="button"
            onClick={() => {
              setLatencyAggregatedInfoOpen((prev) => !prev);
            }}
            sx={{ verticalAlign: 'baseline' }}
            underline="hover"
            variant="body2"
          >
            {latencyAggregatedInfoOpen ? 'Show less' : 'Learn more'}
          </Link>
        </Typography>
        <Collapse in={latencyAggregatedInfoOpen}>
          <Box
            component="ul"
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 1,
              color: 'text.secondary',
              mb: 1.5,
              mt: 0,
              pl: 4,
              pr: 2,
              py: 1,
            }}
          >
            {[
              'Dark blue bars show average latency; light blue bars show the single worst (max) call for that API.',
              'A large gap between avg and max suggests occasional outlier spikes rather than consistent slowness.',
              'APIs with high average latency may indicate a systemic issue — check server health or network path.',
              'The "Slow or failed calls detected" warning appears when any API averages above the warning threshold or has failed calls.',
              'Use this chart alongside the time-series chart above to determine whether slowness is constant or intermittent.',
            ].map((item) => (
              <Typography component="li" key={item} sx={{ mb: 0.25 }} variant="body2">
                {item}
              </Typography>
            ))}
          </Box>
        </Collapse>
        {filteredLatency.length === 0 ? (
          <EmptyMetric message="No API latency data found in this log." />
        ) : (
          <BarChart
            height={latencyChartHeight}
            layout="horizontal"
            margin={{ bottom: 40, left: 0, right: 20, top: 10 }}
            series={[
              { color: '#1976d2', data: avgData, label: 'Avg latency (ms)' },
              { color: '#90caf9', data: maxData, label: 'Max latency (ms)' },
            ]}
            xAxis={[{ label: 'Latency (ms)', tickLabelStyle: { fontSize: 11 } }]}
            yAxis={[
              {
                categoryGapRatio: 0.5,
                data: apiNames,
                scaleType: 'band',
                tickLabelStyle: { fontSize: 11, textAnchor: 'end', textTransform: 'none' },
                width: 160,
              },
            ]}
          />
        )}
      </Box>
      <Divider />
      {/* WebRTC metrics section */}
      <Box
        data-section="webrtc-metrics"
        ref={(el: HTMLDivElement | null) => {
          sectionRef.current['webrtc-metrics'] = el;
        }}
        sx={{ scrollMarginTop: '56px' }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
            variant="subtitle1"
          >
            WebRTC Metrics
          </Typography>
          {(hasPacketLoss || hasAnyFailure) && (
            <Chip color="warning" label="Packet loss or failure detected" size="small" />
          )}
        </Stack>
        <Typography
          sx={{
            color: 'text.secondary',
            mb: 1,
          }}
          variant="body2"
        >
          Audio levels, packet statistics, and network quality per stream direction during the softphone call.{' '}
          <Link
            component="button"
            onClick={() => {
              setWebrtcInfoOpen((prev) => !prev);
            }}
            sx={{ verticalAlign: 'baseline' }}
            underline="hover"
            variant="body2"
          >
            {webrtcInfoOpen ? 'Show less' : 'Learn more'}
          </Link>
        </Typography>
        <Collapse in={webrtcInfoOpen}>
          <Box
            component="ul"
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 1,
              color: 'text.secondary',
              mb: 1.5,
              mt: 0,
              pl: 4,
              pr: 2,
              py: 1,
            }}
          >
            {[
              'Audio Level \u2014 a unitless value sampled once per second; higher means louder. Input (green) is the agent\u2019s mic \u2014 a flat zero usually means muted. Output (purple) is what the agent hears from the caller.',
              'Packets \u2014 count (purple) shows total packets per sample; lost (red) shows packets that never arrived. Even 1\u20132% loss causes audible glitches or robotic audio.',
              'Jitter Buffer \u2014 compensates for network timing variations. Higher values mean more buffering to smooth uneven packet arrival.',
              'Round-Trip Time (RTT) \u2014 time for a packet to reach the media server and back. >300 ms causes noticeable delay. Only available on the output stream.',
              'Use the Input/Output tabs to compare each stream direction. The time range slider lets you zoom into a portion of the call.',
            ].map((item) => (
              <Typography component="li" key={item} sx={{ mb: 0.25 }} variant="body2">
                {item}
              </Typography>
            ))}
          </Box>
        </Collapse>
        {hasSoftphoneData ? (
          <>
            {/* Input/Output sub-tabs */}
            <SegmentedTabsCompact
              onChange={(_e: SyntheticEvent, v: WebRtcStreamTab) => {
                setWebrtcStreamTab(v);
              }}
              sx={{ mb: 2, position: 'relative', zIndex: 1 }}
              value={webrtcStreamTab}
            >
              <SegmentedTabCompact label="Output (Speaker)" value="audio_output" />
              <SegmentedTabCompact label="Input (Mic)" value="audio_input" />
            </SegmentedTabsCompact>

            {/* Time range zoom slider */}
            {overallTimeBounds[0] < overallTimeBounds[1] && (
              <Box
                sx={{
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  mb: 2,
                  px: 2,
                  py: 1.5,
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Typography color="text.secondary" sx={{ flexShrink: 0 }} variant="caption">
                    Time range:
                  </Typography>
                  <Slider
                    disableSwap
                    marks={sliderMarks}
                    max={overallTimeBounds[1]}
                    min={overallTimeBounds[0]}
                    onChange={(_e, value) => {
                      const [start, end] = value as [number, number];
                      setZoomRange([start, end]);
                    }}
                    size="small"
                    sx={{ flex: 1, mx: 1 }}
                    value={zoomRange}
                    valueLabelDisplay="off"
                  />
                  {(zoomRange[0] > overallTimeBounds[0] || zoomRange[1] < overallTimeBounds[1]) && (
                    <Button
                      onClick={() => {
                        setZoomRange(overallTimeBounds);
                      }}
                      size="small"
                      variant="text"
                    >
                      Reset
                    </Button>
                  )}
                </Stack>
              </Box>
            )}

            {zoomedMetrics.length === 0 ? (
              <EmptyMetric message="No data points in the selected range." />
            ) : (
              <Stack sx={{ gap: 3 }}>
                {/* Audio Level chart */}
                <Box>
                  <Typography sx={{ fontWeight: 'bold', mb: 0.5 }} variant="subtitle1">
                    Audio Level
                  </Typography>
                  <LineChart
                    height={200}
                    margin={{ bottom: 22, left: 16, right: 20 }}
                    series={[
                      {
                        color: webrtcStreamTab === 'audio_input' ? '#43a047' : '#8884d8',
                        curve: 'linear',
                        data: zoomedMetrics.map((p) => p.audioLevel),
                        label: 'Audio Level',
                        showMark: false,
                      },
                    ]}
                    xAxis={[
                      {
                        data: zoomedDates,
                        scaleType: 'time',
                        tickLabelStyle: { fontSize: 10 },
                        valueFormatter: (value: Date) =>
                          value.toLocaleTimeString([], {
                            hour: '2-digit',
                            hour12: false,
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: 'UTC',
                          }),
                      },
                    ]}
                    yAxis={[
                      {
                        label: 'Level',
                        valueFormatter: (v: number) =>
                          v >= 10_000
                            ? `${String(Math.round(v / 1_000))}k`
                            : v >= 1_000
                              ? `${(v / 1_000).toFixed(1)}k`
                              : String(Math.round(v)),
                      },
                    ]}
                  />
                </Box>

                <Divider />

                {/* Packets chart */}
                <Box>
                  <Typography sx={{ fontWeight: 'bold', mb: 0.5 }} variant="subtitle1">
                    Packets
                  </Typography>
                  <LineChart
                    height={200}
                    margin={{ bottom: 22, left: 16, right: 20 }}
                    series={[
                      {
                        color: '#8884d8',
                        curve: 'linear',
                        data: zoomedMetrics.map((p) => p.packetsCount),
                        label: 'Packets count',
                        showMark: false,
                      },
                      {
                        color: '#d32f2f',
                        connectNulls: false,
                        curve: 'linear',
                        data: zoomedMetrics.map((p) => (p.packetsLost > 0 ? p.packetsLost : null)),
                        label: 'Packets lost',
                        showMark: true,
                      },
                    ]}
                    xAxis={[
                      {
                        data: zoomedDates,
                        scaleType: 'time',
                        tickLabelStyle: { fontSize: 10 },
                        valueFormatter: (value: Date) =>
                          value.toLocaleTimeString([], {
                            hour: '2-digit',
                            hour12: false,
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: 'UTC',
                          }),
                      },
                    ]}
                    yAxis={[
                      {
                        label: 'Packets',
                        valueFormatter: (v: number) =>
                          v >= 10_000
                            ? `${String(Math.round(v / 1_000))}k`
                            : v >= 1_000
                              ? `${(v / 1_000).toFixed(1)}k`
                              : String(Math.round(v)),
                      },
                    ]}
                  />
                </Box>

                <Divider />

                {/* Jitter Buffer & RTT chart */}
                <Box>
                  <Typography sx={{ fontWeight: 'bold', mb: 0.5 }} variant="subtitle1">
                    {webrtcStreamTab === 'audio_output' ? 'Jitter Buffer & Round-Trip Time' : 'Jitter Buffer'}
                  </Typography>
                  <LineChart
                    height={200}
                    margin={{ bottom: 22, left: 16, right: 20 }}
                    series={[
                      {
                        color: '#990099',
                        curve: 'linear',
                        data: zoomedMetrics.map((p) => p.jitterBufferMs),
                        label: 'Jitter buffer (ms)',
                        showMark: false,
                      },
                      ...(webrtcStreamTab === 'audio_output'
                        ? [
                            {
                              color: '#ff9933',
                              curve: 'linear' as const,
                              data: zoomedMetrics.map((p) => p.roundTripTimeMs),
                              label: 'Round-trip (ms)',
                              showMark: false,
                            },
                          ]
                        : []),
                    ]}
                    xAxis={[
                      {
                        data: zoomedDates,
                        scaleType: 'time',
                        tickLabelStyle: { fontSize: 10 },
                        valueFormatter: (value: Date) =>
                          value.toLocaleTimeString([], {
                            hour: '2-digit',
                            hour12: false,
                            minute: '2-digit',
                            second: '2-digit',
                            timeZone: 'UTC',
                          }),
                      },
                    ]}
                    yAxis={[{ label: 'ms', valueFormatter: (v: number) => String(Math.round(v)) }]}
                  />
                </Box>
              </Stack>
            )}

            {/* Call Summary section */}
            {softphoneReports.length > 0 && (
              <Box sx={{ mt: 3 }}>
                {/* Overall summary across all calls */}
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    mb: 2,
                    p: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 'bold', mb: 1 }} variant="subtitle2">
                    Call Summary
                  </Typography>
                  {overallCallSummary && (
                    <>
                      <Box
                        sx={{
                          columnGap: 3,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          rowGap: 0.5,
                        }}
                      >
                        {(
                          [
                            ['Total calls', String(overallCallSummary.totalCalls)],
                            ['Total duration', formatDuration(overallCallSummary.totalDurationMs)],
                            ['Avg duration', formatDuration(overallCallSummary.avgDurationMs)],
                            [
                              'Calls with failures',
                              overallCallSummary.totalFailures > 0 ? String(overallCallSummary.totalFailures) : 'None',
                            ],
                            [
                              'Avg mic acquisition',
                              `${String(overallCallSummary.avgGum)} / ${String(overallCallSummary.maxGum)} ms`,
                            ],
                            [
                              'Avg ICE collection',
                              `${String(overallCallSummary.avgIce)} / ${String(overallCallSummary.maxIce)} ms`,
                            ],
                            [
                              'Avg signalling',
                              `${String(overallCallSummary.avgSignalling)} / ${String(overallCallSummary.maxSignalling)} ms`,
                            ],
                            [
                              'Avg handshaking',
                              `${String(overallCallSummary.avgHandshaking)} / ${String(overallCallSummary.maxHandshaking)} ms`,
                            ],
                            [
                              'Avg pre-talking',
                              `${String(overallCallSummary.avgPreTalking)} / ${String(overallCallSummary.maxPreTalking)} ms`,
                            ],
                          ] satisfies [string, string][]
                        ).map(([label, value]) => (
                          <Box key={label} sx={{ display: 'flex', gap: 1 }}>
                            <Typography color="text.secondary" variant="caption">
                              {label}:
                            </Typography>
                            <Typography
                              color={
                                label === 'Calls with failures' && overallCallSummary.totalFailures > 0
                                  ? 'error.main'
                                  : undefined
                              }
                              variant="caption"
                            >
                              {value}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                      <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
                        Setup times shown as avg / max across all calls.
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Individual call accordions */}
                {softphoneReports.map((report, idx) => {
                  const callHasFailure = Object.entries(report).some(
                    ([key, val]) => key.endsWith('Failure') && val === true,
                  );
                  const hasHighSetupTime =
                    report.iceCollectionTimeMs > SETUP_WARNING_THRESHOLD ||
                    report.handshakingTimeMs > SETUP_WARNING_THRESHOLD ||
                    report.signallingConnectTimeMs > SETUP_WARNING_THRESHOLD ||
                    report.gumTimeMs > SETUP_WARNING_THRESHOLD ||
                    report.preTalkingTimeMs > SETUP_WARNING_THRESHOLD;
                  const isConcerning = callHasFailure || hasHighSetupTime;
                  const callStart = report.callStartTime
                    ? new Date(report.callStartTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        hour12: false,
                        minute: '2-digit',
                        second: '2-digit',
                        timeZone: 'UTC',
                      })
                    : '—';
                  const callEnd = report.callEndTime
                    ? new Date(report.callEndTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        hour12: false,
                        minute: '2-digit',
                        second: '2-digit',
                        timeZone: 'UTC',
                      })
                    : '—';
                  const durationSec = Math.round(report.talkingTimeMs / 1_000);
                  const durationMin = Math.floor(durationSec / 60);
                  const durationRemSec = durationSec % 60;
                  const durationStr =
                    durationMin > 0
                      ? `${String(durationMin)}m ${String(durationRemSec)}s`
                      : `${String(durationRemSec)}s`;

                  return (
                    <Accordion
                      defaultExpanded={softphoneReports.length <= 2}
                      key={`call-${String(idx)}`}
                      sx={{
                        '&::before': { display: 'none' },
                        ...(isConcerning && {
                          borderLeft: 3,
                          borderLeftColor: callHasFailure ? 'error.main' : 'warning.main',
                        }),
                      }}
                      variant="outlined"
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 'bold' }} variant="body2">
                            Call {String(idx + 1)}
                          </Typography>
                          <Typography color="text.secondary" variant="caption">
                            {callStart} → {callEnd} ({durationStr})
                          </Typography>
                          {callHasFailure && <Chip color="error" label="Failure" size="small" />}
                          {!callHasFailure && hasHighSetupTime && (
                            <Chip color="warning" label="High setup time" size="small" />
                          )}
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box
                          sx={{
                            columnGap: 3,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            rowGap: 0.5,
                          }}
                        >
                          {[
                            ['Call duration', `${(report.talkingTimeMs / 1_000).toFixed(0)}s`],
                            ['Mic acquisition', `${String(report.gumTimeMs)} ms`],
                            ['Initialisation', `${String(report.initializationTimeMs)} ms`],
                            ['ICE collection', `${String(report.iceCollectionTimeMs)} ms`],
                            ['Signalling', `${String(report.signallingConnectTimeMs)} ms`],
                            ['Handshaking', `${String(report.handshakingTimeMs)} ms`],
                            ['Pre-talking', `${String(report.preTalkingTimeMs)} ms`],
                          ].map(([label, value]) => (
                            <Box key={label} sx={{ display: 'flex', gap: 1 }}>
                              <Typography color="text.secondary" variant="caption">
                                {label}:
                              </Typography>
                              <Typography variant="caption">{value}</Typography>
                            </Box>
                          ))}
                        </Box>
                        {callHasFailure && (
                          <Box sx={{ mt: 1 }}>
                            <Typography color="error.main" variant="caption">
                              Failures:{' '}
                              {Object.entries(report)
                                .filter(([key, val]) => key.endsWith('Failure') && val === true)
                                .map(([key]) => key.replace('Failure', ''))
                                .join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}
          </>
        ) : (
          <EmptyMetric message="No softphone data found in this log (requires an active WebRTC call)." />
        )}
      </Box>
    </Stack>
  );
};

export default MetricsPanel;
