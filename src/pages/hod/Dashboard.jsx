import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { 
  Users, AlertTriangle, TrendingUp, CheckSquare, 
  Activity, ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Dashboard() {
  const { state, workloadStats, pendingApprovals } = useApp();
  const role = state.currentUser?.role;
  const dashTitle = role === 'HOD' ? 'HOD Dashboard' : role === 'ASST_HOD' ? 'Assistant HOD Dashboard' : 'Dashboard';
  const pendingAbsences = state.absences.filter(a => a.status === 'PENDING_HOD').length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">{dashTitle}</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm md:text-base">Overview of academic health and workload distribution</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary shadow-lg">View Reports</button>
          <button className="btn btn-primary shadow-lg shadow-[var(--primary)]/20 group">
            <Activity className="w-4 h-4 mr-2" />
            Smart Optimization
            <ArrowRight className="w-4 h-4 ml-1 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-1 transition-all" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard 
          title="Total Faculty" 
          value={workloadStats.total} 
          icon={Users} 
          color="var(--info)" 
          bgClass="from-[var(--info)]/20 to-[var(--surface-2)] border-[var(--info)]/30"
        />
        <KPICard 
          title="Overloaded" 
          value={workloadStats.overloaded} 
          icon={AlertTriangle} 
          color="var(--danger)" 
          bgClass="from-[var(--danger)]/20 to-[var(--surface-2)] border-[var(--danger)]/30"
        />
        <KPICard 
          title="Balanced" 
          value={workloadStats.balanced} 
          icon={TrendingUp} 
          color="var(--success)" 
          bgClass="from-[var(--success)]/20 to-[var(--surface-2)] border-[var(--success)]/30"
        />
        <KPICard 
          title="Pending Approvals" 
          value={pendingAbsences} 
          icon={CheckSquare} 
          color="var(--warning)" 
          bgClass="from-[var(--warning)]/20 to-[var(--surface-2)] border-[var(--warning)]/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fairness Score */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-[40px] group-hover:bg-[var(--primary)]/20 transition-all"></div>
          
          <h3 className="text-lg font-heading font-semibold w-full text-left mb-6 flex items-center justify-between">
            Department Fairness
            <span className="text-xs px-2 py-1 bg-[var(--surface-3)] rounded-full text-[var(--text-secondary)]">Live</span>
          </h3>
          
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full text-[var(--primary)] drop-shadow-[0_0_15px_rgba(22,160,133,0.4)]">
              <path
                className="text-[var(--surface-3)]"
                strokeWidth="2.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${workloadStats.fairnessScore}, 100` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="text-current drop-shadow-md"
                strokeWidth="2.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="text-5xl font-bold font-mono text-white tracking-tighter"
              >
                {workloadStats.fairnessScore}
              </motion.span>
              <span className="text-xs text-[var(--text-secondary)] uppercase tracking-widest font-bold mt-1">Score</span>
            </div>
          </div>
          
          <p className="text-center text-sm text-[var(--text-muted)] mt-6 px-4">
            A score of 100 indicates perfect workload distribution across all faculty members.
          </p>
        </motion.div>

        {/* Timetable Status */}
        <motion.div variants={itemVariants} className="glass-panel p-6 rounded-2xl col-span-1 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-heading font-semibold">Timetable Progress</h3>
            <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-light)] font-medium">View All</button>
          </div>
          
          <div className="space-y-4 flex-1">
            {Object.entries(state.timetablePhases).map(([sectionId, phase], idx) => {
              const section = state.sections.find(s => s.id === sectionId);
              if (!section) return null;
              
              let config = { bg: 'bg-[var(--surface-3)]', text: 'text-[var(--text-secondary)]', border: 'border-[var(--border)]', label: phase.replace(/_/g, ' ') };
              if (phase === 'PHASE1_DRAFT') config = { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Phase 1: Subjects' };
              if (phase === 'PHASE2_IN_PROGRESS') config = { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Phase 2: Faculty' };
              if (phase === 'PUBLISHED') config = { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Published' };

              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.1) }}
                  key={sectionId} 
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-accent)] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-2 h-10 rounded-full", config.bg.replace('/10', '/50'))}></div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary-light)] transition-colors">{section.label}</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">{section.strength} Students</p>
                    </div>
                  </div>
                  <div className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2", config.bg, config.text, config.border)}>
                    {phase === 'PUBLISHED' && <CheckSquare className="w-3 h-3" />}
                    {config.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function KPICard({ title, value, icon: Icon, color, bgClass }) {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "glass-panel p-5 rounded-2xl border-t bg-gradient-to-b relative overflow-hidden group",
        bgClass
      )}
    >
      <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity" style={{ color }}>
        <Icon className="w-24 h-24" />
      </div>
      <div className="flex flex-col relative z-10 h-full justify-between">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
          <div className="p-2 rounded-lg bg-[var(--surface-3)]/50 backdrop-blur-md" style={{ color }}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <h3 className="text-4xl font-bold font-mono tracking-tight text-white">{value}</h3>
      </div>
    </motion.div>
  );
}
