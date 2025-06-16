// components/ThemeToggle/ThemeToggle.jsx
import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../Context/ThemeContext/ThemeContext';
import styles from './ThemeToggle.module.css';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={styles.themeToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className={styles.iconContainer}>
        {isDark ? (
          <FaSun className={styles.icon} />
        ) : (
          <FaMoon className={styles.icon} />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;