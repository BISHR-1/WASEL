import React, { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {}
});

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};
/** @param {{ children: React.ReactNode }} props */
export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('wasel_dark_mode') : null;
    return saved === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    window.localStorage.setItem('wasel_dark_mode', String(isDarkMode));
    
    // تطبيق Dark mode على body
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};
