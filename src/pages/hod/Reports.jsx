import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getFacultyWorkloadProfile } from '../../engine/workload';
import { deriveFacultyTimetables, DAYS, TEACHING_SLOTS } from '../../engine/timetable';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { FileDown, BarChart2, Users, Calendar, BookOpen, CheckCircle } from 'lucide-react';

function downloadCSV(filename, rows) {
  const csvContent = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { state } = useApp();
  const [downloaded, setDownloaded] = useState({});

  const markDownloaded = (key) => {
    setDownloaded(p => ({ ...p, [key]: true }));
    setTimeout(() => setDownloaded(p => { const n = { ...p }; delete n[key]; return n; }), 3000);
  };

  // --- Report: Faculty Workload Summary ---
  const downloadWorkloadReport = () => {
    const headers = ['Name', 'Employee ID', 'Designation', 'Theory Hrs', 'Lab Hrs', 'Project Hrs', 'Effective Load', 'Max Hours', 'Utilization %', 'Status'];
    const rows = state.faculty.map(f => {
      const p = getFacultyWorkloadProfile(f);
      const r = f.responsibilities ?? {};
      return [f.name, f.empId, f.designation, r.theoryHours ?? 0, r.labHours ?? 0, r.projectHours ?? 0, p.effectiveWorkload, p.maxHours, p.utilization, p.status];
    });
    downloadCSV('faculty_workload_report.csv', [headers, ...rows]);
    markDownloaded('workload');
  };

  // --- Report: Timetable Grid per Section ---
  const downloadTimetableReport = () => {
    const allRows = [];
    allRows.push(['Section', 'Day', 'Period', 'Time', 'Subject Code', 'Subject Name', 'Type', 'Primary Faculty', 'Secondary Faculty']);
    state.sections.forEach(sec => {
      const grid = state.timetableGrids[sec.id] ?? {};
      DAYS.forEach(day => {
        TEACHING_SLOTS.forEach(slot => {
          const key = `${day}_${slot.id}`;
          const cell = grid[key];
          const asgn = cell?.assignment;
          if (!asgn?.subjectId) return;
          const sub = state.subjects.find(s => s.id === asgn.subjectId);
          const fac1 = state.faculty.find(f => f.id === asgn.facultyId);
          const fac2 = state.faculty.find(f => f.id === asgn.facultyId2);
          allRows.push([sec.label, day, slot.period, slot.label, sub?.code ?? '', sub?.name ?? '', sub?.type ?? '', fac1?.name ?? 'Unassigned', fac2?.name ?? '']);
        });
      });
    });
    downloadCSV('timetable_report.csv', allRows);
    markDownloaded('timetable');
  };

  // --- Report: Faculty Assignment Matrix ---
  const downloadAssignmentMatrix = () => {
    const facultyTimetables = deriveFacultyTimetables(state.timetableGrids);
    const headers = ['Faculty Name', 'Designation', ...state.sections.map(s => s.label)];
    const rows = state.faculty.map(f => {
      const entries = facultyTimetables.get(f.id) || [];
      const perSection = state.sections.map(sec => {
        const secEntries = entries.filter(e => e.sectionId === sec.id);
        const subjects = [...new Set(secEntries.map(e => e.subjectId))].map(id => state.subjects.find(s => s.id === id)?.code ?? id).join(', ');
        return subjects || '—';
      });
      return [f.name, f.designation, ...perSection];
    });
    downloadCSV('faculty_assignment_matrix.csv', [headers, ...rows]);
    markDownloaded('matrix');
  };

  // --- Report: Section Timetable Summary ---
  const downloadSectionSummary = () => {
    const headers = ['Section', 'Year', 'Total Assigned Periods', 'Total Subjects', 'Unassigned Periods', 'Status'];
    const rows = state.sections.map(sec => {
      const grid = state.timetableGrids[sec.id] ?? {};
      const allCells = Object.values(grid).filter(c => c?.assignment?.subjectId);
      const unassigned = allCells.filter(c => !c?.assignment?.facultyId).length;
      const uniqueSubs = new Set(allCells.map(c => c.assignment.subjectId)).size;
      const phase = state.timetablePhases[sec.id] ?? 'NOT_STARTED';
      return [sec.label, sec.year, allCells.length, uniqueSubs, unassigned, phase];
    });
    downloadCSV('section_timetable_summary.csv', [headers, ...rows]);
    markDownloaded('sections');
  };

  const reports = [
    {
      key: 'workload',
      title: 'Faculty Workload Report',
      description: 'Full workload breakdown per faculty member — theory, lab, project hours, effective load, utilization %, and designation status.',
      icon: BarChart2,
      color: 'from-blue-600/20 to-blue-800/10 border-blue-700/30',
      iconColor: 'text-blue-400',
      action: downloadWorkloadReport,
      filename: 'faculty_workload_report.csv',
    },
    {
      key: 'timetable',
      title: 'Full Timetable Report',
      description: 'Day-by-day, period-by-period breakdown of all sections with subject, faculty, and time slot for every assigned class.',
      icon: Calendar,
      color: 'from-emerald-600/20 to-emerald-800/10 border-emerald-700/30',
      iconColor: 'text-emerald-400',
      action: downloadTimetableReport,
      filename: 'timetable_report.csv',
    },
    {
      key: 'matrix',
      title: 'Faculty Assignment Matrix',
      description: 'Cross-reference matrix showing which faculty teaches which subjects in each section — useful for conflict detection.',
      icon: Users,
      color: 'from-purple-600/20 to-purple-800/10 border-purple-700/30',
      iconColor: 'text-purple-400',
      action: downloadAssignmentMatrix,
      filename: 'faculty_assignment_matrix.csv',
    },
    {
      key: 'sections',
      title: 'Section Timetable Summary',
      description: 'Per-section overview: total periods assigned, unassigned slots, number of subjects, and current timetable phase.',
      icon: BookOpen,
      color: 'from-orange-600/20 to-orange-800/10 border-orange-700/30',
      iconColor: 'text-orange-400',
      action: downloadSectionSummary,
      filename: 'section_timetable_summary.csv',
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/30 to-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
          <FileDown className="w-6 h-6 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Reports</h1>
          <p className="text-[var(--text-secondary)] mt-1">Generate and download data reports as CSV files for offline use.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mt-6">
        {reports.map(report => (
          <motion.div key={report.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={cn('glass-panel rounded-2xl border bg-gradient-to-br p-6 flex flex-col gap-4', report.color)}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                <report.icon className={cn('w-5 h-5', report.iconColor)} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-white">{report.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{report.description}</p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-[var(--border)]/50 flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--text-muted)]">{report.filename}</span>
              <button
                onClick={report.action}
                className={cn('btn text-sm flex items-center gap-2', downloaded[report.key] ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20' : 'btn-primary')}
              >
                {downloaded[report.key] ? <><CheckCircle className="w-4 h-4" /> Downloaded!</> : <><FileDown className="w-4 h-4" /> Download CSV</>}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
