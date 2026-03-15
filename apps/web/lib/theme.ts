import { createTheme } from '@mui/material/styles';

/**
 * IMPEasy MUI theme — aligns with existing brand colors from globals.css
 */
export const impeasyTheme = createTheme({
  palette: {
    primary: {
      main: '#2f6db3',
      dark: '#1f4f84',
      light: '#78a8e3',
    },
    secondary: {
      main: '#304158',
      dark: '#1d2a3d',
    },
    success: {
      main: '#2f7d54',
      light: '#d9ede0',
    },
    warning: {
      main: '#b87216',
      light: '#f7ead3',
    },
    error: {
      main: '#a24343',
      light: '#f6dddd',
    },
    info: {
      main: '#466a99',
      light: '#dde6f3',
    },
    text: {
      primary: '#152033',
      secondary: '#26334a',
      disabled: '#7a869e',
    },
    background: {
      default: '#eff3f8',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
