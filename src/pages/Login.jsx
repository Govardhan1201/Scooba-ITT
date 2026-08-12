import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Layers, LogIn } from 'lucide-react';

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
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--primary)] opacity-10 blur-[100px]"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--secondary)] opacity-10 blur-[100px]"></div>

      <div className="glass-panel max-w-md w-full p-8 rounded-2xl relative z-10 border-t border-[var(--border-accent)]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--surface-3)] mb-4 border border-[var(--primary-light)] text-[var(--primary)] shadow-[0_0_20px_rgba(22,160,133,0.3)]">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white mb-2">PS-08 System</h1>
          <p className="text-[var(--text-secondary)]">Intelligent Faculty Workload Balancing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
          {state.authError && <div className="text-red-400 text-sm mt-2">{state.authError}</div>}

          <button type="submit" className="btn btn-primary w-full mt-6 py-3">
            <LogIn className="w-5 h-5" />
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] text-center mb-4 uppercase tracking-wider font-bold">Demo Logins</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setDemo('HOD')} className="btn btn-secondary text-xs py-2 px-1">HOD</button>
            <button onClick={() => setDemo('ASST')} className="btn btn-secondary text-xs py-2 px-1">Asst HOD</button>
            <button onClick={() => setDemo('FACULTY')} className="btn btn-secondary text-xs py-2 px-1">Faculty</button>
          </div>
        </div>
      </div>
    </div>
  );
}
