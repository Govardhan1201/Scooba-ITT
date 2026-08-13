import React, { useState } from 'react';
import { useApp, ACTIONS } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Shield, Archive, Save, Plus, KeyRound, Copy, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Settings() {
  const { state, dispatch, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('GENERAL');

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white tracking-tight">System Configuration</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage global rules, settings, and semester lifecycles.</p>
      </div>

      <div className="flex gap-2 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] w-fit flex-wrap">
        {[
          { id: 'GENERAL', label: 'General', icon: SettingsIcon },
          { id: 'RULES', label: 'Timetable Rules', icon: Shield },
          { id: 'SEMESTERS', label: 'Semester Archival', icon: Archive },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all",
              activeTab === t.id ? "bg-[var(--primary)] text-black shadow-md" : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-3)]"
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'GENERAL' && <GeneralSettings state={state} dispatch={dispatch} showToast={showToast} />}
        {activeTab === 'RULES' && <RulesSettings state={state} dispatch={dispatch} showToast={showToast} />}
        {activeTab === 'SEMESTERS' && <SemesterSettings state={state} dispatch={dispatch} showToast={showToast} />}
      </div>
    </div>
  );
}

function GeneralSettings({ state, dispatch, showToast }) {
  const [formData, setFormData] = useState(state.settings);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    dispatch({ type: ACTIONS.UPDATE_SETTINGS, payload: formData });
    showToast('General settings updated', 'success');
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const code = `${part()}-${part()}`;
    dispatch({ type: ACTIONS.GENERATE_ACCESS_CODE, payload: code });
    showToast(`Access code generated: ${code}`, 'success');
  };

  const copyCode = () => {
    if (state.asstHodAccessCode) {
      navigator.clipboard.writeText(state.asstHodAccessCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] space-y-8">
      <div className="space-y-4 max-w-2xl">
        <h2 className="text-xl font-bold text-white">General Information</h2>
        <div><label className="text-xs font-bold text-[var(--text-secondary)]">Institution Name</label><input type="text" className="input-field mt-1" value={formData.institutionName} onChange={e => setFormData({...formData, institutionName: e.target.value})} /></div>
        <div><label className="text-xs font-bold text-[var(--text-secondary)]">Department Name</label><input type="text" className="input-field mt-1" value={formData.departmentName} onChange={e => setFormData({...formData, departmentName: e.target.value})} /></div>
        <div><label className="text-xs font-bold text-[var(--text-secondary)]">Academic Year</label><input type="text" className="input-field mt-1" value={formData.academicYear || ''} onChange={e => setFormData({...formData, academicYear: e.target.value})} /></div>
        <button onClick={handleSave} className="btn btn-primary">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>

      {/* Asst HOD Access Code */}
      <div className="border-t border-[var(--border)] pt-6 space-y-4 max-w-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><KeyRound className="w-5 h-5 text-[var(--accent)]" /> Assistant HOD Access Code</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Generate a one-time access code to share with your Assistant HOD. They must enter this code on their first login to unlock the portal.</p>
        </div>

        {state.asstHodAccessCode ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-[var(--surface-3)] rounded-xl px-5 py-4 font-mono text-2xl tracking-[0.4em] text-[var(--primary)] border border-[var(--primary)]/30 text-center">
              {state.asstHodAccessCode}
            </div>
            <button onClick={copyCode} className={cn("btn shrink-0", copied ? "bg-[var(--success)] text-white" : "btn-secondary")}>
              <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={generateCode} title="Regenerate" className="btn btn-secondary shrink-0">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={generateCode} className="btn bg-[var(--accent)] text-black font-bold shadow-md shadow-[var(--accent)]/20">
            <KeyRound className="w-4 h-4" /> Generate Access Code for Asst. HOD
          </button>
        )}

        {state.asstHodUnlocked && (
          <p className="text-xs text-[var(--primary)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] inline-block"></span>
            Asst. HOD portal is currently unlocked in this session.
          </p>
        )}
      </div>
    </div>
  );
}

function RulesSettings({ state, dispatch, showToast }) {
  const [formData, setFormData] = useState(state.rules);

  const handleSave = () => {
    dispatch({ type: ACTIONS.UPDATE_RULES, payload: formData });
    showToast('Timetable rules updated', 'success');
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] space-y-6">
      <h2 className="text-xl font-bold text-white">Timetable AI Constraints</h2>
      <p className="text-[var(--text-secondary)] text-sm">These rules govern the collision detection engine and Smart Optimization suggestions.</p>
      
      <div className="space-y-6 max-w-2xl">
        <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
          <h3 className="font-bold text-white mb-4">Faculty Limits</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">Max Continuous Hours (before break)</label>
              <input type="number" className="input-field mt-1" value={formData.maxContinuousHours} onChange={e => setFormData({...formData, maxContinuousHours: Number(e.target.value)})} />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">Max Daily Hours per Faculty</label>
              <input type="number" className="input-field mt-1" value={formData.maxDailyHoursPerFaculty} onChange={e => setFormData({...formData, maxDailyHoursPerFaculty: Number(e.target.value)})} />
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Allow Split Classes</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Allow 2-hour labs to be split across different days.</p>
          </div>
          <button 
            onClick={() => setFormData({...formData, allowSplitClasses: !formData.allowSplitClasses})}
            className={cn("w-12 h-6 rounded-full transition-colors relative", formData.allowSplitClasses ? "bg-[var(--primary)]" : "bg-[var(--border)]")}
          >
            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", formData.allowSplitClasses ? "left-7" : "left-1")}></div>
          </button>
        </div>
        
        <button onClick={handleSave} className="btn btn-primary mt-4">
          <Save className="w-4 h-4" /> Save Rules
        </button>
      </div>
    </div>
  );
}

function SemesterSettings({ state, dispatch, showToast }) {
  
  const handleArchive = (semester) => {
    if (confirm(`Are you sure you want to archive ${semester.name}? This will lock all timetables and workloads.`)) {
      dispatch({ type: ACTIONS.UPDATE_SEMESTER, payload: { ...semester, status: 'COMPLETED' } });
      
      // Update timetable phases to ARCHIVED
      Object.keys(state.timetablePhases).forEach(sectionId => {
         dispatch({ type: ACTIONS.SET_TIMETABLE_PHASE, payload: { sectionId, phase: 'ARCHIVED' } });
      });

      showToast(`Semester ${semester.name} has been archived.`, 'success');
    }
  };

  const handleStartNew = () => {
    const nextSem = prompt("Enter new semester name (e.g., Even Semester 2026-27):");
    if (nextSem) {
      const newSemester = { id: `SEM_${Date.now()}`, name: nextSem, status: 'ACTIVE' };
      dispatch({ type: ACTIONS.ADD_SEMESTER, payload: newSemester });
      dispatch({ type: ACTIONS.SET_CURRENT_SEMESTER, payload: newSemester });
      showToast(`Started new semester: ${nextSem}`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-xl font-bold text-white">Semester Lifecycle</h2>
          <button onClick={handleStartNew} className="btn btn-primary"><Plus className="w-4 h-4" /> Start New Semester</button>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">Archiving a semester preserves all assignments and workloads as read-only historical data. Starting a new semester provides a blank timetable slate while retaining faculty and subject master data.</p>
        
        <div className="space-y-4 mt-4">
          {state.semesters.map(s => (
            <div key={s.id} className={cn("p-4 rounded-xl border flex items-center justify-between flex-wrap gap-4", s.status === 'ACTIVE' ? "bg-[var(--primary)]/10 border-[var(--primary)]/30" : "bg-[var(--surface-2)] border-[var(--border)]")}>
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  {s.name}
                  {s.status === 'ACTIVE' && <span className="text-[10px] bg-[var(--primary)] text-black px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Active</span>}
                  {s.status === 'COMPLETED' && <span className="text-[10px] bg-[var(--surface-3)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Archived</span>}
                </h3>
              </div>
              
              {s.status === 'ACTIVE' && (
                <button onClick={() => handleArchive(s)} className="btn bg-red-950/50 text-red-400 border border-red-900/50 hover:bg-red-900/50">
                  <Archive className="w-4 h-4" /> Archive Semester
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
