import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { Backdrop, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRef, useState, type DragEvent, type FC, type KeyboardEvent } from 'react';

import { FileUploadButton } from '../FileUploadButton';

const ALLOWED_MIME_TYPES = new Set(['application/json', 'text/plain']);

const DropArea = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragActive',
})<{ isDragActive: boolean }>(({ isDragActive, theme }) => ({
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
  '&:hover': {
    borderColor: theme.palette.primary.light,
  },
  alignItems: 'center',
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  justifyContent: 'center',
  minHeight: 280,
  padding: theme.spacing(6),
  transition: 'border-color 0.2s, background-color 0.2s',
  ...(isDragActive && {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main,
  }),
}));

interface DropZoneProps {
  /** Maximum number of files that can be loaded. Shown in the UI hint. */
  maxFiles?: number;
  /**
   * Called once all selected/dropped files have been read, with an array of raw text + filename pairs.
   * `skippedAtMax` contains names of valid files that were not read because the `maxFiles` limit was reached.
   */
  onFilesLoad: (results: { filename: string; raw: string }[], skippedAtMax: string[]) => void;
}

/**
 * Renders a drag-and-drop zone for loading a CCP log file (.txt or .json).
 * Also renders a fallback "Browse file" button for click-to-select.
 * Uses a local Backdrop for loading state (no external AppContext dependency).
 *
 * @param root0 Component props.
 * @param root0.maxFiles Maximum number of files that can be loaded (shown in the UI hint).
 * @param root0.onFilesLoad Callback fired once with all successfully-read files when all reads complete.
 * @returns JSX for the drop zone component.
 */
const DropZone: FC<DropZoneProps> = ({ maxFiles, onFilesLoad }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filesToLoadCount, setFilesToLoadCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingRef = useRef(0);

  const readFiles = (files: File[] | FileList): void => {
    const limit = maxFiles ?? 1;
    const allFiles = Array.from(files);
    const validFiles = allFiles.filter((f) => ALLOWED_MIME_TYPES.has(f.type) || /\.(?:txt|json)$/i.test(f.name));
    const invalidFiles = allFiles.filter((f) => !ALLOWED_MIME_TYPES.has(f.type) && !/\.(?:txt|json)$/i.exec(f.name));
    const filesToRead = validFiles.slice(0, limit);
    const skippedAtMax = validFiles.slice(limit).map((f) => f.name);

    if (invalidFiles.length > 0) {
      const plural = invalidFiles.length > 1 ? 's' : '';
      setError(
        `Unsupported file type${plural}: ${invalidFiles.map((f) => f.name).join(', ')}. Please use .txt or .json CCP log files.`,
      );
    } else {
      setError(null);
    }

    const results: { filename: string; raw: string }[] = [];
    const total = filesToRead.length;
    if (total === 0) return;

    const finalize = (): void => {
      setIsLoading(false);
      if (results.length > 0) onFilesLoad(results, skippedAtMax);
    };

    setIsLoading(true);
    setFilesToLoadCount(total);

    for (const file of filesToRead) {
      pendingRef.current += 1;
      void file
        .text()
        .then((raw) => {
          results.push({ filename: file.name, raw });
          pendingRef.current -= 1;
          if (pendingRef.current === 0) finalize();
        })
        .catch(() => {
          setError('Failed to read file. Please try again.');
          pendingRef.current -= 1;
          if (pendingRef.current === 0) finalize();
        });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if ((e.key === 'Enter' || e.key === ' ') && pendingRef.current === 0) {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (): void => {
    setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragActive(false);
    readFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (files: FileList): void => {
    readFiles(files);
  };

  const multipleHint = maxFiles !== undefined && maxFiles > 1;
  const idleText = multipleHint
    ? `Drag & drop up to ${String(maxFiles)} CCP log files to load`
    : 'Drag & drop your CCP log file to load';
  const dragText = multipleHint ? 'Drop your CCP log files here' : 'Drop your CCP log file here';

  return (
    <>
      <Backdrop open={isLoading} sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
        <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 'sm', padding: 2 }}>
          <CircularProgress size={64} thickness={3} />
          <Typography variant="h5">Loading...</Typography>
          <Typography sx={{ whiteSpace: 'pre-line' }} variant="h5">
            Processing {String(filesToLoadCount)} file
            {filesToLoadCount > 1 ? 's' : ''}…
          </Typography>
        </Stack>
      </Backdrop>
      <DropArea
        aria-label="Upload log files"
        isDragActive={isDragActive}
        onClick={() => pendingRef.current === 0 && inputRef.current?.click()}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        {/* Hidden input for area click — FileUploadButton has its own for the button */}
        <input
          accept=".txt,.json,text/plain,application/json"
          hidden
          multiple={multipleHint}
          onChange={(e) => {
            const files = e.target.files;
            if (files) handleFileSelect(files);
            e.target.value = '';
          }}
          ref={inputRef}
          type="file"
        />
        {isDragActive ? (
          <InsertDriveFileOutlinedIcon color="primary" sx={{ fontSize: 56 }} />
        ) : (
          <CloudUploadOutlinedIcon color="action" sx={{ fontSize: 56 }} />
        )}
        <Typography
          sx={{
            color: 'text.secondary',
          }}
          variant="h5"
        >
          {isDragActive ? dragText : idleText}
        </Typography>
        <Typography
          sx={{
            color: 'text.secondary',
          }}
          variant="body2"
        >
          Supports Amazon Connect CCP agent-log.txt (JSON format)
        </Typography>
        <Box onClick={(e) => e.stopPropagation()}>
          <FileUploadButton
            accept=".txt,.json,text/plain,application/json"
            buttonSize="small"
            buttonText="Browse file"
            buttonVariant="outlined"
            multiple={multipleHint}
            onFileSelectSuccess={handleFileSelect}
          />
        </Box>
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </DropArea>
    </>
  );
};

export default DropZone;
