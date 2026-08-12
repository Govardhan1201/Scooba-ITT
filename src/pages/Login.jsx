import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Layers, LogIn, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const { state, login } = useApp();
  const [email, setEmail] = useState('hod@college.edu');
  const [password, setPassword] = useState('hod123');
  const [error, setError] = useState('');

  if (state.isAuthenticated) {
    if (state.currentUser?.role === 'HOD') return <Navigate to="/hod/dashboard" replace />;
    if (state.currentUser?.role === 'ASST_HOD') return <Navigate to="/asst-hod/dashboard" replace />;
    return <Navigate to="/faculty/dashboard" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!login(email, password)) {
      setError('Invalid credentials');
    }
  };

  const setDemo = (role) => {
    if (role === 'HOD') { setEmail('hod@college.edu'); setPassword('hod123'); }
    if (role === 'ASST') { setEmail('asst.hod@college.edu'); setPassword('asst123'); }
    if (role === 'FACULTY') { setEmail('arjun.mehta@college.edu'); setPassword('fac123'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--primary)] opacity-[0.07] blur-[120px]"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--accent)] opacity-[0.05] blur-[100px]"
      />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="glass-panel max-w-md w-full p-8 md:p-10 rounded-3xl relative z-10 border-t border-[var(--border-accent)] shadow-2xl"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-1)] mb-6 border border-[var(--primary)]/30 text-[var(--primary)] shadow-[0_0_30px_rgba(22,160,133,0.2)] rotate-3"
          >
            <Layers className="w-10 h-10 -rotate-3 drop-shadow-[0_0_10px_rgba(22,160,133,0.5)]" />
          </motion.div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2 tracking-tight flex items-center justify-center gap-3">
            PS-08 System
            <span className="text-xs bg-[var(--primary)] text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-widest shadow-lg">v2.0</span>
          </h1>
          <p className="text-[var(--text-secondary)]">Intelligent Faculty Workload Balancing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field bg-[var(--surface-1)]/50 focus:bg-[var(--surface-2)] py-3 border-[var(--border)] focus:border-[var(--primary)]/50 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field bg-[var(--surface-1)]/50 focus:bg-[var(--surface-2)] py-3 border-[var(--border)] focus:border-[var(--primary)]/50 transition-colors"
              required
            />
          </div>

          <AnimatePresence>
            {(error || state.authError) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-sm mt-2 p-3 bg-red-950/30 rounded-xl border border-red-900/50 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {error || state.authError}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn btn-primary w-full mt-8 py-3.5 rounded-xl shadow-lg shadow-[var(--primary)]/20 text-base font-bold flex items-center justify-center gap-2 group"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Sign In to Workspace
          </motion.button>
        </form>

        <div className="mt-10 pt-8 border-t border-[var(--border)] relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--surface-3)] px-3 text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] rounded-full border border-[var(--border)]">
            Demo Logins
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setDemo('HOD')} className="btn btn-secondary text-xs py-2.5 px-2 hover:border-[var(--primary)]/50 rounded-lg group">
              <KeyRound className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--primary)] mr-1" /> HOD
            </button>
            <button onClick={() => setDemo('ASST')} className="btn btn-secondary text-xs py-2.5 px-2 hover:border-[var(--info)]/50 rounded-lg group">
              <KeyRound className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--info)] mr-1" /> Asst
            </button>
            <button onClick={() => setDemo('FACULTY')} className="btn btn-secondary text-xs py-2.5 px-2 hover:border-[var(--warning)]/50 rounded-lg group">
              <KeyRound className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--warning)] mr-1" /> Faculty
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AlertCircle(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
