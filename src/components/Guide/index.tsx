import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Fab,
  Fade,
  IconButton,
  Link as MuiLink,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { type FC, useCallback, useEffect, useRef, useState } from 'react';

import { buildConfig } from '../../config';

/**
 * Reusable section heading with an anchor id for deep linking.
 *
 * @param root0 Component props.
 * @param root0.children Section body content.
 * @param root0.id HTML id for anchor linking.
 * @param root0.title Section heading text.
 * @returns JSX for the section.
 */
const Section: FC<{ children: React.ReactNode; id: string; title: string }> = ({ children, id, title }) => (
  <Box id={id} sx={{ scrollMarginTop: '80px' }}>
    <Typography sx={{ fontWeight: 700, mb: 1.5 }} variant="h5">
      {title}
    </Typography>
    {children}
  </Box>
);

/**
 * Styled inline code span.
 *
 * @param root0 Component props.
 * @param root0.children Code text content.
 * @returns JSX for the inline code element.
 */
const Code: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component="code"
    sx={{
      bgcolor: 'action.hover',
      borderRadius: 0.5,
      fontFamily: 'monospace',
      fontSize: '0.85em',
      px: 0.75,
      py: 0.25,
    }}
  >
    {children}
  </Box>
);

/**
 * Styled code block for multi-line code examples.
 *
 * @param root0 Component props.
 * @param root0.children Code text content.
 * @returns JSX for the code block element.
 */
const CodeBlock: FC<{ children: string }> = ({ children }) => (
  <Box
    component="pre"
    sx={{
      bgcolor: 'action.hover',
      borderRadius: 1,
      fontFamily: 'monospace',
      fontSize: '0.82em',
      lineHeight: 1.6,
      my: 1.5,
      overflow: 'auto',
      px: 2,
      py: 1.5,
    }}
  >
    {children}
  </Box>
);

/**
 * Bullet list with consistent styling.
 *
 * @param root0 Component props.
 * @param root0.items Array of text items to render as list items.
 * @returns JSX for the unordered list.
 */
const BulletList: FC<{ items: string[] }> = ({ items }) => (
  <Box component="ul" sx={{ mb: 2, mt: 0.5, pl: 3 }}>
    {items.map((item) => (
      <Typography component="li" key={item} sx={{ mb: 0.5 }} variant="body2">
        {item}
      </Typography>
    ))}
  </Box>
);

/**
 * Screenshot image with rounded corners, border, and a caption.
 *
 * @param root0 Component props.
 * @param root0.alt Alt text for the image.
 * @param root0.caption Caption text displayed below the image.
 * @param root0.src Image source URL.
 * @returns JSX for the screenshot figure.
 */
const Screenshot: FC<{ alt: string; caption: string; src: string }> = ({ alt, caption, src }) => (
  <Box sx={{ my: 2 }}>
    <Box
      alt={alt}
      component="img"
      src={src}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        display: 'block',
        maxWidth: '100%',
      }}
    />
    <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="caption">
      {caption}
    </Typography>
  </Box>
);

/**
 * Scrolls to a section by its HTML id.
 *
 * @param id - The element id to scroll to.
 */
const scrollToSection = (id: string): void => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/** Scroll threshold (px) before the back-to-top button appears. */
const SCROLL_THRESHOLD = 300;

/**
 * Built-in usage guide and documentation page.
 * Covers CCP log concepts, tool features, filtering, metrics interpretation,
 * and troubleshooting — adapted from Amazon Connect documentation.
 *
 * @returns JSX for the guide page.
 */
const Guide: FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = (): void => {
      setShowScrollTop(container.scrollTop > SCROLL_THRESHOLD);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ behavior: 'smooth', top: 0 });
  }, []);

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        p: 3,
        position: 'relative',
      }}
    >
      <Card sx={{ maxWidth: 1100, mx: 'auto' }}>
        <CardContent sx={{ p: { md: 5, xs: 3 } }}>
          <Stack sx={{ gap: 4 }}>
            {/* Header */}
            <Box>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2 }}>
                <Tooltip arrow title="Back to parser">
                  <IconButton component={Link} size="small" to="/">
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography component="h1" sx={{ fontWeight: 800 }} variant="h4">
                  Usage Guide
                </Typography>
              </Stack>
              <Typography color="text.secondary" variant="body1">
                A comprehensive guide to parsing, filtering, and debugging Amazon Connect CCP log files with this tool.
              </Typography>
            </Box>

            {/* Table of contents */}
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, px: 3, py: 2 }}>
              <Typography sx={{ fontWeight: 700, mb: 1 }} variant="subtitle2">
                Contents
              </Typography>
              <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                {[
                  { id: 'what-are-ccp-logs', label: 'What are CCP Logs?' },
                  { id: 'getting-started', label: 'Getting Started' },
                  { id: 'summary-dashboard', label: 'Summary Dashboard' },
                  { id: 'log-table', label: 'Log Table' },
                  { id: 'snapshots', label: 'Snapshots' },
                  { id: 'metrics-charts', label: 'Metrics Charts' },
                  { id: 'webrtc-metrics', label: 'WebRTC Metrics' },
                  { id: 'custom-filters', label: 'Custom Filters' },
                  { id: 'troubleshooting', label: 'Troubleshooting Guide' },
                ].map((item) => (
                  <Typography component="li" key={item.id} sx={{ mb: 0.25 }} variant="body2">
                    <MuiLink
                      component="button"
                      onClick={() => scrollToSection(item.id)}
                      sx={{ verticalAlign: 'baseline' }}
                      underline="hover"
                      variant="body2"
                    >
                      {item.label}
                    </MuiLink>
                  </Typography>
                ))}
              </Box>
            </Box>

            <Divider />

            {/* 1. What are CCP Logs? */}
            <Section id="what-are-ccp-logs" title="What are CCP Logs?">
              <Typography sx={{ mb: 1 }} variant="body2">
                Agents use the Amazon Connect Contact Control Panel (CCP) to interact with customer contacts — receiving
                calls, chatting, transferring, placing holds, and more. The CCP continuously writes diagnostic log
                entries that capture API calls, agent state transitions, WebSocket events, softphone metrics, and
                errors.
              </Typography>
              <Typography sx={{ mb: 1 }} variant="body2">
                These logs are the primary tool for troubleshooting CCP-related issues. They can be downloaded from the
                browser console or exported via the CCP&apos;s built-in download mechanism (typically saved as{' '}
                <Code>agent-log.txt</Code>).
              </Typography>
              <Typography variant="body2">
                This tool parses raw CCP log files into a structured, searchable format — making it easy to identify
                errors, inspect metrics, and diagnose connectivity or call quality problems.
              </Typography>
            </Section>

            <Divider />

            {/* 2. Getting Started */}
            <Section id="getting-started" title="Getting Started">
              <Typography sx={{ fontWeight: 600, mb: 0.5 }} variant="subtitle2">
                Loading files
              </Typography>
              <BulletList
                items={[
                  'Drag and drop one or more CCP log files onto the drop zone, or click "Choose file" to use the file picker.',
                  'Up to 4 files can be loaded simultaneously — each appears as a tab at the top of the page.',
                  'Click a file tab to switch between loaded logs. Click the × on a tab to remove it.',
                  'You can drag additional files onto the page at any time (a blue overlay appears when dragging).',
                ]}
              />
              <Screenshot
                alt="Drop zone"
                caption="Drag and drop CCP log files or use the file picker."
                src={`${buildConfig.basePath}images/dropzone.png`}
              />

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                Navigating views
              </Typography>
              <Typography sx={{ mb: 1 }} variant="body2">
                Each loaded file has three views, toggled via the compact tab bar below the file tabs:
              </Typography>
              <BulletList
                items={[
                  'Summary — the default view when a file is loaded. Shows an at-a-glance health dashboard with traffic-light cards for each infrastructure area.',
                  'Snapshots & Log — the snapshot sidebar and filterable log table.',
                  'Metrics — charts for clock skew, API latency, and WebRTC softphone quality.',
                ]}
              />
              <Typography sx={{ mb: 1 }} variant="body2">
                Summary chips in the top-right show total entries, errors, warnings, API calls, and contacts at a
                glance. Click the error or warning chips to filter the log table instantly.
              </Typography>

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                Theme
              </Typography>
              <Typography sx={{ mb: 1 }} variant="body2">
                Toggle between light and dark mode using the theme switch in the header bar. Your preference is
                remembered across sessions.
              </Typography>
              <Screenshot
                alt="Dark mode"
                caption="Dark mode — toggle via the theme switch in the header bar."
                src={`${buildConfig.basePath}images/dark-mode.png`}
              />
            </Section>

            <Divider />

            {/* 3. Summary Dashboard */}
            <Section id="summary-dashboard" title="Summary Dashboard">
              <Typography sx={{ mb: 1 }} variant="body2">
                The Summary tab is the first thing you see after loading a log file. It provides a quick health
                assessment across seven infrastructure areas, so you can immediately tell whether the session was
                healthy or where to dig deeper.
              </Typography>
              <Screenshot
                alt="Summary dashboard"
                caption="The Summary tab — at-a-glance health assessment with traffic-light cards for each infrastructure area."
                src={`${buildConfig.basePath}images/summary-tab.png`}
              />

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                Overall health banner
              </Typography>
              <Typography sx={{ mb: 1 }} variant="body2">
                The banner at the top shows the overall verdict — <strong>Healthy</strong>,{' '}
                <strong>Warnings Detected</strong>, <strong>Issues Detected</strong>, or <strong>No Data</strong> —
                along with the session duration and total entry/error/warning counts.
              </Typography>

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                Section cards
              </Typography>
              <Typography sx={{ mb: 0.5 }} variant="body2">
                Below the banner, each card represents an infrastructure area with a traffic-light health chip:
              </Typography>
              <BulletList
                items={[
                  'CCP Lifecycle — whether the CCP initialised successfully, iframe init time, StreamsJS and CCP Streams versions, and detected browser.',
                  'WebSocket — connection open/close counts, deep heartbeat activity, and any scheduled reconnections.',
                  'Contacts — total contacts detected in the session.',
                  'Agent — snapshot count and number of agent state transitions.',
                  'AWS API Calls — total calls, average/max latency, failed calls, and orphaned sends.',
                  'Clock Skew — sample count, average and maximum skew between workstation and server clocks.',
                  'Softphone — call count, average talking time, failure count, and packet loss detection.',
                ]}
              />

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                Health indicators
              </Typography>
              <BulletList
                items={[
                  'Healthy (green) — everything looks normal for that section.',
                  'Warning (amber) — non-critical issues detected (e.g. high clock skew, elevated API latency, packet loss).',
                  'Error (red) — problems that likely affected the agent experience (e.g. API failures, softphone failures).',
                  'No Data (grey) — no relevant log entries found for that section.',
                ]}
              />
            </Section>

            <Divider />

            {/* 4. Log Table */}

            <Section id="log-table" title="Log Table">
              <Typography sx={{ mb: 1 }} variant="body2">
                The log table shows each log entry as a single row. The format of each entry is:
              </Typography>
              <CodeBlock>{'<time> <component> <level> <text>'}</CodeBlock>
              <Screenshot
                alt="Log table"
                caption="Sortable, filterable log entries with snapshot navigation and inline exception details."
                src={`${buildConfig.basePath}images/log-table.png`}
              />

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                Filtering
              </Typography>
              <Typography sx={{ mb: 0.5 }} variant="body2">
                You can filter log entries in several ways:
              </Typography>
              <BulletList
                items={[
                  'By keyword — type a regular expression in the search box. For example, enter a Contact ID to see all entries for that contact, or use "SESSION|SIGNALING" to match multiple terms.',
                  'By log level — select ERROR, WARN, INFO, TRACE, DEBUG, or LOG. Only entries at or above the selected level are shown.',
                  'By contact — use the contact dropdown to isolate entries for a specific contact session.',
                  'By source — use the source filter dropdown to show only entries matching a custom prefix (e.g. "softphone", "ccp").',
                ]}
              />

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                Expanding entries
              </Typography>
              <Typography variant="body2">
                Some log entries contain additional detail (e.g. full JSON objects or exception stacks). Click the
                expand icon on the left of a row to reveal the original log object. Entries that were modified for
                readability show the raw text under <Code>_originalText</Code>.
              </Typography>
            </Section>

            <Divider />

            {/* 5. Snapshots */}
            <Section id="snapshots" title="Snapshots">
              <Typography sx={{ mb: 1 }} variant="body2">
                The CCP periodically retrieves an <Code>AgentSnapshot</Code> from Amazon Connect. Each snapshot contains
                the agent&apos;s current state (Available, Busy, AfterCallWork, etc.), active contacts, and clock skew
                information.
              </Typography>
              <Typography sx={{ mb: 1 }} variant="body2">
                The snapshot sidebar lists every snapshot extracted from the log, showing the agent state name at that
                point. Clicking a snapshot highlights all log entries between that snapshot and the next one, making it
                easy to see what happened during a specific state period.
              </Typography>
              <Typography sx={{ mb: 1 }} variant="body2">
                Click the same snapshot again to clear the highlight and return to the full log.
              </Typography>
              <Screenshot
                alt="Snapshot highlight"
                caption="Clicking a snapshot highlights the corresponding log entries and shows the agent state."
                src={`${buildConfig.basePath}images/snapshot-highlight.png`}
              />
            </Section>

            <Divider />

            {/* 6. Metrics Charts */}
            <Section id="metrics-charts" title="Metrics Charts">
              <Typography sx={{ mb: 1 }} variant="body2">
                Switch to the <strong>Metrics</strong> tab to see visual charts derived from the log data. Four sections
                are available, navigable via sticky tabs at the top:
              </Typography>
              <Screenshot
                alt="Metrics charts"
                caption="Clock skew, API latency, and WebRTC softphone metrics with interactive tooltips and time-range zoom."
                src={`${buildConfig.basePath}images/metrics.png`}
              />

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                Clock Skew
              </Typography>
              <Typography sx={{ mb: 0.5 }} variant="body2">
                Shows the difference between the agent workstation clock and the Amazon Connect server clock over time.
                Coloured background bands indicate the agent state during each period.
              </Typography>
              <BulletList
                items={[
                  'Ahead — the local clock is ahead of the server; timestamps appear in the future from the server\u2019s perspective.',
                  'Behind — the local clock is behind the server; events may appear to arrive late.',
                  'A skew exceeding \u00B11,000 ms (shown in red) can cause missed state transitions, phantom \u201Cmissed\u201D contacts, and inaccurate reporting.',
                  'Common causes: NTP misconfiguration, VM clock drift, VPN latency.',
                ]}
              />

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                API Latency Over Time
              </Typography>
              <Typography sx={{ mb: 0.5 }} variant="body2">
                Each point represents a single API call (request to response) and how long it took. Purple dots are
                successful; red dots are failed calls.
              </Typography>
              <BulletList
                items={[
                  'Sudden spikes may indicate network congestion, server-side throttling, or DNS issues.',
                  'Sustained high latency (>1,000 ms) can degrade the agent experience — slow screen pops, delayed state changes.',
                  'getAgentSnapshot polling calls are excluded (already represented in the skew chart).',
                ]}
              />

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                API Call Latency (Aggregated)
              </Typography>
              <Typography sx={{ mb: 0.5 }} variant="body2">
                A horizontal bar chart showing average and maximum latency per API call type, sorted by average. Hover a
                bar to see the call count.
              </Typography>
              <BulletList
                items={[
                  'A large gap between average and max suggests occasional outlier spikes rather than constant slowness.',
                  'A "Slow or failed calls detected" warning chip appears when any API averages above 500 ms or has failures.',
                ]}
              />
            </Section>

            <Divider />

            {/* 7. WebRTC Metrics */}
            <Section id="webrtc-metrics" title="WebRTC Metrics">
              <Typography sx={{ mb: 1 }} variant="body2">
                When a softphone call is present in the log, the WebRTC Metrics section shows audio quality data per
                stream direction (Output/Speaker and Input/Mic). Three charts are shown per stream:
              </Typography>

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1.5 }}>
                <Chip label="Audio Level" size="small" variant="outlined" />
                <Chip label="Packets" size="small" variant="outlined" />
                <Chip label="Jitter Buffer & RTT" size="small" variant="outlined" />
              </Stack>

              <BulletList
                items={[
                  'Audio Level \u2014 a unitless value sampled once per second. Higher means louder. A flat zero on the input stream usually means the agent is muted.',
                  'Packets \u2014 total packet count (purple) and lost packets (red). Even 1\u20132% packet loss causes audible glitches or robotic audio.',
                  'Jitter Buffer \u2014 compensates for network timing variations. Higher values mean more buffering to smooth uneven packet arrival.',
                  'Round-Trip Time (RTT) \u2014 time for a packet to reach the media server and return. Only available on the output stream. >300 ms causes noticeable delay.',
                ]}
              />
              <Screenshot
                alt="WebRTC metrics"
                caption="WebRTC softphone metrics with Input/Output sub-tabs, zoom slider, and call summary."
                src={`${buildConfig.basePath}images/metrics-web-rtc.png`}
              />

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                Time range zoom
              </Typography>
              <Typography sx={{ mb: 1 }} variant="body2">
                Use the slider above the charts to zoom into a portion of the call. The range is shared across
                Input/Output tabs and preserved when switching. Click <strong>Reset</strong> to return to the full
                range.
              </Typography>

              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                Call Summary
              </Typography>
              <Typography variant="body2">
                Below the charts, the Call Summary card shows setup timings (mic acquisition, ICE collection,
                signalling, handshaking) and call duration from the end-of-call <Code>sendSoftphoneCallReport</Code>.
                Any failure flags are highlighted in red.
              </Typography>
            </Section>

            <Divider />

            {/* 8. Custom Filters */}
            <Section id="custom-filters" title="Custom Filters">
              <Typography sx={{ mb: 1 }} variant="body2">
                Custom filters let you isolate log entries by their text prefix. This is mainly useful if you have a
                custom CCP that writes to the Amazon Connect logger using your own prefix or namespaces — for example,{' '}
                <Code>CUSTOM_CCP: LIFECYCLE:</Code> or <Code>MY_APP: CHAT:</Code>. By creating filters for your custom
                prefixes, you can quickly isolate your application&apos;s log entries from the noise of Amazon
                Connect&apos;s own logging.
              </Typography>
              <Typography sx={{ mb: 1 }} variant="body2">
                They can also be used to filter by built-in CCP component names such as <Code>softphone</Code>,{' '}
                <Code>ccp</Code>, or <Code>signaling</Code>.
              </Typography>
              <BulletList
                items={[
                  'Open the filter manager via the filter icon in the header bar.',
                  'Add a filter by entering a label (display name) and a prefix (the text that matching log entries start with).',
                  'Once created, filters appear in the source filter dropdown on the log table toolbar.',
                  'Selecting a filter shows only entries whose text starts with that prefix.',
                  'Filters are persisted to localStorage — they survive page reloads and are shared across all loaded files.',
                  'Edit or delete filters from the filter manager dialog at any time.',
                ]}
              />
              <Screenshot
                alt="Custom filters dialog"
                caption="The filter manager dialog — create, edit, and delete custom source filters."
                src={`${buildConfig.basePath}images/filters.png`}
              />
            </Section>

            <Divider />

            {/* 9. Troubleshooting */}
            <Section id="troubleshooting" title="Troubleshooting Guide">
              <Typography sx={{ mb: 1.5 }} variant="body2">
                Below are common CCP connectivity problems and the log patterns to look for, adapted from the{' '}
                <Box
                  component="a"
                  href="https://docs.aws.amazon.com/connect/latest/adminguide/troubleshooting.html"
                  rel="noopener noreferrer"
                  sx={{ color: 'primary.main' }}
                  target="_blank"
                >
                  Amazon Connect troubleshooting guide
                </Box>
                .
              </Typography>

              {/* Signaling Denied */}
              <Typography sx={{ fontWeight: 600, mb: 0.5 }} variant="subtitle2">
                Signaling endpoint denied (TCP/443)
              </Typography>
              <Typography sx={{ mb: 0.5 }} variant="body2">
                When the agent workstation cannot reach the signaling endpoint, the CCP shows &quot;Initialization
                Failed&quot;. Look for repeated <Code>Initializing Websocket Manager</Code> entries with no successful
                connection, followed by <Code>WebSocketManager Error</Code>:
              </Typography>
              <CodeBlock>
                {[
                  'INFO  Initializing Websocket Manager',
                  'DEBUG [initWebSocket] Primary WebSocket: CONNECTING | Secondary WebSocket: NULL',
                  'DEBUG Scheduling WebSocket reinitialization, after delay 1489 ms',
                  'ERROR WebSocketManager Error, error_event: [object Event]',
                ].join('\n')}
              </CodeBlock>
              <Typography sx={{ mb: 1.5 }} variant="body2">
                If the connection initialises but then the agent accepts a call, you may see{' '}
                <Code>signalling_handshake_failure</Code> errors indicating the softphone cannot connect to the RTC
                signaling server.
              </Typography>

              {/* Media Denied */}
              <Typography sx={{ fontWeight: 600, mb: 0.5 }} variant="subtitle2">
                Media endpoint denied (UDP/3478)
              </Typography>
              <Typography sx={{ mb: 0.5 }} variant="body2">
                When UDP/3478 to the media (TURN) server is blocked, the CCP can detect incoming calls but accepting
                produces an <Code>ice_collection_timeout</Code> error:
              </Typography>
              <CodeBlock>
                {[
                  'WARN  SESSION ICE collection timed out',
                  'ERROR SESSION No ICE candidate',
                  'ERROR Softphone error occurred: ice_collection_timeout',
                ].join('\n')}
              </CodeBlock>

              {/* API Denied */}
              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 2 }} variant="subtitle2">
                Connect API endpoint denied (TCP/443)
              </Typography>
              <Typography sx={{ mb: 0.5 }} variant="body2">
                When the CCP cannot reach the Connect API, polling calls like <Code>getAgentSnapshot</Code> fail
                repeatedly and the agent cannot detect incoming contacts:
              </Typography>
              <CodeBlock>
                {[
                  "TRACE AWSClient: --> 'getAgentSnapshot'",
                  'ERROR Failed to get agent data.',
                  "TRACE AWSClient: <-- 'getAgentSnapshot' failed",
                ].join('\n')}
              </CodeBlock>
              <Typography variant="body2">
                Accepting or making calls will also fail with <Code>NetworkingError</Code> messages. The agent may end
                up in a &quot;Missed Call&quot; state if a contact was routed while the CCP was disconnected.
              </Typography>

              {/* General tips */}
              <Typography sx={{ fontWeight: 600, mb: 0.5, mt: 3 }} variant="subtitle2">
                General debugging tips
              </Typography>
              <BulletList
                items={[
                  'Start by checking the error and warning counts in the summary chips — click them to filter to just those entries.',
                  'Use the Clock Skew chart to verify the agent workstation clock is in sync. Skew >1,000 ms causes real problems.',
                  'Check API Latency for spikes or failures — sustained high latency degrades the agent experience.',
                  'For call quality issues, switch to WebRTC Metrics and look for packet loss, high jitter, or high RTT.',
                  'Use the contact filter to isolate a single contact session, then walk through the log chronologically.',
                  'Use regex search for specific patterns: e.g. "SIGNALING|SESSION" to track softphone session lifecycle.',
                ]}
              />
            </Section>
          </Stack>
        </CardContent>
      </Card>

      {/* Floating scroll-to-top button */}
      <Fade in={showScrollTop}>
        <Tooltip arrow title="Back to top">
          <Fab
            aria-label="scroll back to top"
            color="primary"
            onClick={handleScrollToTop}
            size="small"
            sx={{
              bottom: 24,
              float: 'right',
              mr: 1,
              position: 'sticky',
            }}
          >
            <KeyboardArrowUpIcon />
          </Fab>
        </Tooltip>
      </Fade>
    </Box>
  );
};

export default Guide;
