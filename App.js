// App.js
import React from 'react';
import { ThemeProvider } from './src/theme/ThemeContext';
import Navigation from './navigation/Navigation';

export default function App() {
  return (
    <ThemeProvider>
      <Navigation />
    </ThemeProvider>
  );
}
