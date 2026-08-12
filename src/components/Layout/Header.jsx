import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, User } from 'lucide-react';

export default function Header() {
  const { state, unreadCount } = useApp();

  return (
    <header className="header">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-heading text-[var(--text-primary)]">
          {state.settings.institutionName}
        </h2>
        <span className="px-2 py-1 text-xs rounded-full bg-[var(--surface-3)] text-[var(--text-secondary)] border border-[var(--border)]">
          {state.currentSemester?.name} ({state.currentSemester?.status})
        </span>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[var(--border)]">
          <div className="text-right">
            <div className="text-sm font-bold text-[var(--text-primary)]">{state.currentUser?.name}</div>
            <div className="text-xs text-[var(--text-muted)]">{state.currentUser?.role}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--bg-main)] flex items-center justify-center font-bold text-lg">
            {state.currentUser?.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
