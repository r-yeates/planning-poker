'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark'; // The actual theme being applied
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  const getSystemTheme = (): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (currentTheme: Theme) => {
    let actualTheme: 'light' | 'dark';
    
    if (currentTheme === 'system') {
      actualTheme = getSystemTheme();
    } else {
      actualTheme = currentTheme;
    }
    
    setResolvedTheme(actualTheme);
    document.documentElement.classList.toggle('dark', actualTheme === 'dark');
  };

  useEffect(() => {
    // Get theme from localStorage or default to system
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'system';
    setTheme(savedTheme);
    setMounted(true);
    
    // Apply initial theme
    applyTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const toggleTheme = () => {
    // Cycle through: light → dark → system
    let newTheme: Theme;
    if (theme === 'light') {
      newTheme = 'dark';
    } else if (theme === 'dark') {
      newTheme = 'system';
    } else {
      newTheme = 'light';
    }
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a default theme context instead of throwing an error
    return {
      theme: 'system' as Theme,
      resolvedTheme: 'light' as 'light' | 'dark',
      toggleTheme: () => {}
    };
  }
  return context;
}
