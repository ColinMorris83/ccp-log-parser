import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useRef, useState, type FC } from 'react';

import { FileUploadButton } from '../FileUploadButton';
import { SegmentedTabCompact, SegmentedTabsCompact } from '../SegmentedTabs';
import type { CustomFilter, LogLevel, ParsedCcpLog } from '../../models/ccpLogParser';
import DropZone from '../DropZone';
import LogTable from '../LogTable';
import MetricsPanel from '../MetricsPanel';
import SnapshotList from '../SnapshotList';
import { parseCcpLog } from '../../utils/logParser';

const VIEW_TABS = [
  { label: 'Snapshots & Log', value: 'log' },
  { label: 'Metrics', value: 'metrics' },
] as const;

type ViewTabValue = (typeof VIEW_TABS)[number]['value'];

const MAX_LOADED_FILES = 4;

/**
 * Formats an array of filenames as a comma-separated, double-quoted list.
 *
 * @param names - The filenames to format.
 * @returns A string like `"a.txt", "b.txt"`.
 */
const quoteNames = (names: string[]): string => names.map((n) => `"${n}"`).join(', ');

interface LoadedFile {
  activeTab: ViewTabValue;
  contactFilter: string;
  highlightedKeys: Set<number>;
  levelFilter: 'ALL' | LogLevel;
  parsedLog: ParsedCcpLog;
  selectedSnapshotFromKey: null | number;
  sourceFilterId: null | string;
}

interface CcpLogParserProps {
  /** The currently active custom filter (resolved from activeFilterId). */
  activeFilter: CustomFilter | null;
  /** All available custom filters for the source filter dropdown. */
  customFilters: CustomFilter[];
  /** Callback to open the filter manager dialog. */
  onOpenFilterManager: () => void;
  /** Callback to update the active source filter ID. */
  onSourceFilterChange: (filterId: null | string) => void;
}

/**
 * Renders the CCP Log Parser main page.
 * Supports loading multiple CCP log files and switching between them.
 * Each file gets its own filterable log table, snapshot panel, and metrics charts.
 *
 * @param root0 Component props.
 * @param root0.activeFilter The currently active custom filter (or null for All).
 * @param root0.customFilters All available custom filters.
 * @param root0.onOpenFilterManager Callback to open the filter manager dialog.
 * @param root0.onSourceFilterChange Callback to update the active source filter.
 * @returns JSX for the CCP log parser page.
 */
const CcpLogParser: FC<CcpLogParserProps> = ({
  activeFilter,
  customFilters,
  onOpenFilterManager,
  onSourceFilterChange,
}) => {
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [parseError, setParseError] = useState<null | string>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState<null | string>(null);
  const dragCounterRef = useRef(0);

  const currentFile = loadedFiles[selectedFileIdx] as LoadedFile | undefined;

  const entries = currentFile?.parsedLog.entries;
  const contactFilter = currentFile?.contactFilter;

  /** Recompute entry / error / warning counts scoped to the active source and contact filters. */
  const filteredCounts = useMemo(() => {
    if (!entries) return { entries: 0, errors: 0, warnings: 0 };
    const filtered = entries.filter((e) => {
      if (activeFilter && !e.text.startsWith(activeFilter.prefix)) return false;
      if (contactFilter && contactFilter !== 'ALL' && !e.contactIds.includes(contactFilter)) return false;
      return true;
    });
    return {
      entries: filtered.length,
      errors: filtered.filter((e) => e.level === 'ERROR').length,
      warnings: filtered.filter((e) => e.level === 'WARN').length,
    };
  }, [entries, contactFilter, activeFilter]);

  const isSourceFiltered = activeFilter !== null;
  const isContactFiltered = currentFile?.contactFilter !== 'ALL' && currentFile?.contactFilter !== undefined;
  const filterContext = [
    isSourceFiltered ? activeFilter.label : '',
    isContactFiltered
      ? (currentFile.parsedLog.contacts.find((c) => c.contactId === currentFile.contactFilter)?.label ?? 'contact')
      : '',
  ].filter(Boolean);
  const filterSuffix = filterContext.length > 0 ? ` (within ${filterContext.join(', ')})` : '';

  const updateCurrentFile = (updater: (file: LoadedFile) => LoadedFile): void => {
    setLoadedFiles((prev) => prev.map((f, i) => (i === selectedFileIdx ? updater(f) : f)));
  };

  const handleFilesLoad = (results: { filename: string; raw: string }[], skippedAtMax: string[]): void => {
    setParseError(null);
    const parseErrors: string[] = [];
    const toAdd: LoadedFile[] = [];

    for (const { filename, raw } of results) {
      if (loadedFiles.some((f) => f.parsedLog.filename === filename)) {
        parseErrors.push(`"${filename}" is already loaded`);
        continue;
      }
      try {
        const parsedLog = parseCcpLog(raw, filename);
        toAdd.push({
          activeTab: 'log',
          contactFilter: 'ALL',
          highlightedKeys: new Set<number>(),
          levelFilter: 'ALL' as const,
          parsedLog,
          selectedSnapshotFromKey: null,
          sourceFilterId: null,
        });
      } catch (err: unknown) {
        parseErrors.push(`"${filename}" — ${(err as Error).message}`);
      }
    }

    if (skippedAtMax.length > 0) {
      parseErrors.push(`${quoteNames(skippedAtMax)} — max of ${String(MAX_LOADED_FILES)} files reached`);
    }

    if (toAdd.length > 0) {
      setLoadedFiles((prev) => {
        const newFiles = [...prev, ...toAdd];
        setSelectedFileIdx(newFiles.length - 1);
        return newFiles;
      });
    }
    if (parseErrors.length > 0) {
      setParseError(`Could not add: ${parseErrors.join('; ')}`);
    }
  };

  const readFilesUpToLimit = (files: File[] | FileList): void => {
    setParseError(null);
    const allFiles = Array.from(files);
    const remaining = MAX_LOADED_FILES - loadedFiles.length;

    // Separate duplicates first, then apply the remaining-slots cap to the non-duplicate files
    const batchNames = new Set<string>();
    const skippedDuplicate: string[] = [];
    const unique: File[] = [];

    for (const file of allFiles) {
      if (loadedFiles.some((f) => f.parsedLog.filename === file.name) || batchNames.has(file.name)) {
        skippedDuplicate.push(file.name);
      } else {
        batchNames.add(file.name);
        unique.push(file);
      }
    }

    const toLoad = unique.slice(0, remaining);
    const skippedAtMax = unique.slice(remaining).map((f) => f.name);

    const parseErrors: string[] = [];
    const parsedResults: ParsedCcpLog[] = [];

    const finalize = (): void => {
      setIsLoading(false);
      setLoadingText(null);
      // Add all successfully parsed files in one batch
      if (parsedResults.length > 0) {
        setLoadedFiles((prev) => {
          const newFiles = [
            ...prev,
            ...parsedResults.map((parsedLog) => ({
              activeTab: 'log' as const,
              contactFilter: 'ALL',
              highlightedKeys: new Set<number>(),
              levelFilter: 'ALL' as const,
              parsedLog,
              selectedSnapshotFromKey: null,
              sourceFilterId: null,
            })),
          ];
          setSelectedFileIdx(newFiles.length - 1);
          return newFiles;
        });
      }

      const parts: string[] = [];
      if (skippedDuplicate.length > 0) {
        parts.push(`${quoteNames(skippedDuplicate)} — already loaded`);
      }
      if (skippedAtMax.length > 0) {
        parts.push(`${quoteNames(skippedAtMax)} — max of ${String(MAX_LOADED_FILES)} files reached`);
      }
      if (parseErrors.length > 0) {
        parts.push(...parseErrors);
      }
      if (parts.length > 0) {
        setParseError(`Could not add: ${parts.join('; ')}`);
      }
    };

    if (toLoad.length > 0) {
      setIsLoading(true);
      setLoadingText(`Processing ${String(toLoad.length)} file${toLoad.length > 1 ? 's' : ''}…`);
      void Promise.allSettled(toLoad.map((f) => f.text())).then((results) => {
        for (const [i, result] of results.entries()) {
          const file = toLoad[i];
          if (result.status === 'fulfilled') {
            try {
              parsedResults.push(parseCcpLog(result.value, file.name));
            } catch (err: unknown) {
              parseErrors.push(`"${file.name}" — ${(err as Error).message}`);
            }
          } else {
            parseErrors.push(`"${file.name}" — failed to read file`);
          }
        }
        finalize();
      });
    }

    // If all files were skipped before any reads were started, report immediately
    if (toLoad.length === 0) finalize();
  };

  const handleFileInputSelect = (files: FileList): void => {
    readFilesUpToLimit(files);
  };

  const handleRemoveFile = (idx: number): void => {
    setLoadedFiles((prev) => prev.filter((_, i) => i !== idx));
    setSelectedFileIdx((prevIdx) => {
      const nextLength = loadedFiles.length - 1;
      if (nextLength === 0) return 0;
      if (idx === prevIdx) return Math.min(prevIdx, nextLength - 1);
      if (idx < prevIdx) return prevIdx - 1;
      return prevIdx;
    });
  };

  const handleSnapshotSelect = (keys: Set<number>): void => {
    updateCurrentFile((file) => {
      const alreadySelected =
        file.highlightedKeys.size === keys.size && [...keys].every((k) => file.highlightedKeys.has(k));
      if (alreadySelected) {
        return {
          ...file,
          highlightedKeys: new Set(),
          selectedSnapshotFromKey: null,
        };
      }
      let minKey: null | number = null;
      for (const k of keys) {
        if (minKey === null || k < minKey) minKey = k;
      }
      return {
        ...file,
        contactFilter: 'ALL',
        highlightedKeys: keys,
        levelFilter: 'ALL',
        selectedSnapshotFromKey: minKey,
        sourceFilterId: null,
      };
    });
    onSourceFilterChange(null);
  };

  const handleViewTabChange = (_event: unknown, value: ViewTabValue): void => {
    updateCurrentFile((file) => ({ ...file, activeTab: value }));
  };

  const handleLevelFilterChange = (level: 'ALL' | LogLevel): void => {
    updateCurrentFile((file) => ({
      ...file,
      activeTab: 'log',
      levelFilter: level,
    }));
  };

  const handleContactFilterChange = (contactId: string): void => {
    updateCurrentFile((file) => ({ ...file, contactFilter: contactId }));
  };

  const handlePageDragEnter = (e: React.DragEvent): void => {
    if (loadedFiles.length === 0 || loadedFiles.length >= MAX_LOADED_FILES || !e.dataTransfer.types.includes('Files'))
      return;
    dragCounterRef.current += 1;
    setIsDragOver(true);
  };

  const handlePageDragLeave = (): void => {
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  };

  const handlePageDragOver = (e: React.DragEvent): void => {
    if (loadedFiles.length > 0 && loadedFiles.length < MAX_LOADED_FILES) e.preventDefault();
  };

  const handlePageDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    if (loadedFiles.length === 0 || loadedFiles.length >= MAX_LOADED_FILES) return;
    readFilesUpToLimit(e.dataTransfer.files);
  };

  return (
    <Box
      onDragEnter={handlePageDragEnter}
      onDragLeave={handlePageDragLeave}
      onDragOver={handlePageDragOver}
      onDrop={handlePageDrop}
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Loading backdrop — shown while reading additional files */}
      <Backdrop open={isLoading} sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
        <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 'sm', padding: 2 }}>
          <CircularProgress size={64} thickness={3} />
          <Typography variant="h5">Loading...</Typography>
          {loadingText && (
            <Typography sx={{ whiteSpace: 'pre-line' }} variant="h5">
              {loadingText}
            </Typography>
          )}
        </Stack>
      </Backdrop>
      {/* Drag-over overlay — only shown when files are loaded and a file is dragged over */}
      {isDragOver && (
        <Box
          sx={{
            alignItems: 'center',
            backdropFilter: 'blur(2px)',
            bgcolor: 'rgba(25, 118, 210, 0.12)',
            border: '3px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            justifyContent: 'center',
            left: 0,
            pointerEvents: 'none',
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 9999,
          }}
        >
          <Typography
            color="primary"
            sx={{
              fontWeight: 'bold',
            }}
            variant="h4"
          >
            Drop to load files
          </Typography>
          <Typography
            sx={{
              color: 'text.primary',
            }}
            variant="body2"
          >
            Each file will be added as a new tab (up to {MAX_LOADED_FILES - loadedFiles.length} remaining)
          </Typography>
        </Box>
      )}
      {/* ── File chips + add button ── */}
      <Box sx={{ px: 3, py: 1.5 }}>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: 'flex-end',
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.75,
            }}
          >
            {loadedFiles.map((file, idx) => {
              const isSelected = idx === selectedFileIdx;
              return (
                <Button
                  color={isSelected ? 'info' : 'inherit'}
                  endIcon={
                    <Tooltip arrow title="Remove file">
                      <Box
                        component="span"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        sx={{
                          '&:hover': { bgcolor: 'error.main', color: 'white' },
                          borderRadius: '50%',
                          display: 'inline-flex',
                          p: '2px',
                        }}
                      >
                        <CloseIcon sx={{ fontSize: '14px !important' }} />
                      </Box>
                    </Tooltip>
                  }
                  key={file.parsedLog.filename + String(idx)}
                  onClick={() => setSelectedFileIdx(idx)}
                  size="small"
                  sx={{
                    borderRadius: 1,
                    maxWidth: 230,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    ...(isSelected && {
                      '&:hover': { bgcolor: 'info.dark' },
                      bgcolor: 'info.dark',
                    }),
                  }}
                  variant={isSelected ? 'contained' : 'outlined'}
                >
                  <Tooltip arrow title={file.parsedLog.filename}>
                    <Box
                      component="span"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.parsedLog.filename}
                    </Box>
                  </Tooltip>
                </Button>
              );
            })}
            {loadedFiles.length > 0 && loadedFiles.length < MAX_LOADED_FILES && (
              <FileUploadButton
                accept=".txt,.json,text/plain,application/json"
                buttonSize="small"
                buttonText="Add file"
                buttonVariant="outlined"
                multiple
                onFileSelectSuccess={handleFileInputSelect}
                tooltipText={`Load an additional CCP log file (max ${String(MAX_LOADED_FILES)} files). You can also drag & drop a file anywhere on the page.`}
              />
            )}
          </Stack>
        </Box>
      </Box>

      {/* ── Controls (shrink to content height) ── */}
      <Box sx={{ flexShrink: 0, px: 3 }}>
        {parseError && (
          <Alert onClose={() => setParseError(null)} severity="error" sx={{ mb: 2 }}>
            <strong>Failed to parse log file:</strong> {parseError}
          </Alert>
        )}

        {/* View tabs + summary chips on the same row */}
        {currentFile && (
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <SegmentedTabsCompact
              indicatorColor="primary"
              onChange={handleViewTabChange}
              scrollButtons="auto"
              textColor="primary"
              value={currentFile.activeTab}
              variant="scrollable"
            >
              {VIEW_TABS.map((tab) => (
                <SegmentedTabCompact key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </SegmentedTabsCompact>
            <Stack
              direction="row"
              sx={{
                alignItems: 'center',
                flexShrink: 0,
                gap: 1,
                pl: 2,
              }}
            >
              <Tooltip arrow title={`Show all entries${filterSuffix}`}>
                <Chip
                  color="default"
                  icon={<ListAltIcon sx={{ fontSize: '1rem !important' }} />}
                  label={`${filteredCounts.entries.toLocaleString()} entries`}
                  onClick={() => handleLevelFilterChange('ALL')}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
              <Tooltip
                arrow
                title={
                  filteredCounts.errors > 0 ? `Filter by errors${filterSuffix}` : `No errors in this log${filterSuffix}`
                }
              >
                <Chip
                  color={filteredCounts.errors > 0 ? 'error' : 'default'}
                  icon={<ErrorOutlinedIcon sx={{ fontSize: '1rem !important' }} />}
                  label={`${String(filteredCounts.errors)} errors`}
                  onClick={filteredCounts.errors > 0 ? () => handleLevelFilterChange('ERROR') : undefined}
                  size="small"
                  sx={filteredCounts.errors > 0 ? { cursor: 'pointer' } : undefined}
                />
              </Tooltip>
              <Tooltip
                arrow
                title={
                  filteredCounts.warnings > 0
                    ? `Filter by warnings${filterSuffix}`
                    : `No warnings in this log${filterSuffix}`
                }
              >
                <Chip
                  color={filteredCounts.warnings > 0 ? 'warning' : 'default'}
                  icon={<WarningAmberOutlinedIcon sx={{ fontSize: '1rem !important' }} />}
                  label={`${String(filteredCounts.warnings)} warnings`}
                  onClick={filteredCounts.warnings > 0 ? () => handleLevelFilterChange('WARN') : undefined}
                  size="small"
                  sx={filteredCounts.warnings > 0 ? { cursor: 'pointer' } : undefined}
                />
              </Tooltip>
              <Tooltip arrow title="Total AWS API calls measured in this log">
                <Chip
                  color="default"
                  icon={<SwapCallsIcon sx={{ fontSize: '1rem !important' }} />}
                  label={`${String(currentFile.parsedLog.apiLatency.length)} API calls`}
                  size="small"
                />
              </Tooltip>
              <Tooltip arrow title="Unique contacts detected in this log">
                <Chip
                  color="default"
                  icon={<PersonOutlinedIcon sx={{ fontSize: '1rem !important' }} />}
                  label={`${String(currentFile.parsedLog.contacts.length)} contacts`}
                  size="small"
                />
              </Tooltip>
            </Stack>
          </Stack>
        )}
      </Box>

      {/* ── Main panel (fills remaining height) ── */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 3, pt: 1.5 }}>
        {/* Empty state */}
        {loadedFiles.length === 0 && (
          <Card>
            <CardContent>
              <DropZone maxFiles={MAX_LOADED_FILES} onFilesLoad={handleFilesLoad} />
            </CardContent>
          </Card>
        )}

        {/* Tab: Snapshots & Log */}
        {currentFile?.activeTab === 'log' && (
          <Box sx={{ display: 'flex', gap: 3, height: '100%' }}>
            {/* Snapshots panel */}
            <Card
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                overflow: 'hidden',
                width: '18%',
              }}
            >
              <CardContent sx={{ '&:last-child': { pb: 2 }, flex: 1, overflow: 'auto' }}>
                <SnapshotList
                  isFiltered={isSourceFiltered || isContactFiltered || currentFile.levelFilter !== 'ALL'}
                  onSnapshotSelect={handleSnapshotSelect}
                  selectedFromKey={currentFile.selectedSnapshotFromKey}
                  snapshots={currentFile.parsedLog.snapshots}
                />
              </CardContent>
            </Card>

            {/* Log table */}
            <Card
              sx={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <CardContent
                sx={{
                  '&:last-child': { pb: 2 },
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  minHeight: 0,
                  overflow: 'hidden',
                  p: 2,
                }}
              >
                <LogTable
                  activeFilter={activeFilter}
                  contactFilter={currentFile.contactFilter}
                  contacts={currentFile.parsedLog.contacts}
                  customFilters={customFilters}
                  entries={currentFile.parsedLog.entries}
                  highlightedKeys={currentFile.highlightedKeys}
                  levelFilter={currentFile.levelFilter}
                  onContactFilterChange={handleContactFilterChange}
                  onLevelFilterChange={handleLevelFilterChange}
                  onOpenFilterManager={onOpenFilterManager}
                  onSourceFilterChange={onSourceFilterChange}
                />
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Tab: Metrics */}
        {currentFile?.activeTab === 'metrics' && (
          <Card sx={{ height: '100%', overflow: 'auto' }}>
            <CardContent>
              <MetricsPanel
                apiLatency={currentFile.parsedLog.apiLatency}
                skewPoints={currentFile.parsedLog.skewPoints}
              />
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default CcpLogParser;
