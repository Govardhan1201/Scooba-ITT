import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, User, Hash, Mail, Lock, ShieldCheck, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

// ── Validation helpers ────────────────────────────────────────────
const BAD_WORDS = ['spam','hack','root','null','undefined','test123'];
const hasBadWords = (s) => BAD_WORDS.some(w => s.toLowerCase().includes(w));
const nameRe = /^[A-Za-z .'-]{2,60}$/;
const emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const idRe = /^[A-Z0-9\-]{4,20}$/i;
const pwdStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

function StrengthBar({ score }) {
  const colors = ['bg-red-500','bg-orange-400','bg-yellow-400','bg-green-400'];
  const textColors = ['text-red-400','text-orange-400','text-yellow-400','text-green-400'];
  const labels = ['Weak','Fair','Good','Strong'];
  return score > 0 ? (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={cn('h-1.5 w-8 rounded-full transition-colors', i < score ? colors[score-1] : 'bg-[var(--surface-3)]')} />
        ))}
      </div>
      <span className={cn('text-xs font-bold', textColors[score-1])}>{labels[score-1]}</span>
    </div>
  ) : null;
}

function Field({ label, error, hint, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      {hint && !error && <p className="text-[var(--text-muted)] text-xs">{hint}</p>}
    </div>
  );
}

function generateOtp() { return Math.floor(100000 + Math.random() * 900000).toString(); }

const ROLES = [
  { id: 'FACULTY', label: 'Faculty', desc: 'Teaching staff member' },
  { id: 'ASST_HOD', label: 'Assistant HOD', desc: 'Requires HOD access code' },
];

export default function Register() {
  const { register, showToast } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpEntered, setOtpEntered] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '', empId: '', email: '', password: '', confirmPassword: '',
    role: 'FACULTY', designation: 'Assistant Professor',
  });

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => ({ ...err, [field]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!nameRe.test(form.name)) e.name = 'Full name must be 2–60 letters, spaces or hyphens only.';
    if (hasBadWords(form.name)) e.name = 'Name contains unauthorized keywords.';
    if (!idRe.test(form.empId)) e.empId = 'ID must be 4–20 alphanumeric characters (no spaces).';
    if (!emailRe.test(form.email)) e.email = 'Enter a valid institutional email address.';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    else if (pwdStrength(form.password) < 2) e.password = 'Too weak — add uppercase letters, numbers, or symbols.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const sendOtp = () => {
    if (!validateStep1()) return;
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setStep(2);
  };

  const handleRegister = () => {
    if (otpEntered.trim() !== generatedOtp) {
      setErrors({ otp: 'Incorrect verification code. Please try again.' });
      return;
    }
    const result = register({
      name: form.name, empId: form.empId.toUpperCase(),
      email: form.email, password: form.password,
      role: form.role, designation: form.designation,
    });
    if (result?.error) { setErrors({ otp: result.error }); return; }
    showToast('Account created! Please log in.', 'success');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] p-4 relative overflow-hidden">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--primary)] opacity-[0.07] blur-[120px]" />
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--accent)] opacity-[0.05] blur-[100px]" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel max-w-lg w-full p-8 md:p-10 rounded-3xl relative z-10 border-t border-[var(--border-accent)] shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-1)] mb-4 border border-[var(--primary)]/30 text-[var(--primary)] rotate-3">
            <Layers className="w-7 h-7 -rotate-3" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white">Create Account</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Vignan's Institute of Information Technology</p>
        </div>

        <div className="flex gap-2 mb-6">
          {[1,2].map(s => (
            <div key={s} className={cn('flex-1 h-1.5 rounded-full transition-colors duration-500', s <= step ? 'bg-[var(--primary)]' : 'bg-[var(--surface-3)]')} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(r => (
                  <button key={r.id} type="button" onClick={() => setForm(f => ({ ...f, role: r.id }))}
                    className={cn('p-3 rounded-xl border text-left transition-all', form.role === r.id ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)]/40')}
                  >
                    <p className="font-bold text-white text-sm">{r.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>

              <Field label="Full Name" error={errors.name} hint="Letters, spaces, periods and hyphens only">
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input type="text" className="input-field pl-9" value={form.name} onChange={set('name')} placeholder="e.g. Dr. Arjun Mehta" maxLength={60} />
                </div>
              </Field>

              <Field label="Employee / Student ID" error={errors.empId} hint="Your official institution ID (4–20 chars, letters/digits)">
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input type="text" className="input-field pl-9 uppercase" value={form.empId} onChange={set('empId')} placeholder="VIIT2024001" maxLength={20} />
                </div>
              </Field>

              <Field label="Institutional Email" error={errors.email}>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input type="email" className="input-field pl-9" value={form.email} onChange={set('email')} placeholder="you@viit.ac.in" />
                </div>
              </Field>

              {form.role === 'FACULTY' && (
                <Field label="Designation">
                  <select className="input-field" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}>
                    <option>Professor</option>
                    <option>Associate Professor</option>
                    <option>Assistant Professor</option>
                  </select>
                </Field>
              )}

              <Field label="Password" error={errors.password} hint="Min 8 chars with uppercase, number and special char">
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input type={showPwd ? 'text' : 'password'} className="input-field pl-9 pr-10" value={form.password} onChange={set('password')} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <StrengthBar score={pwdStrength(form.password)} />
              </Field>

              <Field label="Confirm Password" error={errors.confirmPassword}>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input type={showConfirm ? 'text' : 'password'} className="input-field pl-9 pr-10" value={form.confirmPassword} onChange={set('confirmPassword')} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <button onClick={sendOtp} className="btn btn-primary w-full py-3 mt-2 rounded-xl font-bold flex items-center justify-center gap-2 group">
                Next — Verify Email <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-center text-sm text-[var(--text-secondary)]">
                Already registered? <Link to="/login" className="text-[var(--primary)] hover:underline font-bold">Sign In</Link>
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 mb-4">
                  <ShieldCheck className="w-7 h-7 text-[var(--primary)]" />
                </div>
                <h2 className="font-heading font-bold text-white text-xl">Verify your Email</h2>
                <p className="text-[var(--text-secondary)] text-sm mt-2">A 6-digit code has been sent to <span className="text-white font-bold">{form.email}</span></p>
              </div>

              <div className="bg-[var(--surface-2)] border border-[var(--primary)]/20 rounded-xl p-4 text-center">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Demo — Your verification code</p>
                <p className="text-3xl font-mono font-bold text-[var(--primary)] tracking-[0.3em]">{generatedOtp}</p>
                <button onClick={() => setGeneratedOtp(generateOtp())} className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] mt-3 flex items-center gap-1 mx-auto transition-colors">
                  <RefreshCw className="w-3 h-3" /> Resend code
                </button>
              </div>

              <Field label="Enter 6-digit Verification Code" error={errors.otp}>
                <input type="text" className="input-field font-mono text-center text-2xl tracking-[0.5em]"
                  maxLength={6} value={otpEntered}
                  onChange={e => { setOtpEntered(e.target.value.replace(/\D/g, '')); setErrors({}); }}
                  placeholder="000000" />
              </Field>

              <button onClick={handleRegister} className="btn btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" /> Complete Registration
              </button>
              <button onClick={() => setStep(1)} className="btn btn-secondary w-full py-2.5 rounded-xl flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
