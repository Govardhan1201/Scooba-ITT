import React, { useMemo, useState, useEffect } from "react";
import { useApp, ACTIONS } from "../../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { deriveFacultyTimetables, TIME_SLOTS, DAYS } from "../../engine/timetable";
import { getFacultyWorkloadProfile } from "../../engine/workload";
import {
  BookOpen, Clock, Calendar, Bell, User, ChevronRight,
  TrendingUp, AlertTriangle, CheckCircle, Send, Loader, ArrowLeftRight, Timer
} from "lucide-react";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_CFG = {
  OVERLOADED: { color: "text-red-400", bg: "bg-red-950/40", border: "border-red-900/50", Icon: AlertTriangle },
  BALANCED:   { color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10", border: "border-[var(--primary)]/20", Icon: CheckCircle },
  UNDERLOADED:{ color: "text-yellow-400", bg: "bg-yellow-950/40", border: "border-yellow-900/50", Icon: TrendingUp },
};

function StatCard({ label, value, sub, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 rounded-2xl flex flex-col gap-1 border border-[var(--border)]"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
      <p className={cn("text-3xl font-heading font-bold", accent ?? "text-white")}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-secondary)]">{sub}</p>}
    </motion.div>
  );
}

export default function FacultyDashboard() {
  const { state, dispatch, showToast } = useApp();
  const me = state.currentUser;
  const myFaculty = state.faculty.find(f => f.id === me?.facultyId) ?? state.faculty.find(f => f.email === me?.email);

  const [absenceForm, setAbsenceForm] = useState({ open: false, fromDate: "", toDate: "", reason: "", note: "", submitting: false });
  const [reallocateModal, setReallocateModal] = useState(null); // { key, sectionId, slotLabel, subjectName }
  const [reallocateTo, setReallocateTo] = useState('');
  const [now, setNow] = useState(new Date());

  // Update clock every 30 seconds for accurate 10-min checks
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  /**
   * Returns true if class start is >10 minutes from now.
   * slotStart is like "08:45".
   */
  const canReallocate = (slotStart) => {
    const [h, m] = slotStart.split(':').map(Number);
    const classTime = new Date();
    classTime.setHours(h, m, 0, 0);
    const diffMs = classTime - now;
    return diffMs > 10 * 60 * 1000; // more than 10 minutes away
  };

  const submitReallocation = () => {
    if (!reallocateTo || !reallocateModal) return;
    const { key, sectionId, slotLabel, subjectName } = reallocateModal;
    const newFac = state.faculty.find(f => f.id === reallocateTo);
    if (!newFac) return;
    dispatch({
      type: ACTIONS.UPDATE_TIMETABLE_SLOT,
      payload: { sectionId, key, assignment: { ...state.timetableGrids[sectionId]?.[key]?.assignment, facultyId: reallocateTo } }
    });
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        id: `NOTIF_${Date.now()}`, userId: reallocateTo,
        title: 'Class Reallocated to You',
        message: `${myFaculty?.name} has reallocated ${subjectName} (${slotLabel}) to you as a temporary cover.`,
        type: 'WARNING', read: false, createdAt: new Date().toISOString(),
      },
    });
    showToast(`Class reallocated to ${newFac.name}`, 'success');
    setReallocateModal(null);
    setReallocateTo('');
  };

  // Workload profile
  const profile = useMemo(() => {
    if (!myFaculty) return null;
    return getFacultyWorkloadProfile(myFaculty, state.settings.workloadWeights, {
      overloaded: state.settings.workloadThresholds.overloaded,
      balanced: { min: state.settings.workloadThresholds.balancedMin, max: state.settings.workloadThresholds.balancedMax },
      underloaded: state.settings.workloadThresholds.balancedMin,
    });
  }, [myFaculty, state.settings]);

  // My timetable entries
  const myEntries = useMemo(() => {
    if (!myFaculty) return [];
    const map = deriveFacultyTimetables(state.timetableGrids);
    return map.get(myFaculty.id) ?? [];
  }, [myFaculty, state.timetableGrids]);

  // My absence requests
  const myAbsences = useMemo(() => state.absences.filter(a => a.facultyId === myFaculty?.id), [state.absences, myFaculty]);

  // My notifications
  const myNotifs = useMemo(() =>
    state.notifications.filter(n => n.userId === myFaculty?.id || n.userId === "FACULTY").slice(0, 5),
    [state.notifications, myFaculty]
  );

  const statusCfg = STATUS_CFG[profile?.status] ?? STATUS_CFG.BALANCED;

  const submitAbsence = () => {
    if (!absenceForm.fromDate || !absenceForm.toDate || !absenceForm.reason) {
      showToast("Please fill all required fields", "error");
      return;
    }
    setAbsenceForm(f => ({ ...f, submitting: true }));
    setTimeout(() => {
      const id = `ABS_${Date.now()}`;
      dispatch({
        type: ACTIONS.ADD_ABSENCE,
        payload: {
          id, facultyId: myFaculty.id, facultyName: myFaculty.name,
          fromDate: absenceForm.fromDate, toDate: absenceForm.toDate,
          reason: absenceForm.reason, note: absenceForm.note,
          status: "PENDING_HOD", submittedAt: new Date().toISOString(),
          replacements: [],
        },
      });
      dispatch({
        type: ACTIONS.ADD_NOTIFICATION,
        payload: {
          id: `NOTIF_${Date.now()}`, userId: "HOD",
          title: "New Absence Intimation",
          message: `${myFaculty.name} has submitted an absence request for ${absenceForm.fromDate} to ${absenceForm.toDate}.`,
          type: "WARNING", read: false, createdAt: new Date().toISOString(),
        },
      });
      showToast("Absence request submitted successfully!", "success");
      setAbsenceForm({ open: false, fromDate: "", toDate: "", reason: "", note: "", submitting: false });
    }, 800);
  };

  if (!myFaculty) return (
    <div className="p-8 text-[var(--text-secondary)]">
      Faculty profile not found. Please contact HOD.
    </div>
  );

  const classesBySection = {};
  myEntries.forEach(e => {
    if (!classesBySection[e.sectionId]) classesBySection[e.sectionId] = [];
    classesBySection[e.sectionId].push(e);
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">
            Welcome back, {myFaculty.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">{myFaculty.designation} · {myFaculty.specialization}</p>
        </div>
        <button
          onClick={() => setAbsenceForm(f => ({ ...f, open: true }))}
          className="btn btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-[var(--primary)]/20"
        >
          <Send className="w-4 h-4" /> Submit Absence Request
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Workload" value={`${profile?.utilization ?? 0}%`} sub={`${profile?.effectiveWorkload ?? 0}h / ${profile?.maxHours ?? 0}h`} accent={statusCfg.color} />
        <StatCard label="Assigned Classes" value={Object.keys(classesBySection).length} sub="sections this semester" />
        <StatCard label="Total Periods" value={myEntries.length} sub="slots in timetable" />
        <StatCard label="Pending Requests" value={myAbsences.filter(a => a.status === "PENDING_HOD").length} sub="awaiting HOD" />
      </div>

      {/* Workload Status Banner */}
      <motion.div
        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
        className={cn("p-4 rounded-2xl border flex items-center gap-4", statusCfg.bg, statusCfg.border)}
      >
        <statusCfg.Icon className={cn("w-8 h-8 shrink-0", statusCfg.color)} />
        <div>
          <p className={cn("font-bold text-lg", statusCfg.color)}>{profile?.status} — {profile?.utilization}% Utilized</p>
          <p className="text-[var(--text-secondary)] text-sm">
            {profile?.status === "OVERLOADED" && "You are above your designation limit. Please speak with the HOD."}
            {profile?.status === "BALANCED" && "Your workload is well balanced. Keep it up!"}
            {profile?.status === "UNDERLOADED" && "You have remaining capacity. More assignments may be allocated."}
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="w-32 h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, profile?.utilization ?? 0)}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className={cn("h-full rounded-full", profile?.status === "OVERLOADED" ? "bg-red-400" : profile?.status === "BALANCED" ? "bg-[var(--primary)]" : "bg-yellow-400")}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* My Classes */}
        <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="font-heading font-bold text-white">My Assigned Classes</h2>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {Object.entries(classesBySection).length === 0 && (
              <p className="text-[var(--text-muted)] text-sm text-center py-6">No classes assigned yet. Timetable is being built.</p>
            )}
            {Object.entries(classesBySection).map(([sectionId, entries]) => {
              const section = state.sections.find(s => s.id === sectionId);
              const subjectIds = [...new Set(entries.map(e => e.subjectId))];
              return (
                <div key={sectionId} className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
                  <p className="font-bold text-white text-sm">{section?.label ?? sectionId}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subjectIds.map(sid => {
                      const sub = state.subjects.find(s => s.id === sid);
                      const count = entries.filter(e => e.subjectId === sid).length;
                      return (
                        <span key={sid} className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 px-2 py-1 rounded-lg font-semibold">
                          {sub?.code ?? sid} · {count}h/wk
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Absence History */}
        <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-heading font-bold text-white">My Absence Requests</h2>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {myAbsences.length === 0 && (
              <p className="text-[var(--text-muted)] text-sm text-center py-6">No absence requests submitted yet.</p>
            )}
            {myAbsences.map(abs => {
              const statusMap = {
                PENDING_HOD: { color: "text-yellow-400", bg: "bg-yellow-950/40", border: "border-yellow-900/50", label: "Pending HOD" },
                APPROVED: { color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10", border: "border-[var(--primary)]/20", label: "Approved" },
                REJECTED: { color: "text-red-400", bg: "bg-red-950/40", border: "border-red-900/50", label: "Rejected" },
              };
              const cfg = statusMap[abs.status] ?? statusMap.PENDING_HOD;
              return (
                <div key={abs.id} className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white text-sm">{abs.fromDate} → {abs.toDate}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{abs.reason}</p>
                    </div>
                    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border", cfg.bg, cfg.border, cfg.color)}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reallocation Panel */}
      <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <ArrowLeftRight className="w-5 h-5 text-yellow-400" />
          <h2 className="font-heading font-bold text-white">Temporary Class Reallocation</h2>
          <span className="ml-auto text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] px-2 py-1 rounded-full border border-[var(--border)] flex items-center gap-1">
            <Timer className="w-3 h-3" /> Must be &gt;10 min before class
          </span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-[var(--text-secondary)]">
            Temporarily reallocate your classes to another faculty member without HOD approval — only available until 10 minutes before the class.
          </p>
          {myEntries.length === 0 && (
            <p className="text-[var(--text-muted)] text-sm text-center py-6">No classes assigned yet.</p>
          )}
          {myEntries.map(entry => {
            const slot = TIME_SLOTS.find(s => s.id === entry.slotId);
            const subject = state.subjects.find(s => s.id === entry.subjectId);
            const section = state.sections.find(s => s.id === entry.sectionId);
            const slotStart = slot?.start ?? '08:45';
            const allowed = canReallocate(slotStart);
            const entryKey = `${entry.day}_${entry.slotId}_${entry.sectionId}`;
            return (
              <div key={entryKey} className="flex items-center justify-between gap-3 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{subject?.name ?? entry.subjectId}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                    {entry.day} · {slot?.label} · {section?.label}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!allowed) { showToast('Cannot reallocate — less than 10 minutes before class!', 'error'); return; }
                    setReallocateModal({ key: `${entry.day}_${entry.slotId}`, sectionId: entry.sectionId, slotLabel: slot?.label, subjectName: subject?.name ?? entry.subjectId });
                    setReallocateTo('');
                  }}
                  className={cn(
                    'btn text-xs flex items-center gap-1.5 shrink-0',
                    allowed
                      ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20'
                      : 'opacity-40 cursor-not-allowed bg-[var(--surface-3)] text-[var(--text-muted)] border border-[var(--border)]'
                  )}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  {allowed ? 'Reallocate' : 'Locked'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {myNotifs.length > 0 && (
        <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <Bell className="w-5 h-5 text-[var(--warning)]" />
            <h2 className="font-heading font-bold text-white">Notifications</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {myNotifs.map(n => (
              <div key={n.id} className={cn("px-6 py-4 flex items-start gap-4", !n.read && "bg-[var(--primary)]/5")}>
                <Bell className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Absence Request Modal */}
      <AnimatePresence>
        {absenceForm.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setAbsenceForm(f => ({ ...f, open: false })); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-[var(--border-accent)] shadow-2xl"
            >
              <h2 className="text-xl font-heading font-bold text-white mb-6 flex items-center gap-3">
                <Send className="w-5 h-5 text-[var(--primary)]" /> Submit Absence Request
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">From Date *</label>
                    <input type="date" value={absenceForm.fromDate} onChange={e => setAbsenceForm(f => ({ ...f, fromDate: e.target.value }))} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">To Date *</label>
                    <input type="date" value={absenceForm.toDate} onChange={e => setAbsenceForm(f => ({ ...f, toDate: e.target.value }))} className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Reason *</label>
                  <select value={absenceForm.reason} onChange={e => setAbsenceForm(f => ({ ...f, reason: e.target.value }))} className="input-field">
                    <option value="">Select Reason</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Personal Emergency">Personal Emergency</option>
                    <option value="Conference / Research">Conference / Research</option>
                    <option value="Family Event">Family Event</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Additional Note</label>
                  <textarea value={absenceForm.note} onChange={e => setAbsenceForm(f => ({ ...f, note: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Any additional information..." />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setAbsenceForm(f => ({ ...f, open: false }))} className="btn btn-secondary flex-1 py-2.5 rounded-xl">Cancel</button>
                <button onClick={submitAbsence} disabled={absenceForm.submitting} className="btn btn-primary flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2">
                  {absenceForm.submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {absenceForm.submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reallocation Confirm Modal */}
      <AnimatePresence>
        {reallocateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setReallocateModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-panel rounded-2xl p-8 w-full max-w-md border border-yellow-500/30 shadow-2xl"
            >
              <h2 className="text-xl font-heading font-bold text-white mb-2 flex items-center gap-3">
                <ArrowLeftRight className="w-5 h-5 text-yellow-400" /> Reallocate Class
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Temporarily hand off <strong className="text-white">{reallocateModal.subjectName}</strong> ({reallocateModal.slotLabel}) to another faculty member.
              </p>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Assign To *</label>
                <select value={reallocateTo} onChange={e => setReallocateTo(e.target.value)} className="input-field">
                  <option value="">Select Faculty</option>
                  {state.faculty.filter(f => f.id !== myFaculty?.id && f.status === 'ACTIVE').map(f => (
                    <option key={f.id} value={f.id}>{f.name} — {f.designation}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setReallocateModal(null)} className="btn btn-secondary flex-1 py-2.5 rounded-xl">Cancel</button>
                <button onClick={submitReallocation} disabled={!reallocateTo} className="btn flex-1 py-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 font-semibold flex items-center justify-center gap-2">
                  <ArrowLeftRight className="w-4 h-4" /> Confirm Reallocation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

