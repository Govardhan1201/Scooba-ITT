import React, { useState, useMemo } from "react";
import { useApp, ACTIONS } from "../../context/AppContext";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { getFacultyWorkloadProfile } from "../../engine/workload";
import { User, Edit2, Save, BookOpen, TrendingUp, CheckCircle, AlertTriangle, Mail, Hash, Award, X } from "lucide-react";

const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor"];

export default function FacultyProfile() {
  const { state, dispatch, showToast } = useApp();
  const me = state.currentUser;
  const myFaculty = state.faculty.find(f => f.id === me?.facultyId) ?? state.faculty.find(f => f.email === me?.email);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  const profile = useMemo(() => {
    if (!myFaculty) return null;
    return getFacultyWorkloadProfile(myFaculty, state.settings.workloadWeights, {
      overloaded: state.settings.workloadThresholds.overloaded,
      balanced: { min: state.settings.workloadThresholds.balancedMin, max: state.settings.workloadThresholds.balancedMax },
      underloaded: state.settings.workloadThresholds.balancedMin,
    });
  }, [myFaculty, state.settings]);

  if (!myFaculty) return (
    <div className="p-8 text-[var(--text-secondary)]">Faculty profile not found. Contact HOD.</div>
  );

  const startEdit = () => {
    setFormData({ name: myFaculty.name, email: myFaculty.email, designation: myFaculty.designation, specialization: myFaculty.specialization });
    setEditing(true);
  };

  const saveEdit = () => {
    dispatch({ type: ACTIONS.UPDATE_FACULTY, payload: { ...myFaculty, ...formData } });
    showToast("Profile updated successfully!", "success");
    setEditing(false);
  };

  const STATUS_CFG = {
    OVERLOADED: { color: "text-red-400", bg: "bg-red-950/40 border-red-900/50", Icon: AlertTriangle, label: "Overloaded" },
    BALANCED:   { color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10 border-[var(--primary)]/20", Icon: CheckCircle, label: "Balanced" },
    UNDERLOADED:{ color: "text-yellow-400", bg: "bg-yellow-950/40 border-yellow-900/50", Icon: TrendingUp, label: "Underloaded" },
  };
  const statusCfg = STATUS_CFG[profile?.status] ?? STATUS_CFG.BALANCED;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl border border-[var(--border)] overflow-hidden"
      >
        <div className="h-32 bg-gradient-to-r from-[var(--primary)]/20 via-[var(--surface-2)] to-[var(--accent)]/10"></div>
        <div className="px-8 pb-8 -mt-16 flex items-end justify-between gap-4 flex-wrap">
          <div className="flex items-end gap-5">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-black font-bold text-4xl shadow-xl border-4 border-[var(--surface-1)] font-heading">
              {myFaculty.name.charAt(0)}
            </div>
            <div className="pb-2">
              {editing ? (
                <div className="space-y-2">
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field text-xl font-bold" placeholder="Full Name" />
                  <select value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} className="input-field text-sm">
                    {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-heading font-bold text-white">{myFaculty.name}</h1>
                  <p className="text-[var(--primary-light)] font-bold text-sm mt-0.5">{myFaculty.designation}</p>
                </>
              )}
            </div>
          </div>
          <div className="pb-2 flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn btn-secondary"><X className="w-4 h-4" /> Cancel</button>
                <button onClick={saveEdit} className="btn btn-primary"><Save className="w-4 h-4" /> Save</button>
              </>
            ) : (
              <button onClick={startEdit} className="btn btn-secondary"><Edit2 className="w-4 h-4" /> Edit Profile</button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact & Info */}
        <div className="glass-panel rounded-2xl border border-[var(--border)] p-6 space-y-5">
          <h2 className="font-heading font-bold text-white flex items-center gap-2"><User className="w-5 h-5 text-[var(--primary)]" /> Personal Details</h2>
          {editing ? (
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-[var(--text-secondary)]">Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="input-field mt-1" /></div>
              <div><label className="text-xs font-bold text-[var(--text-secondary)]">Specialization</label><input value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} className="input-field mt-1" /></div>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { icon: Mail, label: "Email", value: myFaculty.email },
                { icon: Hash, label: "Employee ID", value: myFaculty.empId },
                { icon: BookOpen, label: "Specialization", value: myFaculty.specialization },
                { icon: Award, label: "Designation", value: myFaculty.designation },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm text-white font-medium">{item.value || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workload */}
        <div className="glass-panel rounded-2xl border border-[var(--border)] p-6 space-y-5">
          <h2 className="font-heading font-bold text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[var(--primary)]" /> Workload Summary</h2>

          <div className={cn("p-3 rounded-xl border flex items-center gap-3", statusCfg.bg)}>
            <statusCfg.Icon className={cn("w-5 h-5 shrink-0", statusCfg.color)} />
            <div>
              <p className={cn("font-bold text-sm", statusCfg.color)}>{statusCfg.label} — {profile?.utilization ?? 0}%</p>
              <p className="text-xs text-[var(--text-secondary)]">{profile?.effectiveWorkload ?? 0}h / {profile?.maxHours ?? 0}h maximum</p>
            </div>
          </div>

          <div className="w-full h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${Math.min(100, profile?.utilization ?? 0)}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className={cn("h-full rounded-full", profile?.status === "OVERLOADED" ? "bg-red-400" : profile?.status === "BALANCED" ? "bg-[var(--primary)]" : "bg-yellow-400")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Theory Hours", value: myFaculty.responsibilities?.theoryHours ?? 0 },
              { label: "Lab Hours", value: myFaculty.responsibilities?.labHours ?? 0 },
              { label: "Project Guidance", value: myFaculty.responsibilities?.projectHours ?? 0 },
              { label: "Mentoring", value: myFaculty.responsibilities?.mentoringHours ?? 0 },
              { label: "Examination", value: myFaculty.responsibilities?.examHours ?? 0 },
              { label: "Dept Work", value: myFaculty.responsibilities?.deptHours ?? 0 },
            ].map(item => (
              <div key={item.label} className="bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{item.label}</p>
                <p className="text-xl font-bold font-mono text-white">{item.value}<span className="text-sm text-[var(--text-muted)]">h</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skills */}
      {myFaculty.skills && myFaculty.skills.length > 0 && (
        <div className="glass-panel rounded-2xl border border-[var(--border)] p-6 space-y-4">
          <h2 className="font-heading font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-[var(--primary)]" /> Subject Skills & Competencies</h2>
          <div className="flex flex-wrap gap-3">
            {myFaculty.skills.map(skill => {
              const subject = state.subjects.find(s => s.id === skill.subjectId);
              return (
                <div key={skill.subjectId} className="bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2 rounded-xl flex items-center gap-3">
                  <span className="text-sm font-bold text-white">{subject?.name ?? skill.subjectId}</span>
                  <span className="text-xs text-[var(--primary)] font-mono bg-[var(--primary)]/10 px-2 py-0.5 rounded-lg">{subject?.code}</span>
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className={star <= (skill.proficiency ?? 3) ? "text-yellow-400 text-xs" : "text-[var(--surface-3)] text-xs"}>★</span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
