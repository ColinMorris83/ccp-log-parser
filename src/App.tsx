import { Box, CssBaseline, StyledEngineProvider, ThemeProvider } from '@mui/material';
import { Outlet } from '@tanstack/react-router';
import { type FC } from 'react';

import AppHeader from './components/AppHeader';
import FilterManager from './components/FilterManager';
import { FilterProvider, useFilterContext } from './contexts/FilterContext';
import { unifiedTheme } from './theme/unifiedTheme';

/**
 * Inner layout that consumes FilterContext to render the header and filter manager.
 *
 * @returns JSX for the main layout shell.
 */
const AppLayout: FC = () => {
  const { addFilter, closeFilterManager, filterManagerOpen, filters, openFilterManager, removeFilter, updateFilter } =
    useFilterContext();

  return (
    <>
      <Box
        sx={{
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          overflow: 'hidden',
        }}
      >
        <AppHeader onOpenFilterManager={openFilterManager} />
        <Outlet />
      </Box>
      <FilterManager
        filters={filters}
        onAddFilter={addFilter}
        onClose={closeFilterManager}
        onRemoveFilter={removeFilter}
        onUpdateFilter={updateFilter}
        open={filterManagerOpen}
      />
    </>
  );
};

/**
 * Root application component.
 * Wraps the layout with MUI theme, CSS baseline, and the filter context provider.
 * Child routes render into the `<Outlet />` inside AppLayout.
 *
 * @returns JSX for the full application shell.
 */
const App: FC = () => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider disableTransitionOnChange modeStorageKey="ccp-log-parser:mui-mode" noSsr theme={unifiedTheme}>
      <CssBaseline />
      <FilterProvider>
        <AppLayout />
      </FilterProvider>
    </ThemeProvider>
  </StyledEngineProvider>
);

export default App;
