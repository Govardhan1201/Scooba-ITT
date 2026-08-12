import React, { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { getFacultyWorkloadProfile } from "../../engine/workload";
import { deriveFacultyTimetables, slotKey, DAYS, TEACHING_SLOTS } from "../../engine/timetable";
import { Zap, ArrowRight, TrendingDown, ArrowDownUp, CheckCircle, AlertTriangle } from "lucide-react";

export default function OptimizationPage() {
  const { state, workloadStats } = useApp();
  const [running, setRunning] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // Mock an intelligent "Smart Optimization" run
  const runOptimization = () => {
    setRunning(true);
    setTimeout(() => {
      // Logic for demo purposes: find overloaded and underloaded, suggest moves.
      const overloaded = workloadStats.profiles.filter(p => p.status === 'OVERLOADED');
      const underloaded = workloadStats.profiles.filter(p => p.status === 'UNDERLOADED');
      
      const recs = [];
      
      if (overloaded.length > 0 && underloaded.length > 0) {
        // Find a class from overloaded faculty that an underloaded faculty can take
        for (const ol of overloaded) {
           const olFaculty = state.faculty.find(f => f.id === ol.facultyId);
           const ttEntries = deriveFacultyTimetables(state.timetableGrids).get(ol.facultyId) || [];
           
           if (ttEntries.length > 0) {
               // Just take the first class they are teaching
               const classToMove = ttEntries[0];
               const subject = state.subjects.find(s => s.id === classToMove.subjectId);
               
               // Find an underloaded faculty who has this skill
               const suitableReplacement = underloaded.find(ul => {
                   const ulFaculty = state.faculty.find(f => f.id === ul.facultyId);
                   return ulFaculty.skills?.some(s => s.subjectId === subject?.id);
               });
               
               if (suitableReplacement) {
                   const rFaculty = state.faculty.find(f => f.id === suitableReplacement.facultyId);
                   recs.push({
                       id: `REC_${Date.now()}_${recs.length}`,
                       type: 'MOVE_CLASS',
                       fromFaculty: olFaculty,
                       toFaculty: rFaculty,
                       subject: subject,
                       sectionId: classToMove.sectionId,
                       day: classToMove.day,
                       slotLabel: classToMove.slotLabel,
                       impact: {
                           from: { before: ol.utilization, after: Math.max(0, ol.utilization - 15) },
                           to: { before: suitableReplacement.utilization, after: suitableReplacement.utilization + 15 }
                       }
                   });
               }
           }
        }
      }
      
      setRecommendations(recs);
      setRunning(false);
    }, 1500);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-[var(--primary)]" />
            Smart Optimization
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">AI-driven recommendations to balance workload</p>
        </div>
        <button 
          onClick={runOptimization} 
          disabled={running}
          className="btn btn-primary px-6 shadow-lg shadow-[var(--primary)]/20"
        >
          {running ? "Analyzing..." : "Run Optimizer"}
        </button>
      </div>
      
      {recommendations.length === 0 && !running && (
        <div className="glass-panel p-12 rounded-2xl border border-[var(--border)] text-center">
            <Zap className="w-12 h-12 text-[var(--primary)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-white mb-2">Ready to Optimize</h3>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto">Click "Run Optimizer" to analyze the current timetable and workload distribution to find balancing opportunities.</p>
        </div>
      )}
      
      {running && (
          <div className="glass-panel p-12 rounded-2xl border border-[var(--border)] text-center flex flex-col items-center">
             <div className="w-12 h-12 border-4 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin mb-4"></div>
             <p className="text-[var(--primary-light)] font-mono">Running algorithms...</p>
          </div>
      )}
      
      {!running && recommendations.length > 0 && (
          <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-4">Recommendations ({recommendations.length})</h2>
              {recommendations.map(rec => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    key={rec.id} 
                    className="glass-panel p-5 rounded-2xl border border-[var(--border)]"
                  >
                      <div className="flex items-center gap-2 mb-4">
                          <span className="px-2.5 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-2">
                              <ArrowDownUp className="w-3 h-3" /> Reallocate Class
                          </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          <div className="bg-red-950/20 p-4 rounded-xl border border-red-900/30">
                              <div className="text-xs text-red-400 font-bold mb-1">Overloaded</div>
                              <div className="text-white font-bold">{rec.fromFaculty.name}</div>
                              <div className="text-[10px] text-[var(--text-muted)] mb-3">{rec.fromFaculty.designation}</div>
                              
                              <div className="flex items-center gap-2 text-xs">
                                  <span className="line-through text-[var(--text-muted)]">{rec.impact.from.before}%</span>
                                  <ArrowRight className="w-3 h-3 text-[var(--text-secondary)]" />
                                  <span className="text-yellow-400 font-bold">{rec.impact.from.after}%</span>
                              </div>
                          </div>
                          
                          <div className="flex flex-col items-center text-center">
                              <div className="text-sm font-bold text-white mb-1">{rec.subject?.name}</div>
                              <div className="text-xs text-[var(--text-secondary)]">Section {rec.sectionId}</div>
                              <div className="text-xs text-[var(--text-muted)] font-mono mt-2 bg-[var(--surface-3)] px-2 py-1 rounded">
                                  {rec.day} · {rec.slotLabel}
                              </div>
                              <ArrowRight className="w-6 h-6 text-[var(--primary)] my-2 md:rotate-0 rotate-90" />
                          </div>
                          
                          <div className="bg-[var(--primary)]/5 p-4 rounded-xl border border-[var(--primary)]/20">
                              <div className="text-xs text-[var(--primary-light)] font-bold mb-1">Underloaded (Available)</div>
                              <div className="text-white font-bold">{rec.toFaculty.name}</div>
                              <div className="text-[10px] text-[var(--text-muted)] mb-3">{rec.toFaculty.designation}</div>
                              
                              <div className="flex items-center gap-2 text-xs">
                                  <span className="text-[var(--text-muted)]">{rec.impact.to.before}%</span>
                                  <ArrowRight className="w-3 h-3 text-[var(--text-secondary)]" />
                                  <span className="text-[var(--success)] font-bold">{rec.impact.to.after}%</span>
                              </div>
                          </div>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-[var(--border)] flex justify-end gap-3">
                          <button className="btn btn-secondary text-xs py-1.5">Dismiss</button>
                          <button className="btn btn-primary text-xs py-1.5 shadow-md shadow-[var(--primary)]/20">Apply Recommendation</button>
                      </div>
                  </motion.div>
              ))}
          </div>
      )}
    </div>
  );
}
