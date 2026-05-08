import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { AppBar, Box, Chip, IconButton, Stack, Toolbar, Tooltip, Typography, useColorScheme } from '@mui/material';
import { type FC } from 'react';

import { buildConfig } from '../../config';

interface AppHeaderProps {
  onOpenFilterManager: () => void;
}

/**
 * Renders the application header bar with title, version, theme toggle, and filter management.
 *
 * @param root0 Component props.
 * @param root0.onOpenFilterManager Callback to open the filter manager dialog.
 * @returns JSX for the app header.
 */
const AppHeader: FC<AppHeaderProps> = ({ onOpenFilterManager }) => {
  const { mode, setMode } = useColorScheme();

  const toggleTheme = (): void => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  return (
    <AppBar
      elevation={0}
      position="static"
      sx={{
        backdropFilter: 'blur(8px)',
        background: 'var(--header-background)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: 'var(--header-box-shadow)',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: '56px !important' }}>
        <Typography
          component="h1"
          sx={{
            fontWeight: 700,
          }}
          variant="h4"
        >
          CCP Log Parser
        </Typography>
        <Chip
          color="primary"
          label={`v${buildConfig.version}`}
          size="small"
          sx={{ fontWeight: 'bold' }}
          variant="outlined"
        />
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={0.5}>
          <Tooltip arrow title="Manage custom filters">
            <IconButton onClick={onOpenFilterManager} size="small">
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip arrow title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={toggleTheme} size="small">
              {mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
