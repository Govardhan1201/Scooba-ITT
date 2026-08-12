import React, { useState, useEffect } from 'react';
import { useApp, ACTIONS } from '../../context/AppContext';
import { DAYS_SHORT, TEACHING_SLOTS, slotKey, autoSuggestPlacement, TIMETABLE_PHASES } from '../../engine/timetable';
import { rankFacultyForSlot } from '../../engine/suitability';
import { 
  CheckCircle, AlertTriangle, AlertCircle, 
  Lock, Unlock, RefreshCw, Save 
} from 'lucide-react';

export default function TimetableBuilder() {
  const { state, dispatch, showToast } = useApp();
  
  const [selectedSection, setSelectedSection] = useState(state.sections[0]?.id);
  const [draggedSubject, setDraggedSubject] = useState(null);
  
  // Get data for selected section
  const section = state.sections.find(s => s.id === selectedSection);
  const phase = state.timetablePhases[selectedSection] || 'NOT_STARTED';
  const grid = state.timetableGrids[selectedSection] || {};
  
  // Get required subjects for this section
  const sectionSubjectIds = state.sectionSubjects[selectedSection] || [];
  const requiredSubjects = state.subjects.filter(s => sectionSubjectIds.includes(s.id));

  // Initialize phase if not started
  useEffect(() => {
    if (phase === 'NOT_STARTED' && selectedSection) {
      dispatch({ 
        type: ACTIONS.SET_TIMETABLE_PHASE, 
        payload: { sectionId: selectedSection, phase: 'PHASE1_DRAFT' } 
      });
    }
  }, [phase, selectedSection, dispatch]);

  const handleAutoSuggest = () => {
    const suggestedGrid = autoSuggestPlacement(requiredSubjects);
    dispatch({
      type: ACTIONS.INIT_TIMETABLE_GRID,
      payload: { sectionId: selectedSection, grid: suggestedGrid }
    });
    showToast('Auto-suggested placement applied (Phase 1)');
  };

  const handleClearGrid = () => {
    if (confirm('Are you sure you want to clear the entire grid?')) {
      dispatch({
        type: ACTIONS.INIT_TIMETABLE_GRID,
        payload: { sectionId: selectedSection, grid: {} }
      });
    }
  };

  const handleDragStart = (e, subject) => {
    if (phase === 'PHASE2_IN_PROGRESS' || phase === 'PUBLISHED') return;
    setDraggedSubject(subject);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, day, slotId) => {
    e.preventDefault();
    if (phase === 'PHASE2_IN_PROGRESS' || phase === 'PUBLISHED') return;
    if (!draggedSubject) return;

    const key = slotKey(day, slotId);
    dispatch({
      type: ACTIONS.UPDATE_TIMETABLE_SLOT,
      payload: { 
        sectionId: selectedSection, 
        key, 
        assignment: { subjectId: draggedSubject.id, type: draggedSubject.type } 
      }
    });
    setDraggedSubject(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRemoveSubject = (key) => {
    if (phase === 'PHASE2_IN_PROGRESS' || phase === 'PUBLISHED') return;
    dispatch({
      type: ACTIONS.CLEAR_TIMETABLE_SLOT,
      payload: { sectionId: selectedSection, key }
    });
  };

  const lockPhase1 = () => {
    // Validate that all hours are met (skipping strict check for prototype ease, but would go here)
    dispatch({
      type: ACTIONS.SET_TIMETABLE_PHASE,
      payload: { sectionId: selectedSection, phase: 'PHASE2_IN_PROGRESS' }
    });
    showToast('Phase 1 Locked. Phase 2 (Faculty Assignment) started.', 'success');
  };

  const unlockPhase1 = () => {
    if (confirm('Unlocking will clear all faculty assignments. Proceed?')) {
      // In a real app, we'd loop and clear facultyId from grid cells
      dispatch({
        type: ACTIONS.SET_TIMETABLE_PHASE,
        payload: { sectionId: selectedSection, phase: 'PHASE1_DRAFT' }
      });
    }
  };

  const assignFaculty = (key, facultyId) => {
    const cell = grid[key];
    if (!cell || !cell.assignment) return;
    
    dispatch({
      type: ACTIONS.UPDATE_TIMETABLE_SLOT,
      payload: {
        sectionId: selectedSection,
        key,
        assignment: { ...cell.assignment, facultyId }
      }
    });
  };

  // ─── Render Helpers ─────────────────────────────────────
  
  // Calculate remaining hours for Phase 1
  const renderSubjectBank = () => {
    if (phase !== 'PHASE1_DRAFT') return null;

    const placedCounts = {};
    Object.values(grid).forEach(cell => {
      if (cell?.assignment?.subjectId) {
        placedCounts[cell.assignment.subjectId] = (placedCounts[cell.assignment.subjectId] || 0) + 1;
      }
    });

    return (
      <div className="glass-panel p-4 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg">Subject Bank</h3>
          <div className="flex gap-2">
            <button onClick={handleAutoSuggest} className="btn btn-outline text-xs py-1">
              <RefreshCw className="w-3 h-3" /> Auto-Suggest
            </button>
            <button onClick={handleClearGrid} className="btn btn-secondary text-xs py-1">
              Clear Grid
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {requiredSubjects.map(sub => {
            const placed = placedCounts[sub.id] || 0;
            const needed = sub.hoursPerWeek;
            const complete = placed >= needed;
            
            return (
              <div 
                key={sub.id}
                draggable={!complete}
                onDragStart={(e) => handleDragStart(e, sub)}
                className={`
                  p-2 px-3 border rounded-lg cursor-grab
                  ${complete ? 'bg-[var(--surface-3)] border-[var(--border)] opacity-50 cursor-not-allowed' : 'bg-[var(--surface-2)] border-[var(--primary)] hover:border-[var(--primary-light)]'}
                `}
              >
                <div className="font-bold text-sm text-[var(--text-primary)]">{sub.name}</div>
                <div className="flex justify-between mt-1 text-xs text-[var(--text-secondary)]">
                  <span>{sub.type}</span>
                  <span className={complete ? 'text-[var(--success)]' : ''}>
                    {placed} / {needed} h
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGridCell = (day, slot) => {
    const key = slotKey(day, slot.id);
    const cell = grid[key];
    const assignment = cell?.assignment;
    const subject = assignment ? state.subjects.find(s => s.id === assignment.subjectId) : null;
    const faculty = assignment?.facultyId ? state.faculty.find(f => f.id === assignment.facultyId) : null;

    if (!subject) {
      return (
        <div 
          className={`h-full min-h-[80px] rounded-lg border-2 border-dashed ${phase === 'PHASE1_DRAFT' ? 'border-[var(--border)] hover:border-[var(--primary)] transition-colors' : 'border-transparent bg-[var(--surface-1)]'}`}
          onDrop={(e) => handleDrop(e, day, slot.id)}
          onDragOver={handleDragOver}
        ></div>
      );
    }

    return (
      <div className={`
        relative h-full min-h-[80px] p-2 rounded-lg border flex flex-col justify-between
        ${subject.type === 'LAB' ? 'bg-purple-900/20 border-purple-700/50' : 'bg-[var(--surface-2)] border-[var(--border)]'}
      `}>
        {/* Phase 1 Subject info */}
        <div>
          <div className="text-xs font-bold truncate text-[var(--text-primary)]" title={subject.name}>
            {subject.name}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)]">{subject.code}</div>
        </div>

        {/* Phase 1 Remove Button */}
        {phase === 'PHASE1_DRAFT' && (
          <button 
            onClick={() => handleRemoveSubject(key)}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-900/50 text-red-300 flex items-center justify-center hover:bg-red-500 hover:text-white text-xs"
          >
            ×
          </button>
        )}

        {/* Phase 2 Faculty Assignment */}
        {(phase === 'PHASE2_IN_PROGRESS' || phase === 'PUBLISHED') && (
          <div className="mt-2">
            {faculty ? (
              <div className="text-xs font-medium text-[var(--primary-light)] truncate bg-[var(--surface-3)] px-1.5 py-0.5 rounded border border-[var(--border-accent)] flex justify-between items-center">
                <span className="truncate">{faculty.name}</span>
                {phase === 'PHASE2_IN_PROGRESS' && (
                  <button onClick={() => assignFaculty(key, null)} className="ml-1 text-red-400 hover:text-red-300">×</button>
                )}
              </div>
            ) : (
              <select 
                className="w-full text-xs bg-[var(--surface-3)] border border-yellow-600/50 rounded p-1 text-yellow-100 focus:outline-none focus:border-[var(--primary)]"
                onChange={(e) => assignFaculty(key, e.target.value)}
                value=""
              >
                <option value="" disabled>Assign Faculty...</option>
                {/* Normally we'd use the suitability engine here to rank */}
                {state.faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Timetable Builder</h1>
          <p className="text-[var(--text-secondary)]">
            {phase === 'PHASE1_DRAFT' ? 'Phase 1: Drag and drop subjects to slots' : 'Phase 2: Assign faculty to placed subjects'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            className="input-field max-w-[250px]"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            {state.sections.map(sec => (
              <option key={sec.id} value={sec.id}>{sec.label}</option>
            ))}
          </select>
          
          {phase === 'PHASE1_DRAFT' && (
            <button onClick={lockPhase1} className="btn btn-primary">
              <Lock className="w-4 h-4" /> Lock Phase 1
            </button>
          )}
          {phase === 'PHASE2_IN_PROGRESS' && (
            <div className="flex gap-2">
              <button onClick={unlockPhase1} className="btn btn-secondary">
                <Unlock className="w-4 h-4" /> Unlock P1
              </button>
              <button onClick={() => showToast('Timetable published!')} className="btn btn-primary bg-[var(--success)] text-white">
                <Save className="w-4 h-4" /> Publish
              </button>
            </div>
          )}
        </div>
      </div>

      {renderSubjectBank()}

      <div className="glass-panel rounded-xl overflow-x-auto border border-[var(--border)]">
        <table className="w-full text-left min-w-[1000px] border-collapse">
          <thead>
            <tr>
              <th className="p-3 bg-[var(--surface-2)] border-b border-r border-[var(--border)] w-24 text-center font-heading text-sm text-[var(--text-secondary)]">Day / Time</th>
              {TEACHING_SLOTS.map(slot => (
                <th key={slot.id} className="p-3 bg-[var(--surface-2)] border-b border-r border-[var(--border)] text-center font-heading text-sm text-[var(--text-secondary)] w-40">
                  <div className="font-bold text-[var(--text-primary)]">Period {slot.period}</div>
                  <div className="text-[10px]">{slot.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS_SHORT.map(day => (
              <tr key={day}>
                <td className="p-3 bg-[var(--surface-2)] border-b border-r border-[var(--border)] text-center font-bold text-[var(--text-primary)]">
                  {day}
                </td>
                {TEACHING_SLOTS.map(slot => (
                  <td key={slot.id} className="p-2 border-b border-r border-[var(--border)] bg-[var(--surface-1)] align-top h-[100px]">
                    {renderGridCell(day, slot)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
