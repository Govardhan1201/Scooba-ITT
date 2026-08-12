import React, { useMemo } from "react";
import { useApp, ACTIONS } from "../../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { buildReplacementPlan, getAffectedDayNames, findAffectedClasses } from "../../engine/absence";
import { CheckCircle, XCircle, AlertTriangle, Clock, User, BookOpen, Calendar, ChevronDown, ChevronUp, Star } from "lucide-react";

const STATUS_LABELS = {
  PENDING_HOD: { label: "Pending Your Review", color: "text-yellow-400", bg: "bg-yellow-950/40", border: "border-yellow-900/50" },
  APPROVED: { label: "Approved", color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10", border: "border-[var(--primary)]/20" },
  REJECTED: { label: "Rejected", color: "text-red-400", bg: "bg-red-950/40", border: "border-red-900/50" },
};

function ScoreBar({ label, value, max = 100 }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[var(--text-muted)] w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.6 }}
          className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] rounded-full"
        />
      </div>
      <span className="text-white font-mono font-bold w-8 text-right">{value}</span>
    </div>
  );
}

function AbsenceCard({ absence }) {
  const { state, dispatch, showToast, workloadStats } = useApp();
  const [expanded, setExpanded] = React.useState(false);

  const faculty = state.faculty.find(f => f.id === absence.facultyId);
  const statusCfg = STATUS_LABELS[absence.status] ?? STATUS_LABELS.PENDING_HOD;

  const replacementPlan = useMemo(() => {
    if (absence.status !== "PENDING_HOD") return [];
    const affectedDays = getAffectedDayNames(absence.fromDate, absence.toDate);
    const affected = findAffectedClasses(absence.facultyId, affectedDays, state.timetableGrids);
    return buildReplacementPlan(absence.facultyId, affected, state.faculty, state.timetableGrids, workloadStats);
  }, [absence, state.timetableGrids, state.faculty, workloadStats]);

  const approve = () => {
    dispatch({ type: ACTIONS.UPDATE_ABSENCE, payload: { id: absence.id, status: "APPROVED" } });
    dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: {
      id: `NOTIF_${Date.now()}`, userId: absence.facultyId,
      title: "Absence Request Approved",
      message: `Your absence from ${absence.fromDate} to ${absence.toDate} has been approved by the HOD.`,
      type: "SUCCESS", read: false, createdAt: new Date().toISOString(),
    }});
    dispatch({ type: ACTIONS.ADD_AUDIT_ENTRY, payload: {
      id: `AUD_${Date.now()}`, userId: state.currentUser?.id,
      userName: state.currentUser?.name, action: "APPROVE_ABSENCE",
      entity: "ABSENCE", entityId: absence.id,
      detail: `Approved absence for ${faculty?.name} from ${absence.fromDate} to ${absence.toDate}`,
      timestamp: new Date().toISOString(),
    }});
    showToast(`Absence approved for ${faculty?.name}`, "success");
  };

  const reject = () => {
    dispatch({ type: ACTIONS.UPDATE_ABSENCE, payload: { id: absence.id, status: "REJECTED" } });
    dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: {
      id: `NOTIF_${Date.now()}`, userId: absence.facultyId,
      title: "Absence Request Rejected",
      message: `Your absence request from ${absence.fromDate} to ${absence.toDate} has been rejected by the HOD.`,
      type: "ERROR", read: false, createdAt: new Date().toISOString(),
    }});
    showToast(`Absence rejected for ${faculty?.name}`, "error");
  };

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden"
    >
      <div className="p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center shrink-0 border border-[var(--border)]">
          <User className="w-6 h-6 text-[var(--primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-heading font-bold text-white">{faculty?.name ?? absence.facultyId}</h3>
            <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", statusCfg.bg, statusCfg.border, statusCfg.color)}>{statusCfg.label}</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{faculty?.designation} · {faculty?.specialization}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{absence.fromDate} → {absence.toDate}</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{absence.reason}</span>
          </div>
          {absence.note && <p className="text-xs text-[var(--text-secondary)] mt-1 italic">"{absence.note}"</p>}
        </div>
        <div className="flex items-center gap-2">
          {absence.status === "PENDING_HOD" && (
            <>
              <button onClick={approve} className="flex items-center gap-1.5 px-3 py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg text-xs font-bold transition-colors">
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
              <button onClick={reject} className="flex items-center gap-1.5 px-3 py-2 bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/40 rounded-lg text-xs font-bold transition-colors">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}
          {replacementPlan.length > 0 && (
            <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-1 px-3 py-2 bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)] rounded-lg text-xs font-bold transition-colors">
              Analysis {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && replacementPlan.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--border)] overflow-hidden"
          >
            <div className="p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">AI Replacement Analysis</h4>
              {replacementPlan.map((plan, i) => {
                const subject = state.subjects.find(s => s.id === plan.affectedClass.subjectId);
                const section = state.sections.find(s => s.id === plan.affectedClass.sectionId);
                return (
                  <div key={i} className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-[var(--accent)]" />
                      <span className="text-sm font-bold text-white">{subject?.name ?? plan.affectedClass.subjectId}</span>
                      <span className="text-xs text-[var(--text-muted)]">· {section?.label} · {plan.affectedClass.day} {plan.affectedClass.slotLabel}</span>
                    </div>
                    {plan.candidates.slice(0, 3).map((c, ci) => (
                      <div key={c.faculty.id} className={cn("rounded-lg p-3 mb-2 border", ci === 0 ? "bg-[var(--primary)]/5 border-[var(--primary)]/20" : "bg-[var(--surface-3)] border-[var(--border)]")}>
                        <div className="flex items-center gap-2 mb-2">
                          {ci === 0 && <Star className="w-3 h-3 text-[var(--primary)]" />}
                          <span className="text-sm font-bold text-white">{c.faculty.name}</span>
                          <span className="text-xs text-[var(--text-muted)]">{c.faculty.designation}</span>
                          <span className={cn("ml-auto text-xs font-bold px-2 py-0.5 rounded-full", ci === 0 ? "bg-[var(--primary)] text-black" : "bg-[var(--surface-2)] text-[var(--text-secondary)]")}>
                            {c.score}/100
                          </span>
                        </div>
                        <div className="space-y-1">
                          <ScoreBar label="Skill Match" value={c.breakdown.skillScore} max={40} />
                          <ScoreBar label="Capacity" value={c.breakdown.capacityScore} max={30} />
                          <ScoreBar label="Availability" value={c.breakdown.availabilityScore} max={20} />
                          <ScoreBar label="No Collision" value={c.breakdown.collisionScore} max={10} />
                        </div>
                        {c.breakdown.hasCollision && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> Timetable collision detected</p>
                        )}
                      </div>
                    ))}
                    {plan.candidates.length === 0 && (
                      <p className="text-xs text-[var(--text-muted)] py-2">No eligible replacement found for this slot.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HODApprovals() {
  const { state } = useApp();
  const pending = state.absences.filter(a => a.status === "PENDING_HOD");
  const approved = state.absences.filter(a => a.status === "APPROVED");
  const rejected = state.absences.filter(a => a.status === "REJECTED");

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white">Approval Center</h1>
        <p className="text-[var(--text-secondary)] mt-1">Review faculty absence requests and intelligent replacement suggestions</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending Review", value: pending.length, color: "text-yellow-400" },
          { label: "Approved", value: approved.length, color: "text-[var(--primary)]" },
          { label: "Rejected", value: rejected.length, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="glass-panel p-4 rounded-2xl border border-[var(--border)] text-center">
            <p className={cn("text-3xl font-heading font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-heading font-bold text-white">Pending Review ({pending.length})</h2>
          </div>
          <div className="space-y-4">
            {pending.map(a => <AbsenceCard key={a.id} absence={a} />)}
          </div>
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-lg font-heading font-bold text-white">Approved ({approved.length})</h2>
          </div>
          <div className="space-y-3">
            {approved.map(a => <AbsenceCard key={a.id} absence={a} />)}
          </div>
        </div>
      )}

      {state.absences.length === 0 && (
        <div className="glass-panel rounded-2xl border border-[var(--border)] p-16 text-center">
          <CheckCircle className="w-12 h-12 text-[var(--primary)] mx-auto mb-4" />
          <h3 className="text-xl font-heading font-bold text-white mb-2">All Clear!</h3>
          <p className="text-[var(--text-secondary)]">No absence requests pending. Faculty absence intimations will appear here.</p>
        </div>
      )}
    </div>
  );
}
