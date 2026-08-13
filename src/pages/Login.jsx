import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useApp, ACTIONS } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, LogIn, KeyRound, ShieldCheck, Hash, Lock, Mail, Eye, EyeOff, AlertCircle, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

function generateOtp() { return Math.floor(100000 + Math.random() * 900000).toString(); }

export default function Login() {
  const { state, login, dispatch, showToast, users } = useApp();
  const [view, setView] = useState('LOGIN'); // LOGIN | FORGOT | RESET | CODE
  const [showPwd, setShowPwd] = useState(false);
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  // Access code state (Asst HOD)
  const [pendingUser, setPendingUser] = useState(null);
  const [accessCode, setAccessCode] = useState('');

  if (state.isAuthenticated) {
    if (state.currentUser?.role === 'HOD') return <Navigate to="/hod/dashboard" replace />;
    if (state.currentUser?.role === 'ASST_HOD') return <Navigate to="/asst-hod/dashboard" replace />;
    return <Navigate to="/faculty/dashboard" replace />;
  }

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const user = login(empId, password);
    if (!user) { setError('Invalid ID or password. Please try again.'); return; }
    // Asst HOD gate
    if (user.role === 'ASST_HOD' && !state.asstHodUnlocked && state.asstHodAccessCode) {
      dispatch({ type: 'LOGOUT' });
      setPendingUser(user);
      setView('CODE');
    }
    if (user.role === 'ASST_HOD' && !state.asstHodUnlocked && !state.asstHodAccessCode) {
      dispatch({ type: 'LOGOUT' });
      setError('Asst HOD portal is locked. Ask the HOD to generate an access code first.');
    }
  };

  const handleAccessCode = (e) => {
    e.preventDefault();
    if (accessCode.trim().toUpperCase() !== state.asstHodAccessCode?.toUpperCase()) {
      setError('Invalid access code. Contact your HOD.');
      return;
    }
    dispatch({ type: ACTIONS.UNLOCK_ASST_HOD });
    login(empId, password);
  };

  const handleForgotSend = (e) => {
    e.preventDefault();
    const allUsers = [...(users || []), ...state.registeredUsers];
    const found = allUsers.find(u => u.email === forgotEmail);
    if (!found) { setError('No account found with that email address.'); return; }
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setError('');
    setView('RESET');
  };

  const handleResetVerify = (e) => {
    e.preventDefault();
    if (enteredOtp !== generatedOtp) { setError('Incorrect verification code.'); return; }
    setError('');
    setView('NEWPWD');
  };

  const handleNewPassword = (e) => {
    e.preventDefault();
    if (newPwd.length < 8) { setError('Password must be at least 8 characters.'); return; }
    dispatch({ type: ACTIONS.RESET_PASSWORD, payload: { email: forgotEmail, password: newPwd } });
    showToast('Password reset successfully! Please log in.', 'success');
    setView('LOGIN');
    setForgotEmail(''); setEnteredOtp(''); setNewPwd('');
  };

  const demoLogin = (role) => {
    if (role === 'HOD') { setEmpId('hod@college.edu'); setPassword('hod123'); }
    if (role === 'ASST') { setEmpId('asst.hod@college.edu'); setPassword('asst123'); }
    if (role === 'FAC') { setEmpId('arjun.mehta@college.edu'); setPassword('fac123'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] p-4 relative overflow-hidden">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--primary)] opacity-[0.07] blur-[120px]" />
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--accent)] opacity-[0.05] blur-[100px]" />

      <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass-panel max-w-md w-full p-8 md:p-10 rounded-3xl relative z-10 border-t border-[var(--border-accent)] shadow-2xl"
      >
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-1)] mb-5 border border-[var(--primary)]/30 text-[var(--primary)] shadow-[0_0_30px_rgba(22,160,133,0.2)] rotate-3"
          >
            <Layers className="w-10 h-10 -rotate-3 drop-shadow-[0_0_10px_rgba(22,160,133,0.5)]" />
          </motion.div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">PS-08 System</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Vignan's Institute of Information Technology</p>
        </div>

        <AnimatePresence mode="wait">

          {/* LOGIN */}
          {view === 'LOGIN' && (
            <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">ID Number or Email</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input type="text" className="input-field pl-9 py-3" value={empId} onChange={e => { setEmpId(e.target.value); setError(''); }} required placeholder="VIIT2024001 or email" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input type={showPwd ? 'text' : 'password'} className="input-field pl-9 pr-10 py-3" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} required />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded-xl border border-red-900/50 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

                <div className="flex justify-end">
                  <button type="button" onClick={() => { setView('FORGOT'); setError(''); }} className="text-xs text-[var(--primary)] hover:underline">Forgot password?</button>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                  className="btn btn-primary w-full mt-2 py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 group"
                >
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> Sign In
                </motion.button>
              </form>

              <div className="mt-8 pt-6 border-t border-[var(--border)] relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--surface-3)] px-3 text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] rounded-full border border-[var(--border)]">
                  Demo Logins
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[['HOD','HOD'],['ASST','Asst HOD'],['FAC','Faculty']].map(([k,l]) => (
                    <button key={k} onClick={() => demoLogin(k)} className="btn btn-secondary text-xs py-2 hover:border-[var(--primary)]/50 rounded-lg">
                      <KeyRound className="w-3 h-3 mr-1 text-[var(--text-muted)]" /> {l}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
                New here? <Link to="/register" className="text-[var(--primary)] hover:underline font-bold">Create an account</Link>
              </p>
            </motion.div>
          )}

          {/* ACCESS CODE (Asst HOD) */}
          {view === 'CODE' && (
            <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 mb-4">
                  <ShieldCheck className="w-7 h-7 text-[var(--accent)]" />
                </div>
                <h2 className="font-heading font-bold text-white text-xl">Access Code Required</h2>
                <p className="text-[var(--text-secondary)] text-sm mt-2">Enter the access code provided by your HOD to unlock the Asst. HOD portal.</p>
              </div>
              <form onSubmit={handleAccessCode} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">Access Code</label>
                  <input type="text" className="input-field font-mono text-center text-xl tracking-[0.4em] py-3" placeholder="XXXX-XXXX" maxLength={9}
                    value={accessCode} onChange={e => { setAccessCode(e.target.value.toUpperCase()); setError(''); }} />
                </div>
                {error && <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded-xl border border-red-900/50 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
                <button type="submit" className="btn w-full py-3 rounded-xl font-bold bg-[var(--accent)] text-black flex items-center justify-center gap-2">
                  <KeyRound className="w-5 h-5" /> Unlock Portal
                </button>
                <button type="button" onClick={() => { setView('LOGIN'); setError(''); }} className="btn btn-secondary w-full py-2.5 rounded-xl flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </form>
            </motion.div>
          )}

          {/* FORGOT */}
          {view === 'FORGOT' && (
            <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <h2 className="font-heading font-bold text-white text-xl">Forgot Password</h2>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Enter your registered email to receive a verification code.</p>
              </div>
              <form onSubmit={handleForgotSend} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">Registered Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input type="email" className="input-field pl-9 py-3" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setError(''); }} required />
                  </div>
                </div>
                {error && <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded-xl border border-red-900/50 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
                <button type="submit" className="btn btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  Send Verification Code
                </button>
                <button type="button" onClick={() => { setView('LOGIN'); setError(''); }} className="btn btn-secondary w-full py-2.5 rounded-xl flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </form>
            </motion.div>
          )}

          {/* OTP VERIFY */}
          {view === 'RESET' && (
            <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <ShieldCheck className="w-10 h-10 text-[var(--primary)] mx-auto mb-3" />
                <h2 className="font-heading font-bold text-white text-xl">Enter Verification Code</h2>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Code sent to <span className="text-white font-bold">{forgotEmail}</span></p>
              </div>
              <div className="bg-[var(--surface-2)] border border-[var(--primary)]/20 rounded-xl p-4 text-center mb-4">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Demo — Your code</p>
                <p className="text-3xl font-mono font-bold text-[var(--primary)] tracking-[0.3em]">{generatedOtp}</p>
                <button onClick={() => setGeneratedOtp(generateOtp())} className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] mt-2 flex items-center gap-1 mx-auto"><RefreshCw className="w-3 h-3" /> Resend</button>
              </div>
              <form onSubmit={handleResetVerify} className="space-y-4">
                <input type="text" className="input-field font-mono text-center text-2xl tracking-[0.5em]" maxLength={6} value={enteredOtp}
                  onChange={e => { setEnteredOtp(e.target.value.replace(/\D/g,'')); setError(''); }} placeholder="000000" />
                {error && <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded-xl border border-red-900/50 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
                <button type="submit" className="btn btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> Verify Code</button>
              </form>
            </motion.div>
          )}

          {/* NEW PASSWORD */}
          {view === 'NEWPWD' && (
            <motion.div key="newpwd" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <CheckCircle className="w-10 h-10 text-[var(--primary)] mx-auto mb-3" />
                <h2 className="font-heading font-bold text-white text-xl">Set New Password</h2>
              </div>
              <form onSubmit={handleNewPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input type={showNewPwd ? 'text' : 'password'} className="input-field pl-9 pr-10 py-3" value={newPwd} onChange={e => { setNewPwd(e.target.value); setError(''); }} required minLength={8} />
                    <button type="button" onClick={() => setShowNewPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white">
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded-xl border border-red-900/50 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
                <button type="submit" className="btn btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> Reset Password</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
