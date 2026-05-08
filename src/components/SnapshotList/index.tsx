import { Box, Chip, List, ListItemButton, ListItemText, Tooltip, Typography } from '@mui/material';
import { type FC } from 'react';

import type { AgentSnapshot } from '../../models/ccpLogParser';

interface SnapshotListProps {
  /** Whether any filter (level, source, contact) is currently active. */
  isFiltered: boolean;
  /** Called when a snapshot is selected, with the set of log keys in that snapshot's range. */
  onSnapshotSelect: (keys: Set<number>) => void;
  selectedFromKey: null | number;
  snapshots: AgentSnapshot[];
}

const formatTime = (isoTime: string): string => {
  try {
    return new Date(isoTime).toLocaleTimeString();
  } catch {
    return isoTime;
  }
};

/**
 * Renders a list of agent state snapshots extracted from the CCP log.
 * Clicking a snapshot highlights the corresponding log range in the log table.
 *
 * @param root0 Component props.
 * @param root0.isFiltered Whether any filter is currently active.
 * @param root0.onSnapshotSelect Callback fired with keys for the selected snapshot's range.
 * @param root0.selectedFromKey The fromKey of the currently selected snapshot (or null).
 * @param root0.snapshots The list of agent snapshots to display.
 * @returns JSX for the snapshot list component.
 */
const SnapshotList: FC<SnapshotListProps> = ({ isFiltered, onSnapshotSelect, selectedFromKey, snapshots }) => {
  if (snapshots.length === 0) {
    return (
      <Box
        sx={{
          p: 2,
        }}
      >
        <Typography
          sx={{
            color: 'text.secondary',
          }}
          variant="body2"
        >
          No agent snapshots found in this log.
        </Typography>
      </Box>
    );
  }

  const handleSelect = (snapshot: AgentSnapshot): void => {
    const keys = new Set<number>();
    for (let k = snapshot.fromKey; k < snapshot.toKey; k++) {
      keys.add(k);
    }
    onSnapshotSelect(keys);
  };

  return (
    <Box>
      <Typography
        sx={{
          fontWeight: 'bold',
          mb: 1,
        }}
        variant="subtitle2"
      >
        Snapshots ({snapshots.length})
      </Typography>
      <List dense disablePadding sx={{ maxHeight: 600, overflowY: 'auto' }}>
        {snapshots.map((snapshot) => (
          <Tooltip
            arrow
            key={snapshot.fromKey}
            placement="right"
            title={`Entries ${String(snapshot.fromKey)}\u2013${String(snapshot.toKey - 1)}${isFiltered ? ' (filters will be reset)' : ''}`}
          >
            <ListItemButton
              onClick={() => handleSelect(snapshot)}
              selected={selectedFromKey === snapshot.fromKey}
              sx={{ borderRadius: 1, mb: 0.25, px: 0, py: 0.5 }}
            >
              <ListItemText
                disableTypography
                primary={
                  <Box
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                      gap: 0.5,
                    }}
                  >
                    <Chip
                      color={snapshot.stateName.toLowerCase().includes('error') ? 'error' : 'default'}
                      label={snapshot.stateName}
                      size="small"
                      sx={{
                        flexShrink: 1,
                        fontWeight: 'bold',
                        maxWidth: 130,
                        minWidth: 0,
                      }}
                    />
                    <Typography
                      noWrap
                      sx={{
                        color: 'text.secondary',
                      }}
                      variant="caption"
                    >
                      {formatTime(snapshot.time)}
                    </Typography>
                  </Box>
                }
              />
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
    </Box>
  );
};

export default SnapshotList;
