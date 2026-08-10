import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'dropdown' | 'buttons' | 'compact';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'compact' }) => {
  const { themeMode, setThemeMode, effectiveTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { mode: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
    { mode: 'system', label: 'System', icon: <Monitor className="w-3.5 h-3.5" /> }
  ];

  if (variant === 'buttons') {
    return (
      <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-xs font-bold">
        {options.map(opt => (
          <button
            key={opt.mode}
            type="button"
            onClick={() => setThemeMode(opt.mode)}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              themeMode === opt.mode
                ? 'bg-[var(--gold-primary)] text-[#0B1220] font-extrabold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Compact dropdown or button
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 shadow-sm"
        title="Ganti Mode Tampilan (Theme)"
      >
        {effectiveTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-[#F6D365]" />
        ) : (
          <Sun className="w-4 h-4 text-[#B89220]" />
        )}
        <span className="hidden sm:inline capitalize font-semibold">{themeMode}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl p-1.5 z-50 animate-fade-in space-y-0.5">
          {options.map(opt => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => {
                setThemeMode(opt.mode);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                themeMode === opt.mode
                  ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] font-bold border border-[var(--gold-badge-border)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
