import AddCircleIcon from '@mui/icons-material/AddCircle';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import {
  Box,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { styled, type SxProps, type Theme } from '@mui/material/styles';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_RowVirtualizer,
} from 'material-react-table';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';

import { MrtThemeProvider } from '../MrtThemeProvider';
import { useMrtTheme } from '../../hooks/useMrtTheme';
import {
  LogLevelNumeric,
  type ContactSummary,
  type CustomFilter,
  type EnrichedLogEntry,
  type LogLevel,
} from '../../models/ccpLogParser';

type DisplayEntry = EnrichedLogEntry & { _isHighlighted: boolean };

const LOG_LEVEL_OPTIONS: { label: string; value: 'ALL' | LogLevel }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'LOG+', value: 'LOG' },
  { label: 'DEBUG+', value: 'DEBUG' },
  { label: 'TRACE+', value: 'TRACE' },
  { label: 'INFO+', value: 'INFO' },
  { label: 'WARN+', value: 'WARN' },
  { label: 'ERROR only', value: 'ERROR' },
];

const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: 'inherit',
  ERROR: '#d32f2f',
  INFO: '#0d47a1',
  LOG: '#616161',
  TRACE: '#616161',
  WARN: '#e65100',
};

const MonoSpan = styled('span')({
  fontFamily: '"Monaco", "Menlo", monospace',
  fontSize: 12,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

type CellRenderer = NonNullable<MRT_ColumnDef<DisplayEntry>['Cell']>;

const TimeCell: CellRenderer = ({ row }) => <MonoSpan>{row.original.time}</MonoSpan>;

const ComponentCell: CellRenderer = ({ row }) => <MonoSpan>{row.original.component}</MonoSpan>;

const LevelCell: CellRenderer = ({ row }) => (
  <MonoSpan style={{ color: LEVEL_COLORS[row.original.level], fontWeight: 'bold' }}>{row.original.level}</MonoSpan>
);

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Extracts a one-line summary from an exception object (e.g. "TimeoutError: Request timed out").
 * Returns null if the exception is missing or has no meaningful type/message fields.
 * Discards `type` values containing "[object" (a stringification artifact from CCP Streams).
 *
 * @param exception - The exception object from a log entry.
 * @returns A short summary string, or null.
 */
const getExceptionSummary = (exception: object | undefined): null | string => {
  if (!exception || !isObjectRecord(exception)) return null;
  const type = typeof exception.type === 'string' && !exception.type.includes('[object') ? exception.type : '';
  const message = typeof exception.message === 'string' ? exception.message : '';
  const summary = [type, message].filter(Boolean).join(': ');
  return summary || null;
};

const makeTextCell =
  (setExpandedRowKey: (key: null | number) => void): CellRenderer =>
  ({ row }) => {
    const hasExtra = !!(row.original.exception ?? (row.original.objects && row.original.objects.length > 0));
    const exceptionSummary = getExceptionSummary(row.original.exception);
    return (
      <Box
        sx={{
          alignItems: 'flex-start',
          display: 'flex',
          gap: 0.5,
          minWidth: 0,
          width: '100%',
        }}
      >
        {hasExtra && (
          <IconButton
            aria-label={row.getIsExpanded() ? 'collapse detail' : 'expand detail'}
            onClick={(e) => {
              e.stopPropagation();
              if (row.getIsExpanded()) {
                setExpandedRowKey(null);
              } else {
                setExpandedRowKey(row.original._key);
              }
              row.toggleExpanded();
            }}
            size="small"
            sx={{
              '&:hover': { color: 'text.primary' },
              color: 'text.secondary',
              flexShrink: 0,
              lineHeight: 0,
              mt: '1px',
              p: 0,
            }}
          >
            {row.getIsExpanded() ? <RemoveCircleIcon sx={{ fontSize: 16 }} /> : <AddCircleIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        )}
        <Box sx={{ minWidth: 0 }}>
          <MonoSpan
            style={{
              color: LEVEL_COLORS[row.original.level],
              overflow: 'visible',
              whiteSpace: 'normal',
            }}
          >
            {row.original.text}
          </MonoSpan>
          {exceptionSummary && (
            <MonoSpan
              style={{
                color: '#d32f2f',
                display: 'block',
                fontSize: 11,
                opacity: 0.85,
                overflow: 'visible',
                whiteSpace: 'normal',
              }}
            >
              ⚠ {exceptionSummary}
            </MonoSpan>
          )}
        </Box>
      </Box>
    );
  };

interface LogTableProps {
  /** The active custom filter, or null for 'All'. */
  activeFilter: CustomFilter | null;
  /** Controlled contact filter — 'ALL' or a specific contactId UUID. */
  contactFilter: string;
  /** Contact summaries for the currently loaded file. */
  contacts: ContactSummary[];
  /** Available custom filters for the dropdown. */
  customFilters: CustomFilter[];
  entries: EnrichedLogEntry[];
  /** Keys to visually highlight (from snapshot range selection). */
  highlightedKeys: Set<number>;
  /** Controlled level filter — lifted to parent so chips can set it. */
  levelFilter: 'ALL' | LogLevel;
  onContactFilterChange: (contactId: string) => void;
  onLevelFilterChange: (level: 'ALL' | LogLevel) => void;
  /** Callback to open the filter manager dialog. */
  onOpenFilterManager: () => void;
  /** Callback to change the active source filter. */
  onSourceFilterChange: (filterId: null | string) => void;
}

/**
 * Renders a filterable, colour-coded log table for enriched CCP log entries.
 * Supports level filtering, custom source prefix filtering, regex text filtering,
 * and snapshot-range highlighting. Uses material-react-table with row virtualisation.
 *
 * @param root0 Component props.
 * @param root0.activeFilter The currently active custom filter (or null for All).
 * @param root0.contactFilter The currently active contact filter (controlled by parent).
 * @param root0.contacts Contact summaries for the current file.
 * @param root0.customFilters Available custom filters for the dropdown.
 * @param root0.entries The enriched log entries to display.
 * @param root0.highlightedKeys Set of entry keys that should be highlighted.
 * @param root0.levelFilter The currently active level filter (controlled by parent).
 * @param root0.onContactFilterChange Callback to update the contact filter in the parent.
 * @param root0.onLevelFilterChange Callback to update the level filter in the parent.
 * @param root0.onOpenFilterManager Callback to open the filter manager dialog.
 * @param root0.onSourceFilterChange Callback to update the source filter in the parent.
 * @returns JSX for the log table component.
 */
const LogTable: FC<LogTableProps> = ({
  activeFilter,
  contactFilter,
  contacts,
  customFilters,
  entries,
  highlightedKeys,
  levelFilter,
  onContactFilterChange,
  onLevelFilterChange,
  onOpenFilterManager,
  onSourceFilterChange,
}) => {
  const [regexFilter, setRegexFilter] = useState('');
  const [regexError, setRegexError] = useState(false);
  const [expandedRowKey, setExpandedRowKey] = useState<null | number>(null);
  const mrtTheme = useMrtTheme();
  const rowVirtualizerInstanceRef = useRef<MRT_RowVirtualizer | null>(null);
  const filteredEntriesRef = useRef<DisplayEntry[]>([]);

  const handleLevelChange = (e: SelectChangeEvent): void => {
    onLevelFilterChange(e.target.value as 'ALL' | LogLevel);
  };

  const handleRegexChange = (value: string): void => {
    setRegexFilter(value);
    if (value === '') {
      setRegexError(false);
      return;
    }
    try {
      new RegExp(value);
      setRegexError(false);
    } catch {
      setRegexError(true);
    }
  };

  const filteredEntries = useMemo<DisplayEntry[]>(() => {
    const minLevel = levelFilter === 'ALL' ? 0 : LogLevelNumeric[levelFilter];
    let re: null | RegExp = null;
    if (regexFilter && !regexError) {
      try {
        re = new RegExp(regexFilter, 'i');
      } catch {
        re = null;
      }
    }
    const result = entries.filter((entry) => {
      if (LogLevelNumeric[entry.level] < minLevel) return false;
      if (activeFilter && !entry.text.startsWith(activeFilter.prefix)) return false;
      if (contactFilter !== 'ALL' && !entry.contactIds.includes(contactFilter)) return false;
      if (re) {
        const fullLine = `${entry.time} ${entry.component} ${entry.level} ${entry.text}`;
        const matchesText = re.test(fullLine);
        const matchesObjects = entry.objects ? re.test(JSON.stringify(entry.objects)) : false;
        const matchesException = entry.exception ? re.test(JSON.stringify(entry.exception)) : false;
        if (!matchesText && !matchesObjects && !matchesException) return false;
      }
      return true;
    });
    return result.map((e) => ({
      ...e,
      _isHighlighted: highlightedKeys.has(e._key),
    }));
  }, [activeFilter, contactFilter, entries, highlightedKeys, levelFilter, regexFilter, regexError]);

  useEffect(() => {
    filteredEntriesRef.current = filteredEntries;
  }, [filteredEntries]);

  useEffect(() => {
    if (expandedRowKey === null) return;
    const rowIndex = filteredEntriesRef.current.findIndex((e) => e._key === expandedRowKey);
    if (rowIndex === -1) return;
    // Double rAF: first frame lets MRT inject the detail panel into the virtualizer,
    // second frame scrolls to it. Detail panels sit at odd virtual indices (rowIndex * 2 + 1).
    // Using align: 'auto' so that only off-screen panels are scrolled into view —
    // rows already visible stay put instead of jumping to the bottom.
    // Scroll to rowIndex * 2 + 2 (the next row after the detail panel) to ensure
    // the full detail panel content is visible, not just its top edge.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rowVirtualizerInstanceRef.current?.scrollToIndex(rowIndex * 2 + 2, {
          align: 'auto',
        });
      });
    });
  }, [expandedRowKey]);

  useEffect(() => {
    if (highlightedKeys.size === 0) return;
    let firstKey = Infinity;
    for (const k of highlightedKeys) {
      if (k < firstKey) firstKey = k;
    }
    const rowIndex = filteredEntriesRef.current.findIndex((e) => e._key === firstKey);
    if (rowIndex === -1) return;
    // MRT doubles the virtualizer count when renderDetailPanel is present:
    // data rows sit at even virtual indices (rowIndex * 2), detail panels at odd ones.
    // Offset by a few rows so the first highlighted row appears near the top with
    // a small amount of context above it rather than dead-centre.
    const CONTEXT_ROWS = 3;
    requestAnimationFrame(() => {
      rowVirtualizerInstanceRef.current?.scrollToIndex(Math.max(0, rowIndex * 2 - CONTEXT_ROWS * 2), {
        align: 'start',
      });
    });
  }, [highlightedKeys]);

  const columns = useMemo<MRT_ColumnDef<DisplayEntry>[]>(
    () => [
      {
        accessorKey: 'time',
        Cell: TimeCell,
        header: 'Time',
        maxSize: 40,
        size: 40,
        sortingFn: (rowA, rowB) => rowA.original._ts - rowB.original._ts,
      },
      {
        accessorKey: 'component',
        Cell: ComponentCell,
        enableSorting: false,
        filterVariant: 'multi-select',
        header: 'Component',
        maxSize: 25,
        size: 25,
      },
      {
        accessorKey: 'level',
        Cell: LevelCell,
        enableSorting: false,
        filterVariant: 'multi-select',
        header: 'Level',
        maxSize: 15,
        size: 15,
      },
      {
        accessorKey: 'text',
        Cell: makeTextCell(setExpandedRowKey),
        enableSorting: false,
        header: 'Message',
      },
    ],
    [setExpandedRowKey],
  );

  const getRowProps = ({ row }: { row: MRT_Row<DisplayEntry> }) => {
    const isHighlighted = row.original._isHighlighted;
    const isError = row.original.highlight;

    let sx: SxProps<Theme>;
    if (isHighlighted) {
      sx = {
        backgroundColor: (theme: Theme) =>
          `color-mix(in srgb, ${theme.palette.warning.main} 25%, transparent) !important`,
      };
    } else if (isError) {
      sx = {
        backgroundColor: (theme: Theme) => `color-mix(in srgb, ${theme.palette.error.main} 12%, transparent)`,
      };
    } else {
      sx = { backgroundColor: 'background.paper' };
    }

    return { sx };
  };

  const table = useMaterialReactTable({
    columns,
    data: filteredEntries,
    enableBottomToolbar: false,
    enableColumnResizing: true,
    enableDensityToggle: false,
    enableExpandAll: false,
    enableFacetedValues: true,
    enableHiding: false,
    enablePagination: false,
    enableRowVirtualization: true,
    enableSortingRemoval: false,
    enableTopToolbar: false,
    getRowCanExpand: (row) => !!(row.original.exception ?? (row.original.objects && row.original.objects.length > 0)),
    getRowId: (row) => String(row._key),
    initialState: {
      columnVisibility: { 'mrt-row-expand': false },
      density: 'compact',
      sorting: [{ desc: false, id: 'time' }],
    },
    layoutMode: 'grid',
    mrtTheme,
    muiDetailPanelProps: { sx: { p: 0 } },
    muiTableBodyRowProps: getRowProps,
    muiTablePaperProps: {
      sx: { display: 'flex', flexDirection: 'column', height: '100%' },
    },
    muiTableProps: {
      sx: {
        fontFamily: '"Monaco", "Menlo", monospace',
        fontSize: 12,
      },
    },
    renderDetailPanel: ({ row }) => {
      const { exception, objects } = row.original;
      const hasException = !!exception;
      const hasObjects = !!(objects && objects.length > 0);
      return (
        <Stack
          sx={{
            gap: 1,
            p: 1,
            width: '100%',
          }}
        >
          {hasException && (
            <Box sx={{ width: '100%' }}>
              <Typography
                color="error"
                sx={{
                  fontWeight: 'bold',
                  mb: 0.5,
                }}
                variant="caption"
              >
                EXCEPTION
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'rgba(211,47,47,0.06)',
                  border: '1px solid rgba(211,47,47,0.2)',
                  borderRadius: 1,
                  boxSizing: 'border-box',
                  fontSize: 11,
                  maxHeight: 300,
                  overflow: 'auto',
                  p: 1,
                  whiteSpace: 'pre-wrap',
                  width: '100%',
                  wordBreak: 'break-all',
                }}
              >
                {JSON.stringify(exception, null, 2)}
              </Box>
            </Box>
          )}
          {hasObjects && (
            <Box sx={{ width: '100%' }}>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontWeight: 'bold',
                  mb: 0.5,
                }}
                variant="caption"
              >
                OBJECTS
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  boxSizing: 'border-box',
                  fontSize: 11,
                  maxHeight: 300,
                  overflow: 'auto',
                  p: 1,
                  whiteSpace: 'pre-wrap',
                  width: '100%',
                  wordBreak: 'break-all',
                }}
              >
                {JSON.stringify(objects, null, 2)}
              </Box>
            </Box>
          )}
        </Stack>
      );
    },
    rowVirtualizerInstanceRef,
    rowVirtualizerOptions: { overscan: 20 },
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          flexShrink: 0,
          gap: 2,
          mb: 1,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="level-filter-label">Min Level</InputLabel>
          <Select label="Min Level" labelId="level-filter-label" onChange={handleLevelChange} value={levelFilter}>
            {LOG_LEVEL_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          error={regexError}
          helperText={regexError ? 'Invalid regex' : ''}
          label="Filter (regex)"
          onChange={(e) => handleRegexChange(e.target.value)}
          placeholder="e.g. getAgentSnapshot|ERROR"
          size="small"
          slotProps={{
            input: {
              endAdornment: regexFilter ? (
                <InputAdornment position="end">
                  <IconButton aria-label="clear filter" edge="end" onClick={() => handleRegexChange('')} size="small">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
          sx={{ flex: 1 }}
          value={regexFilter}
        />
        <Typography
          sx={{
            color: 'text.secondary',
          }}
          variant="caption"
        >
          {filteredEntries.length} / {entries.length} entries
        </Typography>
        {/* Source filter dropdown (custom filters) */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="source-filter-label">Source Filter</InputLabel>
          <Select
            label="Source Filter"
            labelId="source-filter-label"
            onChange={(e: SelectChangeEvent) => {
              const value = e.target.value;
              if (value === '_add') {
                onOpenFilterManager();
                return;
              }
              onSourceFilterChange(value === 'ALL' ? null : value);
            }}
            value={activeFilter?.id ?? 'ALL'}
          >
            <MenuItem value="ALL">All sources</MenuItem>
            {customFilters.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                <Tooltip arrow placement="right" title={`Prefix: ${f.prefix}`}>
                  <span>{f.label}</span>
                </Tooltip>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem value="_add">
              <ListItemIcon>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Add new filter…</ListItemText>
            </MenuItem>
          </Select>
        </FormControl>
        {contacts.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="contact-filter-label">Contact</InputLabel>
            <Select
              label="Contact"
              labelId="contact-filter-label"
              onChange={(e: SelectChangeEvent) => onContactFilterChange(e.target.value)}
              renderValue={(value) =>
                value === 'ALL' ? 'All contacts' : (contacts.find((c) => c.contactId === value)?.label ?? value)
              }
              value={contactFilter}
            >
              <MenuItem value="ALL">All contacts</MenuItem>
              {contacts.map((c) => {
                const start = c.startTime.slice(11, 19);
                const end = c.endTime.slice(11, 19);
                return (
                  <MenuItem key={c.contactId} value={c.contactId}>
                    <ListItemText
                      primary={c.contactId}
                      secondary={`${start} \u2192 ${end}`}
                      slotProps={{
                        primary: {
                          sx: { fontFamily: 'monospace', fontSize: 12 },
                        },
                        secondary: { sx: { fontSize: 11 } },
                      }}
                    />
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        )}
      </Stack>
      <MrtThemeProvider>
        <MaterialReactTable table={table} />
      </MrtThemeProvider>
    </Box>
  );
};

export default LogTable;
