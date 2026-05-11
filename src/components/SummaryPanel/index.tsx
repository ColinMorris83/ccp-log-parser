import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CableOutlinedIcon from '@mui/icons-material/CableOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Box, Chip, Paper, Stack, Typography, type ChipProps } from '@mui/material';
import { type FC, type ReactElement, type ReactNode } from 'react';

import type { CcpLifecycleSection, HealthStatus, LogSummary, WebSocketSection } from '../../models/logSummary';

interface SummaryPanelProps {
  summary: LogSummary;
}

/** Maps a health status to its display colour (MUI palette key). */
const HEALTH_COLORS: Record<HealthStatus, string> = {
  error: 'error.main',
  healthy: 'success.main',
  unknown: 'text.disabled',
  warning: 'warning.main',
};

/** Maps a health status to a MUI Chip colour. */
const HEALTH_CHIP_COLORS: Record<HealthStatus, ChipProps['color']> = {
  error: 'error',
  healthy: 'success',
  unknown: 'default',
  warning: 'warning',
};

/** Maps a health status to its icon component. */
const HEALTH_ICONS: Record<HealthStatus, ReactElement> = {
  error: <ErrorOutlinedIcon fontSize="inherit" />,
  healthy: <CheckCircleOutlinedIcon fontSize="inherit" />,
  unknown: <HelpOutlinedIcon fontSize="inherit" />,
  warning: <WarningAmberOutlinedIcon fontSize="inherit" />,
};

/** Maps a health status to its human-readable label. */
const HEALTH_LABELS: Record<HealthStatus, string> = {
  error: 'Issues Detected',
  healthy: 'Healthy',
  unknown: 'No Data',
  warning: 'Warnings',
};

/**
 * Formats a duration in milliseconds as a human-readable string (e.g. "1h 23m 45s").
 *
 * @param ms - Duration in milliseconds.
 * @returns Formatted duration string.
 */
const formatDuration = (ms: number): string => {
  if (ms <= 0) return '0s';
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  const parts: string[] = [];
  if (hours > 0) parts.push(`${String(hours)}h`);
  if (minutes > 0) parts.push(`${String(minutes)}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${String(seconds)}s`);
  return parts.join(' ');
};

/**
 * Formats an ISO timestamp for display as HH:mm:ss UTC.
 *
 * @param isoTime - ISO 8601 timestamp string.
 * @returns Formatted time string, or '—' if empty.
 */
const formatTime = (isoTime: string): string => {
  if (!isoTime) return '—';
  return new Date(isoTime).toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  });
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SectionCardProps {
  children: ReactNode;
  health: HealthStatus;
  title: string;
  titleIcon: ReactNode;
}

/**
 * Renders a summary section card with a coloured health indicator header.
 *
 * @param root0 Component props.
 * @param root0.children Card body content.
 * @param root0.health Health status for the section.
 * @param root0.title Section title.
 * @param root0.titleIcon Icon rendered beside the title.
 * @returns JSX for the section card.
 */
const SectionCard: FC<SectionCardProps> = ({ children, health, title, titleIcon }) => (
  <Paper
    elevation={0}
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      overflow: 'hidden',
    }}
  >
    <Box
      sx={{
        alignItems: 'center',
        bgcolor: 'action.hover',
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        gap: 1,
        justifyContent: 'space-between',
        px: 2,
        py: 1,
      }}
    >
      <Box sx={{ alignItems: 'center', display: 'flex', gap: 0.75 }}>
        <Box sx={{ color: 'text.secondary', display: 'flex' }}>{titleIcon}</Box>
        <Typography sx={{ fontWeight: 'bold' }} variant="subtitle2">
          {title}
        </Typography>
      </Box>
      <Chip
        color={HEALTH_CHIP_COLORS[health]}
        icon={HEALTH_ICONS[health]}
        label={HEALTH_LABELS[health]}
        size="small"
        sx={{ fontWeight: 'bold' }}
        variant="outlined"
      />
    </Box>
    <Box sx={{ px: 2, py: 1.5 }}>{children}</Box>
  </Paper>
);

interface MetricRowProps {
  label: string;
  value: ReactNode;
}

/**
 * Renders a single label → value metric row.
 *
 * @param root0 Component props.
 * @param root0.label The metric label.
 * @param root0.value The metric value.
 * @returns JSX for a metric row.
 */
const MetricRow: FC<MetricRowProps> = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', py: 0.25 }}>
    <Typography color="text.secondary" variant="body2">
      {label}
    </Typography>
    <Typography sx={{ fontWeight: 500, textAlign: 'right' }} variant="body2">
      {value}
    </Typography>
  </Box>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Renders a diagnostic summary dashboard for a parsed CCP log.
 * Displays health status cards for each log analysis category with
 * traffic-light indicators (healthy/warning/error/unknown).
 *
 * This is the standalone version — it covers 6 infrastructure sections
 * (agent, API, clock, contacts, softphone) without namespace-dependent data.
 *
 * @param root0 Component props.
 * @param root0.summary The LogSummary produced by buildLogSummary().
 * @returns JSX for the summary panel.
 */
const SummaryPanel: FC<SummaryPanelProps> = ({ summary }) => {
  const { agent, apiHealth, clockHealth, contacts, overallHealth, sessionWindow, softphoneHealth } = summary;
  const ccpLifecycle: CcpLifecycleSection = summary.ccpLifecycle;
  const webSocket: WebSocketSection = summary.webSocket;

  return (
    <Stack sx={{ gap: 3 }}>
      {/* Overall health banner */}
      <Paper
        elevation={0}
        sx={{
          alignItems: 'center',
          border: '2px solid',
          borderColor: HEALTH_COLORS[overallHealth],
          borderRadius: 2,
          display: 'flex',
          gap: 2,
          px: 3,
          py: 2,
        }}
      >
        <Box sx={{ color: HEALTH_COLORS[overallHealth], display: 'flex' }}>
          {overallHealth === 'error' && <ErrorOutlinedIcon sx={{ fontSize: 40 }} />}
          {overallHealth === 'warning' && <WarningAmberOutlinedIcon sx={{ fontSize: 40 }} />}
          {overallHealth === 'healthy' && <CheckCircleOutlinedIcon sx={{ fontSize: 40 }} />}
          {overallHealth === 'unknown' && <HelpOutlinedIcon sx={{ fontSize: 40 }} />}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 'bold' }} variant="h6">
            {HEALTH_LABELS[overallHealth]}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {sessionWindow.entryCount.toLocaleString()} entries over {formatDuration(sessionWindow.durationMs)}
            {sessionWindow.startTime &&
              ` (${formatTime(sessionWindow.startTime)} — ${formatTime(sessionWindow.endTime)} UTC)`}
          </Typography>
          {(sessionWindow.errorCount > 0 || sessionWindow.warnCount > 0) && (
            <Stack direction="row" sx={{ gap: 1, mt: 0.5 }}>
              {sessionWindow.errorCount > 0 && (
                <Chip color="error" label={`${String(sessionWindow.errorCount)} errors`} size="small" />
              )}
              {sessionWindow.warnCount > 0 && (
                <Chip color="warning" label={`${String(sessionWindow.warnCount)} warnings`} size="small" />
              )}
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Section cards grid */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        }}
      >
        {/* CCP Lifecycle */}
        <SectionCard
          health={ccpLifecycle.health}
          title="CCP Lifecycle"
          titleIcon={<PowerSettingsNewOutlinedIcon fontSize="small" />}
        >
          <MetricRow label="Initialised" value={ccpLifecycle.initialised ? 'Yes' : 'No'} />
          {ccpLifecycle.iframeInitTimeMs !== null && (
            <MetricRow label="Iframe init time" value={`${ccpLifecycle.iframeInitTimeMs.toLocaleString()} ms`} />
          )}
          {ccpLifecycle.streamsVersion && <MetricRow label="StreamsJS" value={ccpLifecycle.streamsVersion} />}
          {ccpLifecycle.ccpVersion && <MetricRow label="CCP Streams" value={ccpLifecycle.ccpVersion} />}
          {ccpLifecycle.browser && <MetricRow label="Browser" value={ccpLifecycle.browser} />}
        </SectionCard>

        {/* WebSocket */}
        <SectionCard health={webSocket.health} title="WebSocket" titleIcon={<CableOutlinedIcon fontSize="small" />}>
          <MetricRow label="Connections opened" value={String(webSocket.connectionOpenCount)} />
          <MetricRow label="Connections closed" value={String(webSocket.connectionCloseCount)} />
          <MetricRow label="Deep heartbeats" value={String(webSocket.deepHeartbeatCount)} />
          {webSocket.scheduledReconnections > 0 && (
            <MetricRow label="Scheduled reconnections" value={String(webSocket.scheduledReconnections)} />
          )}
        </SectionCard>

        {/* Contacts */}
        <SectionCard
          health={contacts.health}
          title="Contacts"
          titleIcon={<ContactPhoneOutlinedIcon fontSize="small" />}
        >
          <MetricRow label="Total detected" value={String(contacts.total)} />
        </SectionCard>

        {/* Agent */}
        <SectionCard health={agent.health} title="Agent" titleIcon={<SupportAgentOutlinedIcon fontSize="small" />}>
          <MetricRow label="Snapshots" value={String(agent.snapshotCount)} />
          <MetricRow label="State changes" value={String(agent.stateChangeCount)} />
        </SectionCard>

        {/* API Health */}
        <SectionCard health={apiHealth.health} title="AWS API Calls" titleIcon={<CloudOutlinedIcon fontSize="small" />}>
          <MetricRow label="Total calls" value={String(apiHealth.totalCalls)} />
          <MetricRow
            label="Avg latency"
            value={apiHealth.totalCalls > 0 ? `${apiHealth.avgLatencyMs.toLocaleString()} ms` : '—'}
          />
          <MetricRow
            label="Max latency"
            value={apiHealth.totalCalls > 0 ? `${apiHealth.maxLatencyMs.toLocaleString()} ms` : '—'}
          />
          {apiHealth.failedCalls > 0 && (
            <MetricRow
              label="Failed calls"
              value={
                <Typography color="error.main" component="span" variant="body2">
                  {apiHealth.failedCalls}
                </Typography>
              }
            />
          )}
          {apiHealth.staleSendCount > 0 && (
            <MetricRow label="Orphaned sends" value={String(apiHealth.staleSendCount)} />
          )}
        </SectionCard>

        {/* Clock Health */}
        <SectionCard
          health={clockHealth.health}
          title="Clock Skew"
          titleIcon={<AccessTimeOutlinedIcon fontSize="small" />}
        >
          <MetricRow label="Samples" value={String(clockHealth.sampleCount)} />
          <MetricRow
            label="Avg skew"
            value={clockHealth.sampleCount > 0 ? `${clockHealth.avgSkewMs.toLocaleString()} ms` : '—'}
          />
          <MetricRow
            label="Max skew"
            value={
              clockHealth.sampleCount > 0 ? (
                <Typography
                  color={clockHealth.maxSkewMs > 1_000 ? 'warning.main' : undefined}
                  component="span"
                  variant="body2"
                >
                  {clockHealth.maxSkewMs.toLocaleString()} ms
                </Typography>
              ) : (
                '—'
              )
            }
          />
        </SectionCard>

        {/* Softphone Health */}
        <SectionCard
          health={softphoneHealth.health}
          title="Softphone"
          titleIcon={<PhoneInTalkOutlinedIcon fontSize="small" />}
        >
          <MetricRow label="Calls" value={String(softphoneHealth.callCount)} />
          {softphoneHealth.callCount > 0 && (
            <>
              <MetricRow label="Avg talking time" value={formatDuration(softphoneHealth.avgTalkingMs)} />
              {softphoneHealth.failureCount > 0 && (
                <MetricRow
                  label="Calls with failures"
                  value={
                    <Typography color="error.main" component="span" variant="body2">
                      {softphoneHealth.failureCount}
                    </Typography>
                  }
                />
              )}
              <MetricRow
                label="Packet loss"
                value={
                  softphoneHealth.packetLossDetected ? (
                    <Typography color="warning.main" component="span" variant="body2">
                      Detected
                    </Typography>
                  ) : (
                    'None'
                  )
                }
              />
            </>
          )}
        </SectionCard>
      </Box>
    </Stack>
  );
};

export default SummaryPanel;
