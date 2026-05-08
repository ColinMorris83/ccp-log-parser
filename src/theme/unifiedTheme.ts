import { alpha, createTheme, darken, lighten } from '@mui/material';
import type React from 'react';

// ────────────────────────────────────────────────────────────────────
// MUI theme augmentation
// ────────────────────────────────────────────────────────────────────

declare module '@mui/material/styles' {
  interface Theme {
    colors: {
      alpha: {
        black: { 5: string; 10: string; 30: string; 50: string; 70: string; 100: string };
        trueWhite: { 5: string; 10: string; 30: string; 50: string; 70: string; 100: string };
        white: { 5: string; 10: string; 30: string; 50: string; 70: string; 100: string };
      };
      error: { dark: string; light: string; lighter: string; main: string };
      gradients: {
        black1: string;
        black2: string;
        blue1: string;
        blue2: string;
        blue3: string;
        blue4: string;
        blue5: string;
        green1: string;
        green2: string;
        orange1: string;
        orange2: string;
        orange3: string;
        pink1: string;
        pink2: string;
        purple1: string;
        purple3: string;
      };
      info: { dark: string; light: string; lighter: string; main: string };
      primary: { dark: string; light: string; lighter: string; main: string };
      secondary: { dark: string; light: string; lighter: string; main: string };
      shadows: { error: string; info: string; primary: string; success: string; warning: string };
      success: { dark: string; light: string; lighter: string; main: string };
      warning: { dark: string; light: string; lighter: string; main: string };
    };
    general: {
      borderRadius: string;
      borderRadiusLg: string;
      borderRadiusSm: string;
      borderRadiusXl: string;
      reactFrameworkColor: React.CSSProperties['color'];
    };
    header: {
      background: React.CSSProperties['color'];
      boxShadow: React.CSSProperties['color'];
      height: string;
      textColor: React.CSSProperties['color'];
    };
    sidebar: {
      background: React.CSSProperties['color'];
      boxShadow: React.CSSProperties['color'];
      dividerBg: React.CSSProperties['color'];
      menuItemBg: React.CSSProperties['color'];
      menuItemBgActive: React.CSSProperties['color'];
      menuItemColor: React.CSSProperties['color'];
      menuItemColorActive: React.CSSProperties['color'];
      menuItemHeadingColor: React.CSSProperties['color'];
      menuItemIconColor: React.CSSProperties['color'];
      menuItemIconColorActive: React.CSSProperties['color'];
      textColor: React.CSSProperties['color'];
      width: string;
    };
  }

  interface ThemeOptions {
    colors: Theme['colors'];
    general: Theme['general'];
    header: Theme['header'];
    sidebar: Theme['sidebar'];
  }
}

// ────────────────────────────────────────────────────────────────────
// Light color tokens
// ────────────────────────────────────────────────────────────────────

const lightThemeColors = {
  black: '#0F172A',
  error: '#EF4444',
  info: '#3B82F6',
  primary: '#2563EB',
  primaryAlt: '#1E3A5F',
  secondary: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#ffffff',
};

const lightColors = {
  alpha: {
    black: {
      5: alpha(lightThemeColors.black, 0.02),
      10: alpha(lightThemeColors.black, 0.1),
      30: alpha(lightThemeColors.black, 0.3),
      50: alpha(lightThemeColors.black, 0.5),
      70: alpha(lightThemeColors.black, 0.7),
      100: lightThemeColors.black,
    },
    trueWhite: {
      5: alpha(lightThemeColors.white, 0.02),
      10: alpha(lightThemeColors.white, 0.1),
      30: alpha(lightThemeColors.white, 0.3),
      50: alpha(lightThemeColors.white, 0.5),
      70: alpha(lightThemeColors.white, 0.7),
      100: lightThemeColors.white,
    },
    white: {
      5: alpha(lightThemeColors.white, 0.02),
      10: alpha(lightThemeColors.white, 0.1),
      30: alpha(lightThemeColors.white, 0.3),
      50: alpha(lightThemeColors.white, 0.5),
      70: alpha(lightThemeColors.white, 0.7),
      100: lightThemeColors.white,
    },
  },
  error: {
    dark: darken(lightThemeColors.error, 0.2),
    light: lighten(lightThemeColors.error, 0.3),
    lighter: '#fef2f2',
    main: lightThemeColors.error,
  },
  gradients: {
    black1: 'linear-gradient(100.66deg, #434343 6.56%, #000000 93.57%)',
    black2: 'linear-gradient(60deg, #29323c 0%, #485563 100%)',
    blue1: 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
    blue2: 'linear-gradient(135deg, #ABDCFF 0%, #0396FF 100%)',
    blue3: 'linear-gradient(127.55deg, #141E30 3.73%, #243B55 92.26%)',
    blue4: 'linear-gradient(-20deg, #2b5876 0%, #4e4376 100%)',
    blue5: 'linear-gradient(135deg, #97ABFF 10%, #123597 100%)',
    green1: 'linear-gradient(135deg, #FFF720 0%, #3CD500 100%)',
    green2: 'linear-gradient(to bottom, #00b09b, #96c93d)',
    orange1: 'linear-gradient(135deg, #FCCF31 0%, #F55555 100%)',
    orange2: 'linear-gradient(135deg, #FFD3A5 0%, #FD6585 100%)',
    orange3: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
    pink1: 'linear-gradient(135deg, #F6CEEC 0%, #D939CD 100%)',
    pink2: 'linear-gradient(135deg, #F761A1 0%, #8C1BAB 100%)',
    purple1: 'linear-gradient(135deg, #43CBFF 0%, #9708CC 100%)',
    purple3: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  info: {
    dark: darken(lightThemeColors.info, 0.2),
    light: lighten(lightThemeColors.info, 0.3),
    lighter: lighten(lightThemeColors.info, 0.85),
    main: lightThemeColors.info,
  },
  layout: {
    general: {
      bodyBg: '#F8F9FC',
    },
    sidebar: {
      background: lightThemeColors.white,
      dividerBg: '#E2E8F0',
      menuItemBg: 'transparent',
      menuItemBgActive: '#EFF6FF',
      menuItemColor: '#475569',
      menuItemColorActive: lightThemeColors.primary,
      menuItemHeadingColor: '#94A3B8',
      menuItemIconColor: '#94A3B8',
      menuItemIconColorActive: lightThemeColors.primary,
      textColor: lightThemeColors.secondary,
    },
  },
  primary: {
    dark: darken(lightThemeColors.primary, 0.2),
    light: lighten(lightThemeColors.primary, 0.3),
    lighter: lighten(lightThemeColors.primary, 0.85),
    main: lightThemeColors.primary,
  },
  secondary: {
    dark: darken(lightThemeColors.secondary, 0.2),
    light: lighten(lightThemeColors.secondary, 0.25),
    lighter: lighten(lightThemeColors.secondary, 0.85),
    main: lightThemeColors.secondary,
  },
  shadows: {
    card: '0px 1px 3px rgba(15, 23, 42, 0.06), 0px 1px 2px rgba(15, 23, 42, 0.04)',
    cardLg: '0 12px 40px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.04)',
    cardSm: '0 1px 2px rgba(15, 23, 42, 0.04)',
    error: '0px 1px 4px rgba(239, 68, 68, 0.25), 0px 3px 12px 2px rgba(239, 68, 68, 0.35)',
    info: '0px 1px 4px rgba(59, 130, 246, 0.25), 0px 3px 12px 2px rgba(59, 130, 246, 0.35)',
    primary: '0px 1px 4px rgba(37, 99, 235, 0.25), 0px 3px 12px 2px rgba(37, 99, 235, 0.35)',
    success: '0px 1px 4px rgba(16, 185, 129, 0.25), 0px 3px 12px 2px rgba(16, 185, 129, 0.35)',
    warning: '0px 1px 4px rgba(245, 158, 11, 0.25), 0px 3px 12px 2px rgba(245, 158, 11, 0.35)',
  },
  success: {
    dark: darken(lightThemeColors.success, 0.2),
    light: lighten(lightThemeColors.success, 0.3),
    lighter: '#ecfdf5',
    main: lightThemeColors.success,
  },
  warning: {
    dark: darken(lightThemeColors.warning, 0.2),
    light: lighten(lightThemeColors.warning, 0.3),
    lighter: '#fffbeb',
    main: lightThemeColors.warning,
  },
};

// ────────────────────────────────────────────────────────────────────
// Dark color tokens
// ────────────────────────────────────────────────────────────────────

const darkThemeColors = {
  black: '#F1F5F9',
  error: '#F87171',
  info: '#60A5FA',
  primary: '#60A5FA',
  primaryAlt: '#0E1225',
  secondary: '#94A3B8',
  success: '#34D399',
  trueWhite: '#ffffff',
  warning: '#FBBF24',
  white: '#131825',
};

const darkColors = {
  alpha: {
    black: {
      5: alpha(darkThemeColors.black, 0.02),
      10: alpha(darkThemeColors.black, 0.1),
      30: alpha(darkThemeColors.black, 0.3),
      50: alpha(darkThemeColors.black, 0.5),
      70: alpha(darkThemeColors.black, 0.7),
      100: darkThemeColors.black,
    },
    trueWhite: {
      5: alpha(darkThemeColors.trueWhite, 0.02),
      10: alpha(darkThemeColors.trueWhite, 0.1),
      30: alpha(darkThemeColors.trueWhite, 0.3),
      50: alpha(darkThemeColors.trueWhite, 0.5),
      70: alpha(darkThemeColors.trueWhite, 0.7),
      100: darkThemeColors.trueWhite,
    },
    white: {
      5: alpha(darkThemeColors.white, 0.02),
      10: alpha(darkThemeColors.white, 0.1),
      30: alpha(darkThemeColors.white, 0.3),
      50: alpha(darkThemeColors.white, 0.5),
      70: alpha(darkThemeColors.white, 0.7),
      100: darkThemeColors.white,
    },
  },
  error: {
    dark: darken(darkThemeColors.error, 0.2),
    light: lighten(darkThemeColors.error, 0.3),
    lighter: alpha(darkThemeColors.error, 0.85),
    main: darkThemeColors.error,
  },
  gradients: {
    black1: 'linear-gradient(100.66deg, #434343 6.56%, #000000 93.57%)',
    black2: 'linear-gradient(60deg, #29323c 0%, #485563 100%)',
    blue1: 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
    blue2: 'linear-gradient(135deg, #ABDCFF 0%, #0396FF 100%)',
    blue3: 'linear-gradient(127.55deg, #141E30 3.73%, #243B55 92.26%)',
    blue4: 'linear-gradient(-20deg, #2b5876 0%, #4e4376 100%)',
    blue5: 'linear-gradient(135deg, #97ABFF 10%, #123597 100%)',
    green1: 'linear-gradient(135deg, #FFF720 0%, #3CD500 100%)',
    green2: 'linear-gradient(to bottom, #00b09b, #96c93d)',
    orange1: 'linear-gradient(135deg, #FCCF31 0%, #F55555 100%)',
    orange2: 'linear-gradient(135deg, #FFD3A5 0%, #FD6585 100%)',
    orange3: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)',
    pink1: 'linear-gradient(135deg, #F6CEEC 0%, #D939CD 100%)',
    pink2: 'linear-gradient(135deg, #F761A1 0%, #8C1BAB 100%)',
    purple1: 'linear-gradient(135deg, #43CBFF 0%, #9708CC 100%)',
    purple3: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  info: {
    dark: darken(darkThemeColors.info, 0.2),
    light: lighten(darkThemeColors.info, 0.3),
    lighter: alpha(darkThemeColors.info, 0.85),
    main: darkThemeColors.info,
  },
  layout: {
    general: {
      bodyBg: '#0B0F1A',
    },
    sidebar: {
      background: darkThemeColors.primaryAlt,
      dividerBg: '#1E2742',
      menuItemBg: 'transparent',
      menuItemBgActive: 'rgba(96, 165, 250, 0.1)',
      menuItemColor: '#94A3B8',
      menuItemColorActive: '#60A5FA',
      menuItemHeadingColor: '#64748B',
      menuItemIconColor: '#64748B',
      menuItemIconColorActive: '#60A5FA',
      textColor: darkThemeColors.secondary,
    },
  },
  primary: {
    dark: darken(darkThemeColors.primary, 0.2),
    light: lighten(darkThemeColors.primary, 0.3),
    lighter: alpha(darkThemeColors.primary, 0.85),
    main: darkThemeColors.primary,
  },
  secondary: {
    dark: darken(darkThemeColors.secondary, 0.2),
    light: lighten(darkThemeColors.secondary, 0.25),
    lighter: alpha(darkThemeColors.secondary, 0.85),
    main: darkThemeColors.secondary,
  },
  shadows: {
    card: '0px 1px 3px rgba(0, 0, 0, 0.25), 0px 1px 2px rgba(0, 0, 0, 0.15)',
    cardLg: '0 12px 40px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
    cardSm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    error: '0px 1px 4px rgba(248, 113, 113, 0.25), 0px 3px 12px 2px rgba(248, 113, 113, 0.35)',
    info: '0px 1px 4px rgba(96, 165, 250, 0.25), 0px 3px 12px 2px rgba(96, 165, 250, 0.35)',
    primary: '0px 1px 4px rgba(96, 165, 250, 0.25), 0px 3px 12px 2px rgba(96, 165, 250, 0.35)',
    success: '0px 1px 4px rgba(52, 211, 153, 0.25), 0px 3px 12px 2px rgba(52, 211, 153, 0.35)',
    warning: '0px 1px 4px rgba(251, 191, 36, 0.25), 0px 3px 12px 2px rgba(251, 191, 36, 0.35)',
  },
  success: {
    dark: darken(darkThemeColors.success, 0.2),
    light: lighten(darkThemeColors.success, 0.3),
    lighter: alpha(darkThemeColors.success, 0.85),
    main: darkThemeColors.success,
  },
  warning: {
    dark: darken(darkThemeColors.warning, 0.2),
    light: lighten(darkThemeColors.warning, 0.3),
    lighter: alpha(darkThemeColors.warning, 0.85),
    main: darkThemeColors.warning,
  },
};

// ────────────────────────────────────────────────────────────────────
// Shared shadows arrays
// ────────────────────────────────────────────────────────────────────

const lightShadows = [
  'none',
  '0px 1px 2px rgba(15, 23, 42, 0.04)',
  '0px 1px 3px rgba(15, 23, 42, 0.06), 0px 1px 2px rgba(15, 23, 42, 0.04)',
  '0px 3px 6px rgba(15, 23, 42, 0.06), 0px 1px 3px rgba(15, 23, 42, 0.04)',
  '0px 4px 8px rgba(15, 23, 42, 0.06), 0px 2px 4px rgba(15, 23, 42, 0.04)',
  '0px 6px 12px rgba(15, 23, 42, 0.07), 0px 2px 4px rgba(15, 23, 42, 0.04)',
  '0px 8px 16px rgba(15, 23, 42, 0.08), 0px 3px 6px rgba(15, 23, 42, 0.04)',
  '0px 10px 20px rgba(15, 23, 42, 0.08), 0px 4px 8px rgba(15, 23, 42, 0.04)',
  '0px 12px 24px rgba(15, 23, 42, 0.1), 0px 4px 8px rgba(15, 23, 42, 0.04)',
  '0px 16px 32px rgba(15, 23, 42, 0.1), 0px 6px 12px rgba(15, 23, 42, 0.04)',
  '0px 20px 40px rgba(15, 23, 42, 0.12), 0px 8px 16px rgba(15, 23, 42, 0.04)',
  '0px 24px 48px rgba(15, 23, 42, 0.12), 0px 8px 16px rgba(15, 23, 42, 0.04)',
  '0px 28px 56px rgba(15, 23, 42, 0.14), 0px 10px 20px rgba(15, 23, 42, 0.04)',
  '0px 32px 64px rgba(15, 23, 42, 0.14), 0px 10px 20px rgba(15, 23, 42, 0.04)',
  '0px 36px 72px rgba(15, 23, 42, 0.16), 0px 12px 24px rgba(15, 23, 42, 0.04)',
  '0px 40px 80px rgba(15, 23, 42, 0.16), 0px 12px 24px rgba(15, 23, 42, 0.04)',
  '0px 44px 88px rgba(15, 23, 42, 0.18), 0px 14px 28px rgba(15, 23, 42, 0.04)',
  '0px 48px 96px rgba(15, 23, 42, 0.18), 0px 14px 28px rgba(15, 23, 42, 0.04)',
  '0px 52px 104px rgba(15, 23, 42, 0.2), 0px 16px 32px rgba(15, 23, 42, 0.04)',
  '0px 56px 112px rgba(15, 23, 42, 0.2), 0px 16px 32px rgba(15, 23, 42, 0.04)',
  '0px 60px 120px rgba(15, 23, 42, 0.22), 0px 18px 36px rgba(15, 23, 42, 0.04)',
  '0px 64px 128px rgba(15, 23, 42, 0.22), 0px 18px 36px rgba(15, 23, 42, 0.04)',
  '0px 68px 136px rgba(15, 23, 42, 0.24), 0px 20px 40px rgba(15, 23, 42, 0.04)',
  '0px 72px 144px rgba(15, 23, 42, 0.24), 0px 20px 40px rgba(15, 23, 42, 0.04)',
  '0px 76px 152px rgba(15, 23, 42, 0.26), 0px 22px 44px rgba(15, 23, 42, 0.04)',
] as const;

// ────────────────────────────────────────────────────────────────────
// Unified theme
// ────────────────────────────────────────────────────────────────────

/**
 * Unified MUI theme with CSS variables support. Defines both light and dark color
 * schemes in a single `createTheme()` call so that mode switching updates CSS custom
 * properties instantly, eliminating the Emotion class-regeneration flash.
 */
export const unifiedTheme = createTheme({
  breakpoints: {
    values: {
      lg: 1280,
      md: 960,
      sm: 600,
      xl: 1840,
      xs: 0,
    },
  },
  // Light colors used as default (light is the default color scheme)
  colors: {
    alpha: lightColors.alpha,
    error: {
      dark: lightColors.error.dark,
      light: lightColors.error.light,
      lighter: lightColors.error.lighter,
      main: lightColors.error.main,
    },
    gradients: lightColors.gradients,
    info: {
      dark: lightColors.info.dark,
      light: lightColors.info.light,
      lighter: lightColors.info.lighter,
      main: lightColors.info.main,
    },
    primary: {
      dark: lightColors.primary.dark,
      light: lightColors.primary.light,
      lighter: lightColors.primary.lighter,
      main: lightColors.primary.main,
    },
    secondary: {
      dark: lightColors.secondary.dark,
      light: lightColors.secondary.light,
      lighter: lightColors.secondary.lighter,
      main: lightColors.secondary.main,
    },
    shadows: lightColors.shadows,
    success: {
      dark: lightColors.success.dark,
      light: lightColors.success.light,
      lighter: lightColors.success.lighter,
      main: lightColors.success.main,
    },
    warning: {
      dark: lightColors.warning.dark,
      light: lightColors.warning.light,
      lighter: lightColors.warning.lighter,
      main: lightColors.warning.main,
    },
  },
  colorSchemes: {
    dark: {
      palette: {
        action: {
          activatedOpacity: 0.12,
          active: darkColors.alpha.black[100],
          disabled: darkColors.alpha.black[50],
          disabledBackground: darkColors.alpha.black[5],
          disabledOpacity: 0.38,
          focus: darkColors.alpha.black[10],
          focusOpacity: 0.05,
          hover: darkColors.alpha.black[10],
          hoverOpacity: 0.1,
          selected: darkColors.alpha.black[10],
          selectedOpacity: 0.1,
        },
        background: {
          default: darkColors.layout.general.bodyBg,
          paper: darkColors.alpha.white[100],
        },
        common: {
          black: darkColors.alpha.black[100],
          white: darkColors.alpha.white[100],
        },
        error: {
          contrastText: darkThemeColors.trueWhite,
          dark: darkColors.error.dark,
          light: darkColors.error.light,
          main: darkColors.error.main,
        },
        info: {
          contrastText: darkThemeColors.trueWhite,
          dark: darkColors.info.dark,
          light: darkColors.info.light,
          main: darkColors.info.main,
        },
        primary: {
          dark: darkColors.primary.dark,
          light: darkColors.primary.light,
          main: darkColors.primary.main,
        },
        secondary: {
          dark: darkColors.secondary.dark,
          light: darkColors.secondary.light,
          main: darkColors.secondary.main,
        },
        success: {
          contrastText: darkThemeColors.trueWhite,
          dark: darkColors.success.dark,
          light: darkColors.success.light,
          main: darkColors.success.main,
        },
        text: {
          disabled: darkColors.alpha.black[50],
          primary: darkColors.alpha.black[100],
          secondary: darkColors.alpha.black[70],
        },
        warning: {
          contrastText: darkThemeColors.trueWhite,
          dark: darkColors.warning.dark,
          light: darkColors.warning.light,
          main: darkColors.warning.main,
        },
      },
    },
    light: {
      palette: {
        action: {
          activatedOpacity: 0.12,
          active: lightColors.alpha.black[100],
          disabled: lightColors.alpha.black[50],
          disabledBackground: lightColors.alpha.black[5],
          disabledOpacity: 0.38,
          focus: lightColors.alpha.black[10],
          focusOpacity: 0.05,
          hover: lightColors.alpha.black[5],
          hoverOpacity: 0.1,
          selected: lightColors.alpha.black[10],
          selectedOpacity: 0.1,
        },
        background: {
          default: lightColors.layout.general.bodyBg,
          paper: lightColors.alpha.white[100],
        },
        common: {
          black: lightColors.alpha.black[100],
          white: lightColors.alpha.white[100],
        },
        error: {
          contrastText: lightColors.alpha.white[100],
          dark: lightColors.error.dark,
          light: lightColors.error.light,
          main: lightColors.error.main,
        },
        grey: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          A100: '#E2E8F0',
          A200: '#94A3B8',
          A400: '#334155',
          A700: '#1E293B',
        },
        info: {
          contrastText: lightColors.alpha.white[100],
          dark: lightColors.info.dark,
          light: lightColors.info.light,
          main: lightColors.info.main,
        },
        primary: {
          dark: lightColors.primary.dark,
          light: lightColors.primary.light,
          main: lightColors.primary.main,
        },
        secondary: {
          dark: lightColors.secondary.dark,
          light: lightColors.secondary.light,
          main: lightColors.secondary.main,
        },
        success: {
          contrastText: lightColors.alpha.white[100],
          dark: lightColors.success.dark,
          light: lightColors.success.light,
          main: lightColors.success.main,
        },
        text: {
          disabled: lightColors.alpha.black[50],
          primary: lightColors.alpha.black[100],
          secondary: lightColors.alpha.black[70],
        },
        tonalOffset: 0.5,
        warning: {
          contrastText: lightColors.alpha.white[100],
          dark: lightColors.warning.dark,
          light: lightColors.warning.light,
          main: lightColors.warning.main,
        },
      },
    },
  },
  components: {
    MuiAccordion: {
      styleOverrides: {
        root: {
          '&.Mui-expanded': {
            margin: 0,
          },
          '&::before': {
            display: 'none',
          },
          boxShadow: 'none',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        action: ({ theme }) => ({
          color: lightColors.alpha.black[70],
          ...theme.applyStyles('dark', {
            color: darkColors.alpha.black[70],
          }),
        }),
        message: {
          fontSize: 14,
          lineHeight: 1.5,
        },
        root: {
          variants: [
            {
              props: { color: 'info', variant: 'standard' },
              style: ({ theme }) => ({
                color: lightColors.info.main,
                ...theme.applyStyles('dark', {
                  color: darkColors.info.main,
                }),
              }),
            },
          ],
        },
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        openOnFocus: true,
      },
      styleOverrides: {
        clearIndicator: ({ theme }) => ({
          '&:hover': {
            background: lightColors.error.lighter,
            color: lightColors.error.dark,
          },
          background: lightColors.error.lighter,
          color: lightColors.error.main,
          marginRight: 8,
          ...theme.applyStyles('dark', {
            '&:hover': {
              background: alpha(darkColors.error.lighter, 0.3),
            },
            background: alpha(darkColors.error.lighter, 0.2),
            color: darkColors.error.main,
          }),
        }),
        popupIndicator: ({ theme }) => ({
          '&:hover': {
            background: lightColors.primary.lighter,
            color: lightColors.primary.main,
          },
          color: lightColors.alpha.black[50],
          ...theme.applyStyles('dark', {
            '&:hover': {
              background: alpha(darkColors.primary.lighter, 0.2),
            },
            color: darkColors.alpha.black[70],
          }),
        }),
        root: {
          '.MuiAutocomplete-inputRoot.MuiOutlinedInput-root .MuiAutocomplete-endAdornment': {
            right: 14,
          },
        },
        tag: {
          margin: 1,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        colorDefault: {
          '[data-mui-color-scheme="dark"] &': {
            background: darkColors.alpha.black[30],
            color: darkColors.alpha.trueWhite[100],
          },
          background: lightColors.alpha.black[30],
          color: lightColors.alpha.white[100],
        },
        root: {
          fontSize: 14,
          fontWeight: 'bold',
        },
      },
    },
    MuiAvatarGroup: {
      styleOverrides: {
        avatar: {
          '&:first-of-type': {
            background: 'transparent',
            border: 0,
          },
          background: lightColors.alpha.black[10],
          color: lightColors.alpha.black[70],
          fontSize: 13,
          fontWeight: 'bold',
        },
        root: {
          alignItems: 'center',
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.MuiBackdrop-invisible': {
            backdropFilter: 'blur(2px)',
            backgroundColor: 'transparent',
          },
          backdropFilter: 'blur(2px)',
          backgroundColor: alpha(darken(lightThemeColors.primaryAlt, 0.4), 0.2),
          ...theme.applyStyles('dark', {
            backgroundColor: alpha(darken('#070C27', 0.5), 0.4),
          }),
        }),
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: false,
      },
      styleOverrides: {
        endIcon: {
          marginRight: -8,
        },
        root: ({ theme }) => ({
          '.MuiSvgIcon-root': {
            transition: 'all .2s',
          },
          fontWeight: 'bold',
          paddingLeft: 16,
          paddingRight: 16,
          textTransform: 'none',
          transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
          variants: [
            {
              props: { variant: 'contained' },
              style: {
                '&:active': {
                  boxShadow: 'none',
                  transform: 'translateY(0)',
                },
                '&:hover': {
                  boxShadow: '0 2px 8px ' + alpha(lightThemeColors.primary, 0.3),
                  transform: 'translateY(-1px)',
                },
                ...theme.applyStyles('dark', {
                  '&:hover': {
                    boxShadow: '0 2px 8px ' + alpha(darkThemeColors.primary, 0.35),
                  },
                }),
              },
            },
            {
              props: { color: 'primary', variant: 'contained' },
              style: theme.applyStyles('dark', {
                backgroundColor: '#3B6FCF',
                color: '#F1F5F9',
              }),
            },
            {
              props: { color: 'secondary', variant: 'contained' },
              style: {
                '&:hover': {
                  boxShadow: '0 2px 8px ' + alpha(lightThemeColors.secondary, 0.25),
                },
                backgroundColor: lightColors.secondary.main,
                border: '1px solid ' + lightColors.alpha.black[30],
                color: lightColors.alpha.white[100],
                ...theme.applyStyles('dark', {
                  '&:hover': {
                    boxShadow: '0 2px 8px ' + alpha(darkThemeColors.secondary, 0.3),
                  },
                  backgroundColor: darkColors.secondary.main,
                  border: '1px solid ' + darkColors.alpha.black[30],
                  color: darkColors.alpha.white[100],
                }),
              },
            },
            {
              props: { variant: 'outlined' },
              style: {
                '&:hover': {
                  backgroundColor: alpha(lightThemeColors.primary, 0.04),
                  borderColor: lightColors.primary.main,
                },
                ...theme.applyStyles('dark', {
                  '&:hover': {
                    backgroundColor: alpha(darkThemeColors.primary, 0.08),
                    borderColor: darkColors.primary.main,
                  },
                }),
              },
            },
            {
              props: { color: 'secondary', variant: 'outlined' },
              style: {
                '&:hover, &.MuiSelected': {
                  backgroundColor: lightColors.alpha.black[5],
                  color: lightColors.alpha.black[100],
                },
                backgroundColor: lightColors.alpha.white[100],
                ...theme.applyStyles('dark', {
                  '&:hover, &.MuiSelected': {
                    backgroundColor: darkColors.alpha.black[5],
                    color: darkColors.alpha.black[100],
                  },
                  backgroundColor: darkColors.alpha.white[100],
                }),
              },
            },
          ],
        }),
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '2px solid ' + lightColors.primary.main,
            outlineOffset: 2,
          },
          borderRadius: 6,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: lightThemeColors.white,
          backgroundImage: 'none',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          boxShadow: lightColors.shadows.cardSm,
          transition:
            'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          ...theme.applyStyles('dark', {
            backgroundColor: '#111827',
            border: '1px solid #1E2742',
            boxShadow: darkColors.shadows.cardSm,
          }),
        }),
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        action: {
          marginBottom: -5,
          marginTop: -5,
        },
        title: {
          fontSize: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorSecondary: {
          '&:hover': {
            background: lightColors.alpha.black[10],
          },
          background: lightColors.alpha.black[5],
          color: lightColors.alpha.black[100],
        },
        deleteIcon: ({ theme }) => ({
          '&:hover': {
            color: lightColors.error.main,
          },
          color: lightColors.error.light,
          ...theme.applyStyles('dark', {
            '&:hover': {
              color: darkColors.alpha.black[70],
            },
            color: darkColors.alpha.black[50],
          }),
        }),
        root: {
          transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        ':root': {
          '--colors-primary-main': lightColors.primary.main,
          '--header-background': 'rgba(255, 255, 255, 0.72)',
          '--header-box-shadow': '0 1px 0 rgba(226, 232, 240, 0.92), 0 10px 30px rgba(15, 23, 42, 0.04)',
          '--header-text-color': lightColors.secondary.main,
          '--sidebar-background': lightColors.layout.sidebar.background,
          '--sidebar-box-shadow': '1px 0 0 #E2E8F0',
          '--sidebar-divider-bg': lightColors.layout.sidebar.dividerBg,
          '--sidebar-menu-item-bg-active': lightColors.layout.sidebar.menuItemBgActive,
          '--sidebar-menu-item-color': lightColors.layout.sidebar.menuItemColor,
          '--sidebar-menu-item-color-active': lightColors.layout.sidebar.menuItemColorActive,
          '--sidebar-menu-item-heading-color': lightColors.layout.sidebar.menuItemHeadingColor,
          '--sidebar-menu-item-icon-color': lightColors.layout.sidebar.menuItemIconColor,
          '--sidebar-menu-item-icon-color-active': lightColors.layout.sidebar.menuItemIconColorActive,
          '--sidebar-text-color': lightColors.layout.sidebar.textColor,
          '--swiper-theme-color': lightColors.primary.main,
          '--tab-color': lightColors.alpha.black[70],
          '--tab-hover-color': lightColors.alpha.black[100],
          '--tab-indicator-bg': lightColors.primary.main,
          '--tab-indicator-border': '1px solid ' + lightColors.primary.dark,
          '--tab-indicator-shadow': 'none',
          '--tab-selected-color': lightColors.alpha.white[100],
          '--typography-caption-color': lightColors.alpha.black[50],
          '--typography-h3-color': lightColors.alpha.black[100],
          '--typography-subtitle-color': lightColors.alpha.black[70],
        },
        ':root.dark': {
          '--colors-primary-main': darkColors.primary.main,
          '--header-background': 'rgba(11, 15, 26, 0.72)',
          '--header-box-shadow': '0 1px 0 rgba(30, 39, 66, 0.95), 0 14px 32px rgba(0, 0, 0, 0.18)',
          '--header-text-color': darkColors.secondary.main,
          '--sidebar-background': darkColors.layout.sidebar.background,
          '--sidebar-box-shadow': '1px 0 0 #1E2742',
          '--sidebar-divider-bg': darkColors.layout.sidebar.dividerBg,
          '--sidebar-menu-item-bg-active': darkColors.layout.sidebar.menuItemBgActive,
          '--sidebar-menu-item-color': darkColors.layout.sidebar.menuItemColor,
          '--sidebar-menu-item-color-active': darkColors.layout.sidebar.menuItemColorActive,
          '--sidebar-menu-item-heading-color': darkColors.layout.sidebar.menuItemHeadingColor,
          '--sidebar-menu-item-icon-color': darkColors.layout.sidebar.menuItemIconColor,
          '--sidebar-menu-item-icon-color-active': darkColors.layout.sidebar.menuItemIconColorActive,
          '--sidebar-text-color': darkColors.layout.sidebar.textColor,
          '--swiper-theme-color': darkColors.primary.main,
          '--tab-color': darkColors.alpha.black[70],
          '--tab-hover-color': darkColors.alpha.trueWhite[70],
          '--tab-indicator-bg': '#3B6FCF',
          '--tab-indicator-border': '1px solid ' + darken('#3B6FCF', 0.15),
          '--tab-indicator-shadow': '0px 2px 10px ' + alpha('#3B6FCF', 0.3),
          '--tab-selected-color': darkColors.alpha.trueWhite[100],
          '--typography-caption-color': darkColors.alpha.black[50],
          '--typography-h3-color': darkColors.alpha.black[100],
          '--typography-subtitle-color': darkColors.alpha.black[70],
        },
        '@keyframes float': {
          '0%': {
            transform: 'translate(0%, 0%)',
          },
          '100%': {
            transform: 'translate(3%, 3%)',
          },
        },
        '@keyframes ripple': {
          '0%': {
            opacity: 1,
            transform: 'scale(.8)',
          },
          '100%': {
            opacity: 0,
            transform: 'scale(2.8)',
          },
        },
        code: {
          background: lightColors.info.lighter,
          borderRadius: 4,
          color: lightColors.info.dark,
          padding: 4,
          ...theme.applyStyles('dark', {
            background: darkColors.info.lighter,
            color: darkColors.alpha.black[100],
          }),
        },
        'html, body, #root': {
          height: '100%',
          width: '100%',
        },
        ...theme.applyStyles('dark', {
          '#root': {
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
          },
          ':root': {
            colorScheme: 'dark',
          },
          body: {
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            minHeight: '100%',
          },
          html: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            MozOsxFontSmoothing: 'grayscale',
            WebkitFontSmoothing: 'antialiased',
          },
        }),
      }),
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 10,
          boxShadow: lightColors.shadows.cardLg,
          ...theme.applyStyles('dark', {
            backgroundColor: darken(darkThemeColors.primaryAlt, 0.5),
            boxShadow: darkColors.shadows.cardLg,
          }),
        }),
        paperFullScreen: {
          borderRadius: 0,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '8px 24px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundAttachment: 'local, local, scroll, scroll, scroll, scroll',
          backgroundImage: `
            linear-gradient(to bottom, #ffffff 30%, rgba(255,255,255,0)),
            linear-gradient(to top, #ffffff 30%, rgba(255,255,255,0)),
            linear-gradient(to bottom, rgba(37,99,235,0.07), rgba(37,99,235,0.02) 60%, transparent),
            linear-gradient(to top, rgba(37,99,235,0.07), rgba(37,99,235,0.02) 60%, transparent),
            linear-gradient(to bottom, rgba(37,99,235,0.09), transparent 1px),
            linear-gradient(to top, rgba(37,99,235,0.09), transparent 1px)
          `,
          backgroundPosition: 'top, bottom, top, bottom, top, bottom',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 28px, 100% 28px, 100% 16px, 100% 16px, 100% 1px, 100% 1px',
          ...theme.applyStyles('dark', {
            backgroundImage: `
              linear-gradient(to bottom, ${darken(darkThemeColors.primaryAlt, 0.5)} 30%, rgba(7,9,18,0)),
              linear-gradient(to top, ${darken(darkThemeColors.primaryAlt, 0.5)} 30%, rgba(7,9,18,0)),
              linear-gradient(to bottom, rgba(96,165,250,0.08), rgba(96,165,250,0.02) 60%, transparent),
              linear-gradient(to top, rgba(96,165,250,0.08), rgba(96,165,250,0.02) 60%, transparent),
              linear-gradient(to bottom, rgba(96,165,250,0.12), transparent 1px),
              linear-gradient(to top, rgba(96,165,250,0.12), transparent 1px)
            `,
          }),
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: 18,
          fontWeight: 700,
          padding: '20px 24px 12px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          background: lightColors.alpha.black[10],
          border: 0,
          height: 1,
          ...theme.applyStyles('dark', {
            background: darkColors.alpha.black[10],
          }),
        }),
        vertical: ({ theme }) => ({
          '&.MuiDivider-absolute.MuiDivider-fullWidth': {
            height: '100%',
          },
          '&.MuiDivider-flexItem.MuiDivider-fullWidth': {},
          height: 'auto',
          width: 3,
          ...theme.applyStyles('dark', {
            width: 1,
          }),
        }),
        withChildren: {
          '&:before, &:after': {
            border: 0,
          },
        },
        wrapper: {
          background: lightColors.alpha.white[100],
          color: 'inherit',
          fontWeight: 'bold',
          height: 24,
          lineHeight: '24px',
          marginTop: -12,
          textTransform: 'uppercase',
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontWeight: 'bold',
          marginLeft: 8,
          marginRight: 8,
          textTransform: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '& .MuiTouchRipple-root': {
            borderRadius: 6,
          },
          borderRadius: 6,
        },
        sizeSmall: {
          padding: 4,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          height: 6,
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
    },
    MuiList: {
      styleOverrides: {
        padding: {
          '& .MuiListItem-button': {
            borderRadius: 6,
            margin: '1px 0',
          },
          padding: '12px',
        },
        root: ({ theme }) => ({
          '& .MuiListItem-button, & .MuiListItemButton-root': {
            '& .MuiTouchRipple-root': {
              opacity: 0.2,
            },
            '& > .MuiSvgIcon-root': {
              minWidth: 34,
            },
            transition: 'all .2s',
          },
          '& .MuiListItem-root.MuiButtonBase-root.Mui-selected': {
            backgroundColor: lightColors.alpha.black[10],
          },
          padding: 0,
          ...theme.applyStyles('dark', {
            '& .MuiMenuItem-root.MuiButtonBase-root .MuiTouchRipple-root': {
              opacity: 0.2,
            },
            '& .MuiMenuItem-root.MuiButtonBase-root:active': {
              backgroundColor: alpha(darkColors.primary.lighter, 0.2),
            },
          }),
        }),
      },
    },
    MuiListItem: {
      styleOverrides: {
        dense: {
          '&::before': {
            background: lightColors.primary.light,
            borderRadius: '50%',
            content: '""',
            flexShrink: 0,
            height: 5,
            marginRight: 10,
            width: 5,
          },
        },
        root: ({ theme }) => ({
          '&.MuiButtonBase-root': {
            '&:hover, &:active, &.active, &.Mui-selected': {
              background: lighten(lightColors.primary.lighter, 0.5),
              color: lightColors.alpha.black[100],
            },
            color: lightColors.secondary.main,
          },
          ...theme.applyStyles('dark', {
            '&.MuiButtonBase-root': {
              '&:hover, &:active, &.active, &.Mui-selected': {
                background: darkColors.alpha.black[10],
                color: darkColors.alpha.black[100],
              },
              color: darkColors.secondary.main,
            },
          }),
        }),
      },
    },
    MuiListItemAvatar: {
      styleOverrides: {
        alignItemsFlexStart: {
          marginTop: 0,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.MuiButtonBase-root': {
            '&:hover, &:active, &.active, &.Mui-selected': {
              background: lighten(lightColors.primary.lighter, 0.5),
              color: lightColors.alpha.black[100],
            },
            color: lightColors.secondary.main,
          },
          ...theme.applyStyles('dark', {
            '&.MuiButtonBase-root': {
              '&:hover, &:active, &.active, &.Mui-selected': {
                background: darkColors.alpha.black[10],
                color: darkColors.alpha.black[100],
              },
              color: darkColors.secondary.main,
            },
          }),
        }),
      },
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          margin: 0,
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        colorPrimary: {
          background: lightColors.alpha.black[5],
          color: lightColors.alpha.black[70],
          fontSize: 13,
          fontWeight: 'bold',
          lineHeight: '40px',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        list: ({ theme }) => ({
          '& .MuiMenuItem-root.MuiButtonBase-root': {
            '& .MuiTouchRipple-root': {
              opacity: 0.2,
            },
            '&:hover, &:active, &.active, &.Mui-selected': {
              background: lighten(lightColors.primary.lighter, 0.5),
              color: lightColors.alpha.black[100],
            },
            color: lightColors.alpha.black[70],
            fontSize: 14,
            marginBottom: 1,
            marginTop: 1,
            transition: 'all .2s',
          },
          padding: 12,
          ...theme.applyStyles('dark', {
            '& .MuiMenuItem-root.MuiButtonBase-root': {
              '&:hover, &:active, &.active, &.Mui-selected': {
                background: alpha(darkColors.primary.lighter, 0.2),
                color: darkColors.alpha.black[100],
              },
              color: darkColors.alpha.black[70],
            },
          }),
        }),
        paper: {
          padding: 12,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) =>
          theme.applyStyles('dark', {
            '&.Mui-selected:hover': {
              background: alpha(darkColors.primary.lighter, 0.2),
            },
            '&:hover, &:active, &.active, &.Mui-selected': {
              background: alpha(darkColors.primary.lighter, 0.2),
              color: darkColors.alpha.black[100],
            },
            background: 'transparent',
            transition: 'all .2s',
          }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-focused': {
            backgroundColor: lightThemeColors.white,
            boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.12)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: lightColors.primary.main,
            borderWidth: 1,
          },
          '&.Mui-focused:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: lightColors.primary.main,
          },
          '& .MuiInputAdornment-positionEnd.MuiInputAdornment-outlined': {},
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E2E8F0',
            transition:
              'border-color 160ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 160ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#CBD5E1',
          },
          backgroundColor: '#F8FAFC',
          borderRadius: 8,
          paddingRight: 10,
          transition:
            'background-color 160ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 160ms cubic-bezier(0.4, 0, 0.2, 1)',
          ...theme.applyStyles('dark', {
            '&.Mui-focused': {
              backgroundColor: '#101726',
              boxShadow: '0 0 0 4px rgba(96, 165, 250, 0.16)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: darkColors.primary.main,
            },
            '&.Mui-focused:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: darkColors.primary.main,
            },
            '& .MuiInputAdornment-positionEnd.MuiInputAdornment-outlined': {
              paddingRight: 6,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#24304A',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#334155',
            },
            backgroundColor: '#151B2B',
            paddingRight: undefined,
          }),
        }),
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        page: {
          fontSize: 13,
          fontWeight: 'bold',
          transition: 'all .2s',
        },
        root: {
          variants: [
            {
              props: { color: 'primary', variant: 'text' },
              style: {
                '&.Mui-selected': {
                  boxShadow: lightColors.shadows.primary,
                },
                '&.Mui-selected.MuiButtonBase-root:hover': {
                  background: lightColors.primary.main,
                },
                '&.MuiButtonBase-root:hover': {
                  background: lightColors.alpha.black[5],
                },
              },
            },
          ],
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation: {
          boxShadow: lightColors.shadows.cardSm,
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation2: {
          boxShadow: lightColors.shadows.cardSm,
        },
        elevation24: {
          boxShadow: lightColors.shadows.cardLg,
        },
        outlined: ({ theme }) => ({
          border: '1px solid #E2E8F0',
          boxShadow: 'none',
          transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
          ...theme.applyStyles('dark', {
            border: '1px solid #1E2742',
          }),
        }),
        root: {
          backgroundImage: 'none',
          padding: 0,
          transition: 'box-shadow .2s cubic-bezier(0.4, 0, 0.2, 1), border-color .2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          top: 'calc(50% - 14px)',
        },
        root: {
          '& .MuiSelect-outlined ~ .MuiSelect-icon': {
            color: lightColors.alpha.black[50],
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-valueLabel': {
            background: lightColors.alpha.black[100],
            borderRadius: 6,
            color: lightColors.alpha.white[100],
          },
          '& .MuiSlider-valueLabelCircle, .MuiSlider-valueLabelLabel': {
            transform: 'none',
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.MuiStepIcon-completed': {
            color: lightColors.success.main,
          },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          background: lightColors.alpha.black[5],
          paddingBottom: 20,
          paddingTop: 20,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        colorPrimary: {
          '&.Mui-checked .MuiSwitch-thumb': {
            backgroundColor: lightColors.primary.main,
          },
          '& .MuiSwitch-thumb': {
            backgroundColor: lightColors.alpha.white[100],
          },
        },
        root: {
          '& .MuiButtonBase-root': {
            padding: 6,
            position: 'absolute',
            transition: 'left 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
          },
          '& .MuiIconButton-root': {
            borderRadius: 100,
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            opacity: 0.3,
          },
          height: 33,
          overflow: 'visible',
        },
        thumb: ({ theme }) => ({
          backgroundColor: lightColors.alpha.white[100],
          border: '1px solid ' + lightColors.alpha.black[30],
          boxShadow: '0px 9px 14px ' + lightColors.alpha.black[10] + ', 0px 2px 2px ' + lightColors.alpha.black[10],
          ...theme.applyStyles('dark', {
            backgroundColor: undefined,
            border: '1px solid ' + darkColors.alpha.black[30],
            boxShadow: '0px 9px 14px ' + darkColors.alpha.black[10] + ', 0px 2px 2px ' + darkColors.alpha.black[10],
          }),
        }),
        track: {
          backgroundColor: lightColors.alpha.black[5],
          border: '1px solid ' + lightColors.alpha.black[10],
          boxShadow: 'inset 0px 1px 1px ' + lightColors.alpha.black[10],
          opacity: 1,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected, &.Mui-selected:hover': {
            color: 'var(--tab-selected-color)',
            zIndex: 5,
          },
          '&.MuiButtonBase-root': {
            marginRight: 4,
            minWidth: 'auto',
            paddingLeft: 20,
            paddingRight: 20,
          },
          '&:hover': {
            color: 'var(--tab-hover-color)',
          },
          borderRadius: 6,
          color: 'var(--tab-color)',
          height: 38,
          minHeight: 38,
          padding: 0,
          textTransform: 'capitalize',
          transition: 'color .2s',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({
          color: lightColors.alpha.black[100],
          fontWeight: 'bold',
          ...theme.applyStyles('dark', {
            color: darkColors.alpha.black[70],
            fontSize: 13,
            textTransform: 'uppercase',
          }),
        }),
        root: {
          borderBottomColor: lightColors.alpha.black[10],
          fontSize: 14,
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        select: {
          '&:focus': {
            backgroundColor: 'transparent',
          },
        },
        toolbar: {
          '& .MuiIconButton-root': {
            padding: 8,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        head: {
          background: lightColors.alpha.black[5],
        },
        root: ({ theme }) => ({
          '&.MuiTableRow-hover:hover': {
            backgroundColor: lighten(lightColors.alpha.black[5], 0.5),
          },
          transition: 'background-color .2s',
          ...theme.applyStyles('dark', {
            '&.MuiTableRow-hover:hover': {
              backgroundColor: alpha(darkColors.alpha.black[5], 0.05),
            },
          }),
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: 'var(--tab-indicator-bg)',
          border: 'var(--tab-indicator-border)',
          borderRadius: 6,
          boxShadow: 'var(--tab-indicator-shadow)',
          height: 38,
          minHeight: 38,
        },
        root: {
          height: 38,
          minHeight: 38,
          overflow: 'visible',
        },
        scrollableX: {
          overflow: 'visible !important',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: lightColors.primary.main,
              borderWidth: 1,
            },
            borderRadius: 6,
            transition: 'border-color .2s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
      styleOverrides: {
        arrow: ({ theme }) => ({
          color: alpha(lightColors.alpha.black['100'], 0.92),
          ...theme.applyStyles('dark', {
            color: alpha(darkColors.alpha.black['100'], 0.92),
          }),
        }),
        tooltip: ({ theme }) => ({
          backdropFilter: 'blur(6px)',
          backgroundColor: alpha(lightColors.alpha.black['100'], 0.92),
          borderRadius: 8,
          fontSize: 13,
          padding: '8px 16px',
          ...theme.applyStyles('dark', {
            backgroundColor: alpha(darkColors.alpha.black['100'], 0.92),
          }),
        }),
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          body1: 'div',
          body2: 'div',
          h1: 'h1',
          h2: 'h2',
          h3: 'div',
          h4: 'div',
          h5: 'div',
          h6: 'div',
          subtitle1: 'div',
          subtitle2: 'div',
        },
      },
      styleOverrides: {
        gutterBottom: {
          marginBottom: 4,
        },
      },
    },
  },
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  general: {
    borderRadius: '6px',
    borderRadiusLg: '10px',
    borderRadiusSm: '4px',
    borderRadiusXl: '18px',
    reactFrameworkColor: '#00D8FF',
  },
  header: {
    background: 'var(--header-background)',
    boxShadow: 'var(--header-box-shadow)',
    height: '64px',
    textColor: 'var(--header-text-color)',
  },
  shadows: [...lightShadows],
  shape: {
    borderRadius: 6,
  },
  sidebar: {
    background: 'var(--sidebar-background)',
    boxShadow: 'var(--sidebar-box-shadow)',
    dividerBg: 'var(--sidebar-divider-bg)',
    menuItemBg: 'transparent',
    menuItemBgActive: 'var(--sidebar-menu-item-bg-active)',
    menuItemColor: 'var(--sidebar-menu-item-color)',
    menuItemColorActive: 'var(--sidebar-menu-item-color-active)',
    menuItemHeadingColor: 'var(--sidebar-menu-item-heading-color)',
    menuItemIconColor: 'var(--sidebar-menu-item-icon-color)',
    menuItemIconColorActive: 'var(--sidebar-menu-item-icon-color-active)',
    textColor: 'var(--sidebar-text-color)',
    width: '260px',
  },
  spacing: 8,
  typography: {
    body1: {
      fontSize: 14,
    },
    body2: {
      fontSize: 14,
    },
    button: {
      fontSize: 14,
      fontWeight: 700,
    },
    caption: {
      color: 'var(--typography-caption-color)',
      fontSize: 12,
      letterSpacing: '0.02em',
    },
    fontFamily:
      '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    fontSize: 14,
    h1: {
      fontFamily:
        '"Plus Jakarta Sans", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontFamily:
        '"Plus Jakarta Sans", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      color: 'var(--typography-h3-color)',
      fontFamily:
        '"Plus Jakarta Sans", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h4: {
      fontFamily:
        '"Plus Jakarta Sans", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      fontSize: 16,
      fontWeight: 600,
    },
    h5: {
      fontFamily:
        '"Plus Jakarta Sans", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      fontSize: 14,
      fontWeight: 700,
    },
    h6: {
      fontFamily:
        '"Plus Jakarta Sans", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      fontSize: 15,
      fontWeight: 600,
    },
    htmlFontSize: 15,
    overline: {
      fontSize: 13,
      fontWeight: 700,
      textTransform: 'uppercase',
    },
    subtitle1: {
      color: 'var(--typography-subtitle-color)',
      fontSize: 14,
    },
    subtitle2: {
      color: 'var(--typography-subtitle-color)',
      fontSize: 15,
      fontWeight: 400,
    },
  },
});

/** Custom tokens — used by consumers that read `theme.colors`, `theme.sidebar`, etc. */
export { darkColors, lightColors };
