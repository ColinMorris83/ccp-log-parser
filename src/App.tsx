import { Box, CssBaseline, StyledEngineProvider, ThemeProvider } from '@mui/material';
import { useState, type FC } from 'react';

import AppHeader from './components/AppHeader';
import CcpLogParser from './components/CcpLogParser';
import FilterManager from './components/FilterManager';
import { useCustomFilters } from './hooks/useCustomFilters';
import { unifiedTheme } from './theme/unifiedTheme';

/**
 * Root application component.
 * Wires together the MUI theme, custom filter state, header, filter manager dialog,
 * and the main CCP log parser page.
 *
 * @returns JSX for the full application.
 */
const App: FC = () => {
  const { activeFilter, addFilter, filters, removeFilter, setActiveFilterId, updateFilter } = useCustomFilters();
  const [filterManagerOpen, setFilterManagerOpen] = useState(false);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider defaultMode="dark" disableTransitionOnChange noSsr theme={unifiedTheme}>
        <CssBaseline />
        <Box
          sx={{
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            overflow: 'hidden',
          }}
        >
          <AppHeader onOpenFilterManager={() => setFilterManagerOpen(true)} />
          <CcpLogParser
            activeFilter={activeFilter}
            customFilters={filters}
            onOpenFilterManager={() => setFilterManagerOpen(true)}
            onSourceFilterChange={setActiveFilterId}
          />
        </Box>
        <FilterManager
          filters={filters}
          onAddFilter={addFilter}
          onClose={() => setFilterManagerOpen(false)}
          onRemoveFilter={removeFilter}
          onUpdateFilter={updateFilter}
          open={filterManagerOpen}
        />
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default App;
