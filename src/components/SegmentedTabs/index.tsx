import { Tab, Tabs } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

/**
 * SegmentedTabs provides a more intentional, contained tab surface for page-level navigation.
 */
export const SegmentedTabs: typeof Tabs = styled(Tabs)(({ theme }) => ({
  '.MuiTabs-flexContainer': {
    alignItems: 'stretch',
    gap: theme.spacing(0.125),
    minHeight: 0,
    width: 'max-content',
  },
  '.MuiTabs-indicator': {
    display: 'none',
  },
  '.MuiTabs-list': {
    alignItems: 'stretch',
    gap: theme.spacing(0.125),
    minHeight: 0,
    padding: 0,
    width: 'max-content',
  },
  '.MuiTabs-scrollableX': {
    overflowX: 'auto !important',
  },
  '.MuiTabs-scrollButtons': {
    display: 'none',
  },
  '.MuiTabs-scroller': {
    boxSizing: 'border-box',
    minHeight: 40,
    overflowX: 'auto !important',
    overflowY: 'visible !important',
    scrollbarWidth: 'none',
  },
  '.MuiTabs-scroller::-webkit-scrollbar': {
    display: 'none',
  },
  background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
  border: '1px solid #E2E8F0',
  borderRadius: Number.parseInt(theme.general.borderRadiusLg, 10),
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
  boxSizing: 'border-box',
  height: 'auto',
  maxWidth: '100%',
  minHeight: 54,
  overflow: 'visible',
  padding: theme.spacing(0.75),
  ...theme.applyStyles('dark', {
    background: 'linear-gradient(180deg, #151B2B 0%, #131825 100%)',
    border: '1px solid #1E2742',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  }),
})) as typeof Tabs;

/**
 * SegmentedTabsCompact provides a denser segmented tab surface for tool-level mode switches.
 */
export const SegmentedTabsCompact: typeof Tabs = styled(Tabs)(({ theme }) => ({
  '.MuiTabs-flexContainer': {
    alignItems: 'stretch',
    gap: theme.spacing(1.5),
    minHeight: 0,
    width: 'max-content',
  },
  '.MuiTabs-indicator': {
    display: 'none',
  },
  '.MuiTabs-list': {
    alignItems: 'stretch',
    gap: theme.spacing(1.5),
    minHeight: 0,
    padding: 0,
    width: 'max-content',
  },
  '.MuiTabs-scrollableX': {
    overflowX: 'auto !important',
  },
  '.MuiTabs-scrollButtons': {
    display: 'none',
  },
  '.MuiTabs-scroller': {
    boxSizing: 'border-box',
    minHeight: 36,
    overflowX: 'auto !important',
    overflowY: 'visible !important',
    scrollbarWidth: 'none',
  },
  '.MuiTabs-scroller::-webkit-scrollbar': {
    display: 'none',
  },
  background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
  border: '1px solid #E2E8F0',
  borderRadius: Number.parseInt(theme.general.borderRadiusLg, 10),
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
  boxSizing: 'border-box',
  height: 'auto',
  maxWidth: '100%',
  minHeight: 46,
  overflow: 'visible',
  padding: theme.spacing(0.5),
  ...theme.applyStyles('dark', {
    background: 'linear-gradient(180deg, #151B2B 0%, #131825 100%)',
    border: '1px solid #1E2742',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  }),
})) as typeof Tabs;

/**
 * SegmentedTab styles individual tabs to feel like contained controls rather than default MUI tabs.
 */
export const SegmentedTab: typeof Tab = styled(Tab)(({ theme }) => ({
  '&.Mui-selected': {
    background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
    boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}, 0 6px 14px ${alpha('#0F172A', 0.08)}`,
    color: '#1849A9',
    ...theme.applyStyles('dark', {
      background: `linear-gradient(180deg, ${alpha('#60A5FA', 0.24)} 0%, ${alpha('#60A5FA', 0.18)} 100%)`,
      boxShadow: `inset 0 0 0 1px ${alpha('#60A5FA', 0.22)}, 0 8px 18px ${alpha('#020617', 0.3)}`,
      color: '#D6E4FF',
    }),
  },
  '&.Mui-selected:hover': {
    color: '#1849A9',
    ...theme.applyStyles('dark', {
      color: '#D6E4FF',
    }),
  },
  '&.MuiButtonBase-root': {
    marginRight: 0,
    minWidth: 'max-content',
    paddingLeft: theme.spacing(1.125),
    paddingRight: theme.spacing(1.125),
  },
  '&:hover': {
    color: theme.palette.text.primary,
    ...theme.applyStyles('dark', {
      color: theme.palette.common.white,
    }),
  },
  alignItems: 'center',
  alignSelf: 'stretch',
  borderRadius: theme.shape.borderRadius,
  boxSizing: 'border-box',
  color: theme.palette.text.secondary,
  display: 'inline-flex',
  flexShrink: 0,
  fontSize: theme.typography.pxToRem(13),
  fontWeight: 700,
  height: 40,
  justifyContent: 'center',
  lineHeight: 1.2,
  minHeight: 40,
  minWidth: 'max-content',
  padding: theme.spacing(1.25, 1.125),
  textTransform: 'none',
  transition: theme.transitions.create(['background-color', 'box-shadow', 'color', 'transform'], { duration: 180 }),
  whiteSpace: 'nowrap',
  ...theme.applyStyles('dark', {
    color: alpha('#CBD5E1', 0.7),
  }),
})) as typeof Tab;

/**
 * SegmentedTabCompact provides a denser segmented tab pill for tool-level tabs.
 */
export const SegmentedTabCompact: typeof Tab = styled(Tab)(({ theme }) => ({
  '&.Mui-selected': {
    background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
    boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.18)}, 0 6px 14px ${alpha('#0F172A', 0.08)}`,
    color: '#1849A9',
    ...theme.applyStyles('dark', {
      background: `linear-gradient(180deg, ${alpha('#60A5FA', 0.24)} 0%, ${alpha('#60A5FA', 0.18)} 100%)`,
      boxShadow: `inset 0 0 0 1px ${alpha('#60A5FA', 0.22)}, 0 8px 18px ${alpha('#020617', 0.3)}`,
      color: '#D6E4FF',
    }),
  },
  '&.Mui-selected:hover': {
    color: '#1849A9',
    ...theme.applyStyles('dark', {
      color: '#D6E4FF',
    }),
  },
  '&.MuiButtonBase-root': {
    marginRight: 0,
    minWidth: 'max-content',
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  '&:hover': {
    color: theme.palette.text.primary,
    ...theme.applyStyles('dark', {
      color: theme.palette.common.white,
    }),
  },
  alignItems: 'center',
  alignSelf: 'stretch',
  borderRadius: theme.shape.borderRadius,
  boxSizing: 'border-box',
  color: theme.palette.text.secondary,
  display: 'inline-flex',
  flexShrink: 0,
  fontSize: theme.typography.pxToRem(12),
  fontWeight: 700,
  height: 36,
  justifyContent: 'center',
  lineHeight: 1.2,
  minHeight: 36,
  minWidth: 'max-content',
  padding: theme.spacing(1, 1),
  textTransform: 'none',
  transition: theme.transitions.create(['background-color', 'box-shadow', 'color', 'transform'], { duration: 180 }),
  whiteSpace: 'nowrap',
  ...theme.applyStyles('dark', {
    color: alpha('#CBD5E1', 0.7),
  }),
})) as typeof Tab;
