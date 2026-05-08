import { useColorScheme } from '@mui/material';

import { MRT_DARK_THEME, MRT_LIGHT_THEME } from '../constants/materialReactTable';

/**
 * Returns the correct MRT theme override based on the active color scheme.
 *
 * @returns The MRT theme override for the current color scheme.
 */
export const useMrtTheme = () => {
  const { mode, systemMode } = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && systemMode === 'dark');
  return isDark ? MRT_DARK_THEME : MRT_LIGHT_THEME;
};
