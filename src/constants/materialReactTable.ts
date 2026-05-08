import { alpha, darken, lighten } from '@mui/material';

import { darkColors, lightColors } from '../theme/unifiedTheme';

/** Material React Table dark theme colour overrides. */
export const MRT_DARK_THEME = {
  baseBackgroundColor: lighten(darkColors.layout.general.bodyBg, 0.05),
  matchHighlightColor: darken(darkColors.warning.dark, 0.25),
  menuBackgroundColor: lighten(darkColors.layout.general.bodyBg, 0.12),
  pinnedRowBackgroundColor: alpha(darkColors.primary.main, 0.1),
  selectedRowBackgroundColor: alpha(darkColors.primary.main, 0.2),
} as const;

/** Material React Table light theme colour overrides. */
export const MRT_LIGHT_THEME = {
  baseBackgroundColor: lightColors.layout.general.bodyBg,
  matchHighlightColor: lighten(lightColors.warning.light, 0.5),
  menuBackgroundColor: lighten(lightColors.layout.general.bodyBg, 0.07),
  pinnedRowBackgroundColor: alpha(lightColors.primary.main, 0.1),
  selectedRowBackgroundColor: alpha(lightColors.primary.main, 0.2),
} as const;
