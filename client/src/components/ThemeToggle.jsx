import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

function ThemeToggle({ inline = false }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Initialize from localStorage or system preference
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const baseClasses = 'px-3 py-2 rounded-full shadow-md bg-white text-black dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700';
  const positionClasses = inline ? '' : 'fixed top-4 right-4 z-50';
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`${positionClasses} ${baseClasses}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}

export default ThemeToggle;
