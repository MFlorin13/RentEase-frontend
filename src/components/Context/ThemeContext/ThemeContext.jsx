import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize with null to prevent hydration mismatch
  const [isDark, setIsDark] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme only on client side
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // First, check localStorage
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme) {
          const isDarkMode = savedTheme === 'dark';
          setIsDark(isDarkMode);
        } else {
          // Fallback to system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDark(prefersDark);
          // Save the system preference to localStorage
          localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('❌ Error initializing theme:', error);
        // Fallback to light mode
        setIsDark(false);
        localStorage.setItem('theme', 'light');
      } finally {
        setIsInitialized(true);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      initializeTheme();
    }
  }, []);

  // Apply theme whenever isDark changes
  useEffect(() => {
    if (!isInitialized || isDark === null) return;

    const theme = isDark ? 'dark' : 'light';
    
    
    try {
      // Save to localStorage
      localStorage.setItem('theme', theme);
      
      // Set data-theme attribute on HTML element
      document.documentElement.setAttribute('data-theme', theme);
      
      // Also set on body as backup
      document.body.setAttribute('data-theme', theme);
      
      // Add theme class to body (remove previous theme class first)
      document.body.className = document.body.className
        .replace(/\b(light|dark)-theme\b/g, '')
        .trim();
      document.body.className += ` ${theme}-theme`;
      
      // Force CSS variables as absolute fallback
      const root = document.documentElement;
      if (isDark) {
        root.style.setProperty('--color-bg-primary', '#0a0a0a');
        root.style.setProperty('--color-bg-secondary', '#151b24');
        root.style.setProperty('--color-text-primary', '#f1f5f9');
        root.style.setProperty('--color-text-secondary', '#cbd5e1');
        root.style.setProperty('--color-border', '#334155');
      } else {
        root.style.setProperty('--color-bg-primary', '#ffffff');
        root.style.setProperty('--color-bg-secondary', '#f8fafc');
        root.style.setProperty('--color-text-primary', '#1f2937');
        root.style.setProperty('--color-text-secondary', '#6b7280');
        root.style.setProperty('--color-border', '#e5e7eb');
      }
      
    } catch (error) {
      console.error('❌ Error applying theme:', error);
    }
  }, [isDark, isInitialized]);

  const toggleTheme = () => {
    if (!isInitialized) return;
    
    const newTheme = !isDark;
    setIsDark(newTheme);
  };

  const value = {
    isDark: isDark || false, // Prevent null from being exposed
    theme: isDark ? 'dark' : 'light',
    toggleTheme,
    isInitialized
  };

  // Show loading state until theme is initialized
  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--color-bg-primary, #ffffff)',
        color: 'var(--color-text-primary, #1f2937)'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};