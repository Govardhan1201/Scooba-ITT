import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getFacultyWorkloadProfile } from '../../engine/workload';
import { detectCollisions, DAYS, TEACHING_SLOTS, slotKey } from '../../engine/timetable';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { FlaskConical, AlertTriangle, CheckCircle, XCircle, Zap, RotateCcw, Users, Clock, BookOpen } from 'lucide-react';

/**
 * WHAT-IF SIMULATOR
 * Lets the HOD test hypothetical changes in a sandboxed environment:
 * - Add/remove a faculty member temporarily
 * - Reassign subjects between faculty
 * - Check resulting workload and collision impact
 * All changes are local to this page and do NOT affect real data.
 */
export default function Simulator() {
  const { state } = useApp();

  // Local sandbox copies
  const [sandboxFaculty, setSandboxFaculty] = useState(() =>
    state.faculty.map(f => ({ ...f, responsibilities: { ...f.responsibilities } }))
  );
  const [sandboxGrids, setSandboxGrids] = useState(() =>
    JSON.parse(JSON.stringify(state.timetableGrids))
  );
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [log, setLog] = useState([]);
  const [dragSub, setDragSub] = useState(null);
  const [selectedSection, setSelectedSection] = useState(state.sections[0]?.id ?? '');

  const addLog = (msg, type = 'info') => {
    setLog(prev => [{ id: Date.now(), msg, type, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
  };

  const reset = () => {
    setSandboxFaculty(state.faculty.map(f => ({ ...f, responsibilities: { ...f.responsibilities } })));
    setSandboxGrids(JSON.parse(JSON.stringify(state.timetableGrids)));
    setLog([]);
    setSelectedFaculty(null);
    addLog('Simulator reset to live data snapshot.', 'info');
  };

  // Remove a faculty from sandbox
  const removeFaculty = (id) => {
    const f = sandboxFaculty.find(x => x.id === id);
    if (!f) return;
    setSandboxFaculty(prev => prev.filter(x => x.id !== id));
    // Clear all assignments for this faculty
    const newGrids = JSON.parse(JSON.stringify(sandboxGrids));
    Object.keys(newGrids).forEach(secId => {
      Object.keys(newGrids[secId]).forEach(key => {
        const cell = newGrids[secId][key];
        if (cell?.assignment?.facultyId === id) cell.assignment.facultyId = null;
        if (cell?.assignment?.facultyId2 === id) cell.assignment.facultyId2 = null;
      });
    });
    setSandboxGrids(newGrids);
    addLog(`Removed ${f.name} from sandbox. Their classes are now unassigned.`, 'warning');
  };

  // Simulate adding workload hours
  const addWorkloadHours = (facId, type, delta) => {
    setSandboxFaculty(prev => prev.map(f => {
      if (f.id !== facId) return f;
      const r = { ...f.responsibilities };
      r[type] = Math.max(0, (r[type] ?? 0) + delta);
      return { ...f, responsibilities: r };
    }));
    const facName = sandboxFaculty.find(f => f.id === facId)?.name;
    addLog(`${delta > 0 ? 'Added' : 'Removed'} ${Math.abs(delta)}h of ${type} to ${facName}.`, 'info');
  };

  // Collision analysis in sandbox
  const collisionReport = useMemo(() => {
    const issues = [];
    sandboxFaculty.forEach(f => {
      DAYS.forEach(day => {
        TEACHING_SLOTS.forEach(slot => {
          const collisions = detectCollisions(sandboxGrids, f.id, day, slot.id);
          if (collisions.length > 1) {
            issues.push({ faculty: f.name, day, slot: slot.label, sections: collisions.map(c => c.sectionId) });
          }
        });
      });
    });
    // Deduplicate
    const seen = new Set();
    return issues.filter(i => {
      const k = `${i.faculty}_${i.day}_${i.slot}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [sandboxFaculty, sandboxGrids]);

  // Workload summary
  const workloadSummary = useMemo(() => {
    return sandboxFaculty.map(f => {
      const profile = getFacultyWorkloadProfile(f);
      return { ...f, profile };
    });
  }, [sandboxFaculty]);

  const overloaded = workloadSummary.filter(f => f.profile.status === 'OVERLOADED');
  const underloaded = workloadSummary.filter(f => f.profile.status === 'UNDERLOADED');

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <FlaskConical className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-white tracking-tight">What-If Simulator</h1>
            <p className="text-[var(--text-secondary)] mt-1">Test hypothetical changes in a safe sandbox — no live data is modified.</p>
          </div>
        </div>
        <button onClick={reset} className="btn btn-outline flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Reset to Live Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Faculty in Sandbox" value={sandboxFaculty.length} icon={Users} color="text-[var(--primary)]" />
        <SummaryCard label="Collisions Found" value={collisionReport.length} icon={AlertTriangle} color={collisionReport.length > 0 ? 'text-red-400' : 'text-[var(--primary)]'} />
        <SummaryCard label="Overloaded Faculty" value={overloaded.length} icon={Zap} color={overloaded.length > 0 ? 'text-red-400' : 'text-[var(--primary)]'} />
        <SummaryCard label="Underloaded Faculty" value={underloaded.length} icon={Clock} color={underloaded.length > 0 ? 'text-yellow-400' : 'text-[var(--primary)]'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Faculty Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--primary)]" />
              <h2 className="font-bold text-white">Sandbox Faculty</h2>
            </div>
            <div className="p-4 space-y-2 max-h-[450px] overflow-y-auto">
              {workloadSummary.map(f => (
                <div key={f.id}
                  onClick={() => setSelectedFaculty(selectedFaculty?.id === f.id ? null : f)}
                  className={cn(
                    'p-3 rounded-xl border cursor-pointer transition-all',
                    selectedFaculty?.id === f.id
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)]/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white truncate">{f.name}</span>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                      f.profile.status === 'OVERLOADED' ? 'bg-red-950/50 text-red-400' :
                      f.profile.status === 'UNDERLOADED' ? 'bg-yellow-950/50 text-yellow-400' :
                      'bg-[var(--primary)]/10 text-[var(--primary)]'
                    )}>{f.profile.utilization}%</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{f.designation}</p>
                  <div className="mt-2 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', f.profile.status === 'OVERLOADED' ? 'bg-red-400' : f.profile.status === 'UNDERLOADED' ? 'bg-yellow-400' : 'bg-[var(--primary)]')}
                      style={{ width: `${Math.min(100, f.profile.utilization)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected faculty controls */}
          <AnimatePresence>
            {selectedFaculty && (() => {
              const f = sandboxFaculty.find(x => x.id === selectedFaculty.id);
              if (!f) return null;
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="glass-panel rounded-2xl border border-purple-500/30 p-5 space-y-4"
                >
                  <h3 className="font-bold text-white">{f.name} — Adjustments</h3>
                  {[['theoryHours', 'Theory Hours'], ['labHours', 'Lab Hours'], ['projectHours', 'Project Hours']].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => addWorkloadHours(f.id, key, -1)} className="w-7 h-7 rounded-lg bg-red-950/30 text-red-400 border border-red-900/30 text-sm font-bold hover:bg-red-950/50 transition">−</button>
                        <span className="text-white font-mono w-6 text-center">{f.responsibilities[key] ?? 0}</span>
                        <button onClick={() => addWorkloadHours(f.id, key, 1)} className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 text-sm font-bold hover:bg-[var(--primary)]/20 transition">+</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => removeFaculty(f.id)} className="btn w-full text-red-400 border border-red-900/30 bg-red-950/20 hover:bg-red-950/40 text-xs mt-2">
                    <XCircle className="w-4 h-4" /> Remove from Sandbox
                  </button>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* Right: Analysis Panels */}
        <div className="lg:col-span-2 space-y-4">
          {/* Collision Report */}
          <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="font-bold text-white">Collision Analysis</h2>
              <span className={cn('ml-auto text-xs font-bold px-2 py-0.5 rounded-full', collisionReport.length === 0 ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-red-950/50 text-red-400')}>
                {collisionReport.length === 0 ? 'No Collisions ✓' : `${collisionReport.length} Conflicts`}
              </span>
            </div>
            <div className="p-4">
              {collisionReport.length === 0 ? (
                <div className="flex items-center justify-center py-8 gap-3 text-[var(--primary)]">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">All clear! No scheduling conflicts detected in sandbox.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {collisionReport.map((issue, i) => (
                    <div key={i} className="p-3 rounded-xl bg-red-950/30 border border-red-900/30 text-sm">
                      <span className="font-bold text-red-300">{issue.faculty}</span>
                      <span className="text-[var(--text-muted)]"> has a conflict on </span>
                      <span className="font-bold text-white">{issue.day} @ {issue.slot}</span>
                      <span className="text-[var(--text-muted)]"> in sections: {issue.sections.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Workload Distribution */}
          <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--primary)]" />
              <h2 className="font-bold text-white">Workload Distribution</h2>
            </div>
            <div className="p-4 space-y-3">
              {workloadSummary.map(f => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="text-xs text-white w-40 shrink-0 truncate">{f.name}</span>
                  <div className="flex-1 h-4 bg-[var(--surface-3)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, f.profile.utilization)}%` }}
                      className={cn('h-full rounded-full', f.profile.status === 'OVERLOADED' ? 'bg-red-400' : f.profile.status === 'UNDERLOADED' ? 'bg-yellow-400' : 'bg-[var(--primary)]')}
                    />
                  </div>
                  <span className="text-xs font-mono text-white w-20 text-right shrink-0">
                    {f.profile.effectiveWorkload}h / {f.profile.maxHours}h
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h2 className="font-bold text-white">Simulation Log</h2>
              </div>
              <button onClick={() => setLog([])} className="text-xs text-[var(--text-muted)] hover:text-white">Clear</button>
            </div>
            <div className="p-4 space-y-2 max-h-[200px] overflow-y-auto">
              {log.length === 0 && <p className="text-[var(--text-muted)] text-sm text-center py-4">No actions yet. Modify the sandbox to see the log.</p>}
              {log.map(entry => (
                <div key={entry.id} className={cn('text-xs p-2 rounded-lg border', entry.type === 'warning' ? 'bg-yellow-950/30 border-yellow-900/30 text-yellow-300' : entry.type === 'error' ? 'bg-red-950/30 border-red-900/30 text-red-300' : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)]')}>
                  <span className="font-mono text-[var(--text-muted)] mr-2">{entry.time}</span>{entry.msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 rounded-2xl flex flex-col gap-1 border border-[var(--border)]"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('w-4 h-4', color)} />
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
      </div>
      <p className={cn('text-3xl font-heading font-bold', color)}>{value}</p>
    </motion.div>
  );
}
