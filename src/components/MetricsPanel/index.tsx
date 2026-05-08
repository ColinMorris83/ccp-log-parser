import { Box, Chip, Stack, Typography } from '@mui/material';
import { useDrawingArea, useXScale } from '@mui/x-charts';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { type FC } from 'react';

import type { ApiLatencyPoint, SkewPoint } from '../../models/ccpLogParser';

/** Maximum skew (ms) before highlighting as problematic */
const SKEW_WARNING_THRESHOLD = 1_000;
/** Maximum API latency (ms) before highlighting as slow */
const LATENCY_WARNING_THRESHOLD = 500;

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

/** Minimal interface for the d3 point scale returned by useXScale */
interface PointScale {
  (value: string): number | undefined;
  step(): number;
}

interface StateBackgroundBandsProps {
  labels: string[];
  skewPoints: SkewPoint[];
}

/**
 * Renders coloured background bands as SVG rects inside a LineChart.
 *
 * @param root0 Component props.
 * @param root0.labels X-axis label array (same order as skewPoints).
 * @param root0.skewPoints Parsed skew data points with stateName.
 * @returns SVG rect elements, one per contiguous state period.
 */
const StateBackgroundBands: FC<StateBackgroundBandsProps> = ({ labels, skewPoints }) => {
  const { height, left, top, width } = useDrawingArea();
  const xScale = useXScale() as unknown as PointScale;

  const n = skewPoints.length;
  if (n === 0 || typeof xScale.step !== 'function') return null;

  const halfStep = xScale.step() / 2;
  const bands: { color: string; endX: number; startX: number }[] = [];
  let bandStart = 0;
  for (let i = 1; i <= n; i++) {
    if (i === n || skewPoints[i].stateName !== skewPoints[i - 1].stateName) {
      const x0 = xScale(labels[bandStart]) ?? left;
      const x1 = xScale(labels[Math.min(i - 1, n - 1)]) ?? left + width;
      bands.push({
        color: STATE_COLORS[skewPoints[bandStart].stateName] ?? DEFAULT_STATE_COLOR,
        endX: i < n ? x1 + halfStep : left + width,
        startX: bandStart > 0 ? x0 - halfStep : left,
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
 * - API call latency (BarChart): latency per API call, colour-coded by success/failure
 *
 * @param root0 Component props.
 * @param root0.apiLatency Array of API latency measurements.
 * @param root0.skewPoints Array of skew measurements over time.
 * @returns JSX for the metrics panel component.
 */
const MetricsPanel: FC<MetricsPanelProps> = ({ apiLatency, skewPoints }) => {
  const skewData = skewPoints.map((p) => p.skewMs);
  const maxSkew = Math.max(...skewData.map(Math.abs), 0);

  const labelFormat: Intl.DateTimeFormatOptions =
    skewPoints.length <= 15
      ? { hour: '2-digit', hour12: false, minute: '2-digit', second: '2-digit' }
      : { hour: '2-digit', hour12: false, minute: '2-digit' };
  const skewLabels = skewPoints.map((p, i) => {
    const base = new Date(p._ts).toLocaleTimeString([], labelFormat);
    return skewPoints.length <= 15 ? base : `${base}#${String(i)}`;
  });
  const tickEvery = Math.max(1, Math.floor(skewLabels.length / 10));

  const aggregated = Object.values(
    apiLatency.reduce<
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

  return (
    <Stack
      sx={{
        gap: 4,
      }}
    >
      {/* Skew chart */}
      <Box>
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
            <Chip color="warning" label={`Max skew: ${maxSkew.toLocaleString()} ms`} size="small" />
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
          values can cause state transition problems.
        </Typography>
        {skewPoints.length === 0 ? (
          <EmptyMetric message="No skew data found in this log (requires GET_AGENT_SNAPSHOT entries with skew values)." />
        ) : (
          <>
            <LineChart
              height={280}
              margin={{ bottom: 22, left: 30, right: 40 }}
              series={[
                {
                  color: maxSkew > SKEW_WARNING_THRESHOLD ? '#d32f2f' : '#1976d2',
                  data: skewData,
                  label: 'Skew (ms)',
                  showMark: skewData.length < 50,
                },
              ]}
              xAxis={[
                {
                  data: skewLabels,
                  scaleType: 'point',
                  tickLabelInterval: (_v: unknown, i: number) => i % tickEvery === 0,
                  tickLabelStyle: { fontSize: 10 },
                  valueFormatter: (value: string) => value.split('#')[0],
                },
              ]}
              yAxis={[{ label: 'ms' }]}
            >
              <StateBackgroundBands labels={skewLabels} skewPoints={skewPoints} />
            </LineChart>
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
      {/* API latency chart */}
      <Box>
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
            API Call Latency
          </Typography>
          {hasSlowOrFailed && <Chip color="warning" label="Slow or failed calls detected" size="small" />}
        </Stack>
        <Typography
          sx={{
            color: 'text.secondary',
            mb: 2,
          }}
          variant="body2"
        >
          Average and max latency per API call type, sorted by average. Hover a bar to see call count.
        </Typography>
        {apiLatency.length === 0 ? (
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
            xAxis={[{ label: 'Latency (ms)' }]}
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
    </Stack>
  );
};

export default MetricsPanel;
