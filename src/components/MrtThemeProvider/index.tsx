import { alpha, createTheme, ThemeProvider, useColorScheme, type PaletteOptions } from '@mui/material';

import { darkColors, lightColors, unifiedTheme } from '../../theme/unifiedTheme';

const componentOverrides = (colors: typeof lightColors) => ({
  MuiButton: {
    styleOverrides: {
      root: {
        fontWeight: 'bold',
        paddingLeft: 16,
        paddingRight: 16,
        textTransform: 'none' as const,
        variants: [
          {
            props: { color: 'secondary' as const, variant: 'outlined' as const },
            style: {
              '&:hover, &.MuiSelected': {
                backgroundColor: colors.alpha.black[5],
                color: colors.alpha.black[100],
              },
              backgroundColor: colors.alpha.white[100],
            },
          },
        ],
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        background: colors.alpha.black[10],
        border: 0,
        height: 1,
      },
      vertical: {
        height: 'auto',
        width: 3,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      elevation: {
        boxShadow: colors.shadows.cardSm,
      },
      elevation0: {
        boxShadow: 'none',
      },
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottomColor: colors.alpha.black[10],
      },
    },
  },
  MuiTooltip: {
    defaultProps: {
      arrow: true,
    },
    styleOverrides: {
      arrow: {
        color: alpha(colors.alpha.black['100'], 0.92),
      },
      tooltip: {
        backdropFilter: 'blur(6px)',
        backgroundColor: alpha(colors.alpha.black['100'], 0.92),
        borderRadius: 8,
        fontSize: 13,
        padding: '8px 16px',
      },
    },
  },
});

const createMrtCompatTheme = (mode: 'dark' | 'light') => {
  const schemes = (unifiedTheme as unknown as { colorSchemes: Record<string, { palette: PaletteOptions }> })
    .colorSchemes;
  const schemePalette = schemes[mode].palette;
  const colors = mode === 'dark' ? darkColors : lightColors;

  return createTheme({
    colors,
    components: componentOverrides(colors),
    general: unifiedTheme.general,
    header: unifiedTheme.header,
    palette: { ...schemePalette, divider: colors.alpha.black[10], mode },
    sidebar: unifiedTheme.sidebar,
    typography: unifiedTheme.typography,
  });
};

const lightMrtTheme = createMrtCompatTheme('light');
const darkMrtTheme = createMrtCompatTheme('dark');

interface MrtThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Wraps material-react-table in a ThemeProvider with `palette.mode` set
 * correctly for the active color scheme.
 *
 * @param props - The component props.
 * @param props.children - The MRT component(s) to wrap.
 * @returns The children wrapped in a ThemeProvider with the correct mode.
 */
const MrtThemeProvider = ({ children }: MrtThemeProviderProps) => {
  const { mode, systemMode } = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && systemMode === 'dark');

  return <ThemeProvider theme={isDark ? darkMrtTheme : lightMrtTheme}>{children}</ThemeProvider>;
};

export { MrtThemeProvider };
