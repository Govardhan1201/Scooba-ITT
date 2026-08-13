import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useApp, ACTIONS } from "../context/AppContext";
import { Layers, LogIn, KeyRound, ShieldCheck, User, ChevronDown, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

const ROLES = [
  { key: "HOD", label: "Head of Department", color: "var(--primary)", email: "hod@college.edu", password: "hod123" },
  { key: "ASST", label: "Assistant HOD", color: "var(--accent)", email: "asst.hod@college.edu", password: "asst123" },
  { key: "FACULTY", label: "Faculty", color: "var(--warning)", email: "arjun.mehta@college.edu", password: "fac123" },
];

export default function Login() {
  const { state, login, dispatch, showToast } = useApp();
  const [step, setStep] = useState("ROLE"); // ROLE → CREDENTIALS → ACCESS_CODE
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [error, setError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  if (state.isAuthenticated) {
    if (state.currentUser?.role === "HOD") return <Navigate to="/hod/dashboard" replace />;
    if (state.currentUser?.role === "ASST_HOD") return <Navigate to="/asst-hod/dashboard" replace />;
    return <Navigate to="/faculty/dashboard" replace />;
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setEmail(role.email);
    setPassword(role.password);
    setError("");
    setStep("CREDENTIALS");
  };

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    setError("");
    const user = login(email, password);
    if (!user && !state.isAuthenticated) {
      setError("Invalid email or password. Please try again.");
      return;
    }
    // After successful credential check, check for Asst HOD access code gate
    const role = state.users?.find?.(u => u.email === email)?.role
      ?? ROLES.find(r => r.email === email)?.key === "ASST" ? "ASST_HOD" : null;

    // If Asst HOD: need access code
    // We re-do this by peeking at the user that would be matched
    const matchedUser = (state.users ?? []).find?.(u => u.email === email && u.password === password);
    if (matchedUser?.role === "ASST_HOD") {
      // Logout them back, ask for access code
      // We need to check asstHodAccessCode
      if (!state.asstHodUnlocked && state.asstHodAccessCode) {
        // They need to enter the access code
        setLoggedInUser(matchedUser);
        dispatch({ type: ACTIONS.LOGOUT }); // undo the login
        setStep("ACCESS_CODE");
        return;
      }
      // If no access code is set yet, show a message
      if (!state.asstHodUnlocked && !state.asstHodAccessCode) {
        dispatch({ type: ACTIONS.LOGOUT });
        setError("Access code not set by HOD yet. Ask HOD to generate one from Settings.");
        return;
      }
    }
    // For Faculty: update their designation in the profile
    if (matchedUser?.role === "FACULTY" && matchedUser?.facultyId) {
      dispatch({ type: ACTIONS.UPDATE_FACULTY, payload: { id: matchedUser.facultyId, designation } });
    }
  };

  const handleAccessCodeSubmit = (e) => {
    e.preventDefault();
    if (accessCode.trim().toUpperCase() === state.asstHodAccessCode?.toUpperCase()) {
      dispatch({ type: ACTIONS.UNLOCK_ASST_HOD });
      // Now re-login
      login(email, password);
    } else {
      setError("Invalid access code. Contact your HOD.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] p-4 relative overflow-hidden">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--primary)] opacity-[0.07] blur-[120px]" />
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--accent)] opacity-[0.05] blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="glass-panel max-w-md w-full p-8 md:p-10 rounded-3xl relative z-10 border-t border-[var(--border-accent)] shadow-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-1)] mb-5 border border-[var(--primary)]/30 text-[var(--primary)] shadow-[0_0_30px_rgba(22,160,133,0.2)] rotate-3"
          >
            <Layers className="w-10 h-10 -rotate-3 drop-shadow-[0_0_10px_rgba(22,160,133,0.5)]" />
          </motion.div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">PS-08 System <span className="text-xs bg-[var(--primary)] text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ml-2">v2.0</span></h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Vignan&apos;s Institute of Information Technology</p>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Role Selection */}
          {step === "ROLE" && (
            <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4 text-center">Choose your role to continue</p>
              <div className="space-y-3">
                {ROLES.map((r) => (
                  <button key={r.key} onClick={() => handleRoleSelect(r)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--surface-3)] transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${r.color}20`, border: `1px solid ${r.color}40` }}>
                      <User className="w-5 h-5" style={{ color: r.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">{r.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{r.email}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)] -rotate-90 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Credentials */}
          {step === "CREDENTIALS" && (
            <motion.div key="creds" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedRole?.color}20` }}>
                  <User className="w-4 h-4" style={{ color: selectedRole?.color }} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{selectedRole?.label}</p>
                  <button onClick={() => { setStep("ROLE"); setError(""); }} className="text-xs text-[var(--primary)] hover:underline">Change role</button>
                </div>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field py-3" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field py-3" required />
                </div>

                {/* Faculty designation picker */}
                {selectedRole?.key === "FACULTY" && (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Your Designation</label>
                    <select value={designation} onChange={e => setDesignation(e.target.value)} className="input-field py-3">
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                    </select>
                  </div>
                )}

                {error && (
                  <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded-xl border border-red-900/50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" className="btn btn-primary w-full mt-2 py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 group"
                >
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> Sign In
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* STEP 3: Access Code (Asst HOD only) */}
          {step === "ACCESS_CODE" && (
            <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 mb-4">
                  <ShieldCheck className="w-8 h-8 text-[var(--accent)]" />
                </div>
                <h2 className="font-heading font-bold text-white text-xl">Access Code Required</h2>
                <p className="text-[var(--text-secondary)] text-sm mt-2">Enter the access code provided by your HOD to unlock the Assistant HOD portal.</p>
              </div>

              <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Access Code</label>
                  <input
                    type="text" value={accessCode}
                    onChange={e => setAccessCode(e.target.value.toUpperCase())}
                    className="input-field py-3 font-mono text-center text-xl tracking-[0.4em]"
                    placeholder="XXXX-XXXX"
                    maxLength={9} required
                  />
                </div>

                {error && (
                  <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded-xl border border-red-900/50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" className="btn w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 bg-[var(--accent)] text-black"
                >
                  <KeyRound className="w-5 h-5" /> Unlock Portal
                </motion.button>
                <button type="button" onClick={() => { setStep("ROLE"); setError(""); }} className="btn btn-secondary w-full py-2.5 rounded-xl text-sm">
                  Back to Login
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}


