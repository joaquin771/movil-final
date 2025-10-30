// src/theme/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIGHT_THEME = {
  mode: "light",
  primary: "#FFD600",
  secondary: "#FFA500",
  background: "#F5F5F5",
  card: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#666666",
  border: "#E0E0E0",
  success: "#4CAF50",
  error: "#FF5252",
  gradient: ["#FFD600", "#FFA500"],
  headerOverlay: "rgba(0,0,0,0.3)",
  modalOverlay: "rgba(0,0,0,0.4)",
};

const DARK_THEME = {
  mode: "dark",
  primary: "#FFD600",
  secondary: "#FFA500",
  background: "#0D0D0D",
  card: "#252525",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  border: "#333333",
  success: "#4CAF50",
  error: "#FF5252",
  gradient: ["#FFD600", "#FFA500"],
  headerOverlay: "rgba(0,0,0,0.65)",
  modalOverlay: "rgba(0,0,0,0.7)",
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // cargar preferencia inicial
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_mode');
        if (savedTheme === 'dark') {
          setIsDarkMode(true);
        } else if (savedTheme === 'light') {
          setIsDarkMode(false);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    })();
  }, []);

  // alternar tema
  const toggleTheme = async (wantDark) => {
    try {
      setIsDarkMode(wantDark);
      await AsyncStorage.setItem('theme_mode', wantDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  // 👇 este objeto es para NavigationContainer
  const navigationTheme = useMemo(
    () => ({
      dark: isDarkMode,
      colors: {
        background: theme.background,
        card: theme.card,
        text: theme.text,
        border: theme.border,
        primary: theme.primary,
        notification: theme.secondary,
      },
    }),
    [isDarkMode, theme]
  );

  const value = useMemo(
    () => ({
      theme,
      isDarkMode,
      toggleTheme,
      navigationTheme,
    }),
    [theme, isDarkMode, navigationTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
