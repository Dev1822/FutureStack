import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const item = window.localStorage.getItem('futurestack-theme');
      if (item) {
        return item === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      console.warn('Error reading theme from localStorage', error);
      return true; // Default to dark since the app was originally dark
    }
  });

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        window.localStorage.setItem('futurestack-theme', 'dark');
      } else {
        root.classList.remove('dark');
        window.localStorage.setItem('futurestack-theme', 'light');
      }
    } catch (error) {
      console.warn('Error saving theme to localStorage', error);
    }
  }, [isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only change if user hasn't explicitly set a preference in localStorage
      if (!window.localStorage.getItem('futurestack-theme')) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
