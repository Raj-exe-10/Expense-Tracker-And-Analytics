import { createTheme, ThemeOptions } from '@mui/material/styles';

const MIN_TOUCH = 44;

export const ledgerCoreColors = {
  bg: '#121212',
  surface: '#1E1E1E',
  surfaceElevated: '#2A2A2A',
  border: '#333333',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  positive: '#4CAF50',
  negative: '#F44336',
  accent: '#E8DCC8',
  authBg: '#F5F5F5',
  authPaper: '#FFFFFF',
  authText: '#111111',
  authAccent: '#2D5A27',
  adminBg: '#F5F5F5',
  adminPaper: '#FFFFFF',
  adminSidebar: '#EEEEEE',
  adminText: '#111111',
  adminMuted: '#666666',
  adminNavActive: '#E8DCC8',
};

const baseComponents: ThemeOptions['components'] = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        minHeight: MIN_TOUCH,
        textTransform: 'none',
        fontWeight: 600,
        boxShadow: 'none',
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        backgroundImage: 'none',
      },
    },
  },
};

export const ledgerCoreDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#FFFFFF', contrastText: '#121212' },
    secondary: { main: ledgerCoreColors.accent },
    success: { main: ledgerCoreColors.positive },
    error: { main: ledgerCoreColors.negative },
    background: {
      default: ledgerCoreColors.bg,
      paper: ledgerCoreColors.surface,
    },
    text: {
      primary: ledgerCoreColors.textPrimary,
      secondary: ledgerCoreColors.textSecondary,
    },
    divider: ledgerCoreColors.border,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: baseComponents,
});

export const ledgerCoreLightAuthTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#000000', contrastText: '#FFFFFF' },
    success: { main: ledgerCoreColors.authAccent },
    background: {
      default: ledgerCoreColors.authBg,
      paper: ledgerCoreColors.authPaper,
    },
    text: {
      primary: ledgerCoreColors.authText,
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: baseComponents,
});

export const ledgerCoreAdminLightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#000000', contrastText: '#FFFFFF' },
    secondary: { main: ledgerCoreColors.adminNavActive, contrastText: ledgerCoreColors.adminText },
    success: { main: ledgerCoreColors.positive },
    error: { main: ledgerCoreColors.negative },
    background: {
      default: ledgerCoreColors.adminBg,
      paper: ledgerCoreColors.adminPaper,
    },
    text: {
      primary: ledgerCoreColors.adminText,
      secondary: ledgerCoreColors.adminMuted,
    },
    divider: '#E0E0E0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    ...baseComponents,
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: ledgerCoreColors.adminSidebar },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: ledgerCoreColors.adminNavActive,
          },
        },
      },
    },
  },
});

/** @deprecated Use ledgerCoreDarkTheme */
export const theme = ledgerCoreDarkTheme;
