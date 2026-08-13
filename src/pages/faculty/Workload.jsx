import React, { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { getFacultyWorkloadProfile } from "../../engine/workload";
import { motion } from "framer-motion";
import { BarChart3, Clock, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "../../lib/utils";

const STATUS_CFG = {
  OVERLOADED: { color: "text-red-400", bg: "bg-red-950/40", border: "border-red-900/50", Icon: AlertTriangle },
  BALANCED:   { color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10", border: "border-[var(--primary)]/20", Icon: CheckCircle },
  UNDERLOADED:{ color: "text-yellow-400", bg: "bg-yellow-950/40", border: "border-yellow-900/50", Icon: TrendingUp },
};

export default function FacultyWorkload() {
  const { state } = useApp();
  const me = state.currentUser;
  const myFaculty = state.faculty.find(f => f.id === me?.facultyId) ?? state.faculty.find(f => f.email === me?.email);

  const profile = useMemo(() => {
    if (!myFaculty) return null;
    return getFacultyWorkloadProfile(myFaculty, state.settings.workloadWeights, {
      overloaded: state.settings.workloadThresholds.overloaded,
      balanced: { min: state.settings.workloadThresholds.balancedMin, max: state.settings.workloadThresholds.balancedMax },
      underloaded: state.settings.workloadThresholds.balancedMin,
    });
  }, [myFaculty, state.settings]);

  if (!myFaculty || !profile) return <div className="p-8 text-center text-[var(--text-secondary)]">Faculty profile not found.</div>;
  const statusCfg = STATUS_CFG[profile.status];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-[var(--primary)]" />
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">My Workload</h1>
          <p className="text-[var(--text-secondary)]">Detailed breakdown of your assigned hours.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("md:col-span-3 p-6 rounded-2xl border flex items-center gap-4", statusCfg.bg, statusCfg.border)}>
          <statusCfg.Icon className={cn("w-10 h-10 shrink-0", statusCfg.color)} />
          <div>
            <p className={cn("font-bold text-xl", statusCfg.color)}>{profile.status} — {profile.utilization}% Utilized</p>
            <p className="text-[var(--text-secondary)] mt-1">Your total effective workload is {profile.effectiveWorkload}h out of a maximum of {profile.maxHours}h limit based on your designation ({myFaculty.designation}).</p>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl border border-[var(--border)] md:col-span-2">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-[var(--primary)]" /> Hours Breakdown</h2>
          <div className="space-y-4">
            {Object.entries(profile.rawBreakdown).map(([key, hours]) => (
               <div key={key} className="flex justify-between items-center p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                 <span className="text-[var(--text-primary)] font-medium capitalize">{key.replace('Hours', '')} Classes</span>
                 <span className="text-[var(--primary-light)] font-mono font-bold bg-[var(--primary)]/10 px-3 py-1 rounded-lg">{hours}h</span>
               </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
