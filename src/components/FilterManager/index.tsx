import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState, type FC } from 'react';

import type { CustomFilter } from '../../models/ccpLogParser';

interface FilterManagerProps {
  filters: CustomFilter[];
  onAddFilter: (label: string, prefix: string) => void;
  onClose: () => void;
  onRemoveFilter: (id: string) => void;
  onUpdateFilter: (id: string, updates: Partial<Pick<CustomFilter, 'label' | 'prefix'>>) => void;
  open: boolean;
}

/**
 * Dialog for managing custom log text prefix filters.
 * Allows adding, editing, and removing saved filters that persist to localStorage.
 *
 * @param root0 Component props.
 * @param root0.filters Current list of custom filters.
 * @param root0.onAddFilter Callback to add a new filter.
 * @param root0.onClose Callback to close the dialog.
 * @param root0.onRemoveFilter Callback to remove a filter by ID.
 * @param root0.onUpdateFilter Callback to update an existing filter.
 * @param root0.open Whether the dialog is visible.
 * @returns JSX for the filter manager dialog.
 */
const FilterManager: FC<FilterManagerProps> = ({
  filters,
  onAddFilter,
  onClose,
  onRemoveFilter,
  onUpdateFilter,
  open,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [editingId, setEditingId] = useState<null | string>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editPrefix, setEditPrefix] = useState('');

  const handleAdd = (): void => {
    const trimmedLabel = newLabel.trim();
    const trimmedPrefix = newPrefix.trim();
    if (!trimmedLabel || !trimmedPrefix) return;
    if (isDuplicateLabel) return;
    onAddFilter(trimmedLabel, trimmedPrefix);
    setNewLabel('');
    setNewPrefix('');
  };

  const handleStartEdit = (filter: CustomFilter): void => {
    setEditingId(filter.id);
    setEditLabel(filter.label);
    setEditPrefix(filter.prefix);
  };

  const handleSaveEdit = (): void => {
    if (!editingId) return;
    const trimmedLabel = editLabel.trim();
    const trimmedPrefix = editPrefix.trim();
    if (!trimmedLabel || !trimmedPrefix) return;
    const isDuplicateEditLabel = filters.some(
      (f) => f.id !== editingId && f.label.toLowerCase() === trimmedLabel.toLowerCase(),
    );
    if (isDuplicateEditLabel) return;
    onUpdateFilter(editingId, { label: trimmedLabel, prefix: trimmedPrefix });
    setEditingId(null);
  };

  const handleCancelEdit = (): void => {
    setEditingId(null);
  };

  const isDuplicateLabel = filters.some((f) => f.label.toLowerCase() === newLabel.trim().toLowerCase());

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>Manage Filters</DialogTitle>
      <DialogContent>
        <Typography
          sx={{
            color: 'text.secondary',
            mb: 2,
          }}
          variant="body2"
        >
          Filters match log entries whose text starts with the specified prefix. Saved filters persist across sessions.
        </Typography>

        {filters.length === 0 ? (
          <Typography
            sx={{
              color: 'text.secondary',
              mb: 2,
              textAlign: 'center',
            }}
            variant="body2"
          >
            No filters saved yet. Add one below.
          </Typography>
        ) : (
          <List dense disablePadding sx={{ mb: 2 }}>
            {filters.map((filter, idx) => (
              <ListItem
                disableGutters
                divider={idx < filters.length - 1}
                key={filter.id}
                secondaryAction={
                  editingId === filter.id ? undefined : (
                    <Tooltip arrow title="Remove filter">
                      <IconButton edge="end" onClick={() => onRemoveFilter(filter.id)} size="small">
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )
                }
              >
                {editingId === filter.id ? (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flex: 1, pr: 1 }}>
                    <TextField
                      label="Label"
                      onChange={(e) => setEditLabel(e.target.value)}
                      size="small"
                      value={editLabel}
                    />
                    <TextField
                      label="Prefix"
                      onChange={(e) => setEditPrefix(e.target.value)}
                      size="small"
                      value={editPrefix}
                    />
                    <Button onClick={handleSaveEdit} size="small" variant="contained">
                      Save
                    </Button>
                    <Button onClick={handleCancelEdit} size="small">
                      Cancel
                    </Button>
                  </Stack>
                ) : (
                  <ListItemText
                    onClick={() => handleStartEdit(filter)}
                    primary={filter.label}
                    secondary={
                      <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {filter.prefix}
                      </Typography>
                    }
                    sx={{ cursor: 'pointer' }}
                  />
                )}
              </ListItem>
            ))}
          </List>
        )}

        {/* Add new filter */}
        <Box sx={{ borderColor: 'divider', borderTop: '1px solid', pt: 2 }}>
          <Typography
            sx={{
              fontWeight: 'bold',
              mb: 1,
            }}
            variant="subtitle2"
          >
            Add Filter
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <TextField
              error={isDuplicateLabel && newLabel.trim() !== ''}
              helperText={isDuplicateLabel && newLabel.trim() !== '' ? 'Label already exists' : ''}
              label="Label"
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. My CCP Component"
              size="small"
              sx={{ flex: 1 }}
              value={newLabel}
            />
            <TextField
              label="Text prefix"
              onChange={(e) => setNewPrefix(e.target.value)}
              placeholder="e.g. CUSTOM_CCP"
              size="small"
              sx={{ flex: 1 }}
              value={newPrefix}
            />
            <Button
              disabled={!newLabel.trim() || !newPrefix.trim() || isDuplicateLabel}
              onClick={handleAdd}
              size="small"
              sx={{ mt: '4px' }}
              variant="contained"
            >
              Add
            </Button>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterManager;
