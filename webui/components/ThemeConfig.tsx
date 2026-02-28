"use client"
import React, { useEffect, useMemo, useState, ReactNode } from 'react';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

interface ThemeConfigProps {
  children: ReactNode;
}

const ThemeConfig: React.FC<ThemeConfigProps> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>();

  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setMode(prefersDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', prefersDarkMode ? 'dark' : 'light');
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeConfig;
