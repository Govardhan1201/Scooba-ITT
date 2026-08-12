import React, { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { getFacultyWorkloadProfile } from "../../engine/workload";
import { deriveFacultyTimetables } from "../../engine/timetable";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, User, ChevronDown, ChevronUp, Zap } from "lucide-react";

const STATUS_CFG = {
  OVERLOADED: { color: "text-red-400", bg: "bg-red-950/40", border: "border-red-900/50", bar: "bg-red-400", Icon: AlertTriangle, label: "Overloaded" },
  BALANCED:   { color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10", border: "border-[var(--primary)]/20", bar: "bg-[var(--primary)]", Icon: CheckCircle, label: "Balanced" },
  UNDERLOADED:{ color: "text-yellow-400", bg: "bg-yellow-950/40", border: "border-yellow-900/50", bar: "bg-yellow-400", Icon: TrendingUp, label: "Underloaded" },
};

function WorkloadBar({ value, max = 100 }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct > 100 ? "bg-red-400" : pct >= 70 ? "bg-[var(--primary)]" : "bg-yellow-400";
  return (
    <div className="w-full h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn("h-full rounded-full", color)}
      />
    </div>
  );
}

function FacultyCard({ profile, expanded, onToggle }) {
  const cfg = STATUS_CFG[profile.status] ?? STATUS_CFG.BALANCED;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-4 hover:bg-[var(--surface-2)]/30 transition-colors text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--surface-3)] to-[var(--surface-2)] flex items-center justify-center shrink-0 border border-[var(--border)] text-[var(--primary)] font-bold text-lg font-heading">
          {profile.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-heading font-bold text-white">{profile.name}</h3>
            <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", cfg.bg, cfg.border, cfg.color)}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{profile.designation}</p>
          <div className="mt-2 flex items-center gap-3">
            <WorkloadBar value={profile.utilization} />
            <span className={cn("text-sm font-bold font-mono shrink-0", cfg.color)}>{profile.utilization}%</span>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <div className="text-xs text-[var(--text-muted)]">Effective Load</div>
          <div className="text-lg font-bold font-mono text-white">{profile.effectiveWorkload}h</div>
          <div className="text-xs text-[var(--text-muted)]">/ {profile.maxHours}h max</div>
        </div>
        <div className="ml-2 text-[var(--text-muted)]">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--border)] overflow-hidden"
          >
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Theory Hours", value: profile.rawBreakdown?.theory ?? 0, unit: "h" },
                { label: "Lab Hours", value: profile.rawBreakdown?.laboratory ?? 0, unit: "h" },
                { label: "Project Guidance", value: profile.rawBreakdown?.projectGuidance ?? 0, unit: "h" },
                { label: "Examination", value: profile.rawBreakdown?.examination ?? 0, unit: "h" },
                { label: "Mentoring", value: profile.rawBreakdown?.mentoring ?? 0, unit: "h" },
                { label: "Dept Work", value: profile.rawBreakdown?.departmentWork ?? 0, unit: "h" },
              ].map(item => (
                <div key={item.label} className="bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">{item.label}</div>
                  <div className="text-xl font-bold font-mono text-white">{item.value}<span className="text-sm text-[var(--text-muted)]">{item.unit}</span></div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
                <div className="flex justify-between text-xs text-[var(--text-muted)] mb-2">
                  <span>Remaining Capacity</span>
                  <span className="font-mono font-bold text-white">{profile.remainingCapacity}h available</span>
                </div>
                <WorkloadBar value={profile.utilization} />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                  <span>0%</span><span>70% (min)</span><span>100% (max)</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function WorkloadPage() {
  const { state, workloadStats } = useApp();
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("utilization");

  const profiles = workloadStats?.profiles ?? [];

  const filtered = useMemo(() => {
    let list = [...profiles];
    if (filter !== "ALL") list = list.filter(p => p.status === filter);
    list.sort((a, b) => sortBy === "utilization" ? b.utilization - a.utilization : a.name.localeCompare(b.name));
    return list;
  }, [profiles, filter, sortBy]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Workload Analysis</h1>
          <p className="text-[var(--text-secondary)] mt-1">Real-time faculty workload across all responsibilities</p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Faculty", value: workloadStats?.total ?? 0, color: "text-[var(--info)]" },
          { label: "Overloaded", value: workloadStats?.overloaded ?? 0, color: "text-red-400" },
          { label: "Balanced", value: workloadStats?.balanced ?? 0, color: "text-[var(--primary)]" },
          { label: "Underloaded", value: workloadStats?.underloaded ?? 0, color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="glass-panel p-4 rounded-2xl border border-[var(--border)] text-center">
            <p className={cn("text-3xl font-heading font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Fairness Score */}
      <div className="glass-panel rounded-2xl border border-[var(--border)] p-5 flex items-center gap-6">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full text-[var(--primary)]">
            <path className="text-[var(--surface-3)]" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <motion.path
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: `${workloadStats?.fairnessScore ?? 0}, 100` }}
              transition={{ duration: 1.2, delay: 0.3 }}
              strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold font-mono text-white">{workloadStats?.fairnessScore ?? 0}</span>
          </div>
        </div>
        <div>
          <h3 className="font-heading font-bold text-white text-lg">Department Fairness Score</h3>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Avg utilization: <span className="text-white font-mono font-bold">{workloadStats?.avgUtilization ?? 0}%</span>
            &nbsp;· A score of 100 means perfectly equal workload distribution.
          </p>
        </div>
        <div className="ml-auto">
          <div className={cn("text-4xl font-bold font-mono",
            (workloadStats?.fairnessScore ?? 0) >= 80 ? "text-[var(--primary)]" :
            (workloadStats?.fairnessScore ?? 0) >= 60 ? "text-yellow-400" : "text-red-400"
          )}>{workloadStats?.fairnessScore ?? 0}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {["ALL", "OVERLOADED", "BALANCED", "UNDERLOADED"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                filter === f ? "bg-[var(--primary)] text-black border-[var(--primary)]" : "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/50"
              )}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="input-field max-w-[140px] text-xs py-1.5"
          >
            <option value="utilization">Utilization</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Faculty list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="glass-panel rounded-2xl border border-[var(--border)] p-12 text-center">
            <BarChart3 className="w-12 h-12 text-[var(--primary)] mx-auto mb-4" />
            <h3 className="text-xl font-heading font-bold text-white mb-2">No Data</h3>
            <p className="text-[var(--text-secondary)]">No faculty match the selected filter. Build the timetable and assign faculty first.</p>
          </div>
        )}
        {filtered.map(p => (
          <FacultyCard
            key={p.facultyId}
            profile={p}
            expanded={expandedId === p.facultyId}
            onToggle={() => setExpandedId(expandedId === p.facultyId ? null : p.facultyId)}
          />
        ))}
      </div>
    </div>
  );
}
