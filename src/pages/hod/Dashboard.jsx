import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, BookOpen, Layers, CheckSquare, 
  AlertTriangle, TrendingUp, HeartPulse
} from 'lucide-react';

export default function Dashboard() {
  const { state, workloadStats, pendingApprovals } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">HOD Dashboard</h1>
          <p className="text-[var(--text-secondary)]">Overview of academic health and workload</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline">View Reports</button>
          <button className="btn btn-primary">Smart Optimization</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-[var(--info)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Total Faculty</p>
              <h3 className="text-3xl font-bold font-mono">{workloadStats.total}</h3>
            </div>
            <div className="p-2 bg-[var(--surface-3)] rounded-lg text-[var(--info)]">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
        
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-[var(--danger)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Overloaded Faculty</p>
              <h3 className="text-3xl font-bold font-mono">{workloadStats.overloaded}</h3>
            </div>
            <div className="p-2 bg-[var(--surface-3)] rounded-lg text-[var(--danger)]">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-[var(--success)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Balanced Faculty</p>
              <h3 className="text-3xl font-bold font-mono">{workloadStats.balanced}</h3>
            </div>
            <div className="p-2 bg-[var(--surface-3)] rounded-lg text-[var(--success)]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-[var(--warning)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Pending Approvals</p>
              <h3 className="text-3xl font-bold font-mono">{pendingApprovals.total}</h3>
            </div>
            <div className="p-2 bg-[var(--surface-3)] rounded-lg text-[var(--warning)]">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fairness Score */}
        <div className="glass-panel p-6 rounded-xl flex flex-col items-center justify-center">
          <h3 className="text-lg font-heading font-semibold w-full text-left mb-6">Department Fairness</h3>
          
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Simple CSS placeholder for a gauge chart */}
            <svg viewBox="0 0 36 36" className="w-full h-full text-[var(--primary)]">
              <path
                className="text-[var(--surface-3)]"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-current"
                strokeDasharray={`${workloadStats.fairnessScore}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-mono">{workloadStats.fairnessScore}</span>
              <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Score</span>
            </div>
          </div>
          
          <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
            A score of 100 indicates perfect workload distribution across all faculty members.
          </p>
        </div>

        {/* Timetable Status */}
        <div className="glass-panel p-6 rounded-xl col-span-2">
          <h3 className="text-lg font-heading font-semibold mb-4">Timetable Progress</h3>
          
          <div className="space-y-4">
            {Object.entries(state.timetablePhases).map(([sectionId, phase]) => {
              const section = state.sections.find(s => s.id === sectionId);
              if (!section) return null;
              
              let color = 'bg-[var(--surface-3)] text-[var(--text-secondary)]';
              if (phase === 'PHASE1_DRAFT') color = 'bg-blue-900/40 text-blue-300 border-blue-700/50';
              if (phase === 'PHASE2_IN_PROGRESS') color = 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50';
              if (phase === 'PUBLISHED') color = 'bg-green-900/40 text-green-300 border-green-700/50';

              return (
                <div key={sectionId} className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)]">{section.label}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{section.strength} Students</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${color}`}>
                    {phase.replace(/_/g, ' ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
