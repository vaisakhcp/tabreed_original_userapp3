// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0D47A1',
    },
    secondary: {
      main: '#FF6F00',
    },
    error: {
      main: '#D32F2F',
    },
    background: {
      default: '#121212',
      paper: '#1D1D1D',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0BEC5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
