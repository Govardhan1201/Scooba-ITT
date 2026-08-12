import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { Bell, Search, Sparkles } from 'lucide-react';

export default function Header() {
  const { state, unreadCount } = useApp();

  return (
    <header className="h-16 bg-[var(--surface-1)] border-b border-[var(--border)] flex items-center justify-between px-6 z-10 shadow-sm shrink-0">
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2">
          <h2 className="text-lg font-heading font-bold text-[var(--text-primary)] flex items-center gap-2">
            {state.settings.institutionName}
            <span className="text-[10px] bg-[var(--primary)] text-black px-2 py-0.5 rounded-full font-bold">v2.0</span>
          </h2>
          <span className="px-3 py-1 text-xs rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 font-medium tracking-wide flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {state.currentSemester?.name} ({state.currentSemester?.status})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden lg:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Quick search faculty, subjects..." 
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-full py-1.5 pl-9 pr-4 text-sm w-64 focus:outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/50 transition-all text-[var(--text-primary)]"
          />
        </div>

        <button className="relative text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors p-2 rounded-full hover:bg-[var(--surface-2)]">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[var(--surface-1)] shadow-md"
            >
              {unreadCount}
            </motion.span>
          )}
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-[var(--border)]">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-[var(--text-primary)]">{state.currentUser?.name}</div>
            <div className="text-xs text-[var(--primary-light)] font-medium">{state.currentUser?.role}</div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-black flex items-center justify-center font-bold text-lg shadow-md border-2 border-[var(--surface-1)] cursor-pointer"
          >
            {state.currentUser?.name.charAt(0)}
          </motion.div>
        </div>
      </div>
    </header>
  );
}
