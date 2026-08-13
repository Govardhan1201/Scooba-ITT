import React, { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { deriveFacultyTimetables, DAYS, TEACHING_SLOTS, slotKey, DAYS_SHORT } from "../../engine/timetable";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { cn } from "../../lib/utils";

export default function FacultyTimetable() {
  const { state } = useApp();
  const me = state.currentUser;
  const myFaculty = state.faculty.find(f => f.id === me?.facultyId) ?? state.faculty.find(f => f.email === me?.email);

  const myEntries = useMemo(() => {
    if (!myFaculty) return [];
    const map = deriveFacultyTimetables(state.timetableGrids);
    return map.get(myFaculty.id) ?? [];
  }, [myFaculty, state.timetableGrids]);

  if (!myFaculty) return <div className="p-8 text-center text-[var(--text-secondary)]">Faculty profile not found.</div>;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-[var(--primary)]" />
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">My Timetable</h1>
          <p className="text-[var(--text-secondary)]">Your live published class schedule.</p>
        </div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel rounded-2xl overflow-hidden border border-[var(--border)] shadow-xl mt-6"
      >
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left min-w-[900px] border-collapse table-fixed">
            <thead>
              <tr>
                <th className="p-4 bg-[var(--surface-2)]/50 border-b border-r border-[var(--border)] w-24 text-center">
                  <div className="text-xs uppercase tracking-widest font-bold text-[var(--text-muted)]">Day</div>
                </th>
                {TEACHING_SLOTS.map(slot => (
                  <th key={slot.id} className="p-3 bg-[var(--surface-2)]/50 border-b border-r border-[var(--border)] text-center w-[14%]">
                    <div className="font-bold text-[var(--text-primary)] text-sm mb-0.5">Period {slot.period}</div>
                    <div className="text-[10px] text-[var(--primary-light)] font-mono bg-[var(--primary)]/10 inline-block px-1.5 py-0.5 rounded">{slot.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, di) => (
                <tr key={day} className="group">
                  <td className="p-4 bg-[var(--surface-2)]/30 group-hover:bg-[var(--surface-2)] border-b border-r border-[var(--border)] text-center transition-colors">
                    <span className="font-heading font-bold text-[var(--text-primary)] tracking-wide">{DAYS_SHORT[di]}</span>
                  </td>
                  {TEACHING_SLOTS.map(slot => {
                    const entry = myEntries.find(e => e.day === day && e.slotId === slot.id);
                    const subject = entry ? state.subjects.find(s => s.id === entry.subjectId) : null;
                    const section = entry ? state.sections.find(s => s.id === entry.sectionId) : null;

                    return (
                      <td key={slot.id} className="p-2 border-b border-r border-[var(--border)] bg-[var(--bg-main)]/50 align-top">
                        {entry && subject ? (
                          <div className={cn(
                            "relative h-full w-full min-h-[90px] p-2.5 rounded-xl border flex flex-col justify-between shadow-sm",
                            subject.type === 'LAB' 
                              ? "bg-purple-900/10 border-purple-500/30" 
                              : "bg-[var(--surface-2)] border-[var(--border-accent)]"
                          )}>
                             <div>
                               <div className="text-xs font-bold leading-tight text-[var(--text-primary)] mb-1">{subject.name}</div>
                               <div className="text-[10px] text-[var(--text-muted)] font-mono">{subject.code}</div>
                             </div>
                             <div className="mt-2 pt-2 border-t border-[var(--border)]/50 flex justify-between items-end">
                               <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary-light)] rounded">{section?.label}</span>
                               <span className="text-[10px] text-[var(--text-muted)]">{subject.type}</span>
                             </div>
                          </div>
                        ) : (
                          <div className="h-full w-full min-h-[90px] rounded-xl border-2 border-dashed border-transparent bg-[var(--surface-1)] opacity-30 flex items-center justify-center">
                            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Free</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
