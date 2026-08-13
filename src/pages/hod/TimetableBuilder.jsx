import React, { useState, useEffect } from 'react';
import { useApp, ACTIONS } from '../../context/AppContext';
import { DAYS, DAYS_SHORT, TEACHING_SLOTS, TIME_SLOTS, slotKey, autoSuggestPlacement, detectCollisions, PHASE_LABELS, checkPhase1Complete, checkPhase2Complete } from '../../engine/timetable';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Lock, Unlock, RefreshCw, Save, X, GripVertical, AlertCircle, Play, Users, Wand2 } from 'lucide-react';
import { getSkillMatchScore } from '../../engine/suitability';
import { getFacultyWorkloadProfile } from '../../engine/workload';

export default function TimetableBuilder() {
  const { state, dispatch, showToast } = useApp();
  
  const [selectedSection, setSelectedSection] = useState(state.sections[0]?.id);
  const [draggedSubject, setDraggedSubject] = useState(null);
  
  const section = state.sections.find(s => s.id === selectedSection);
  const phase = state.timetablePhases[selectedSection] || 'NOT_STARTED';
  const grid = state.timetableGrids[selectedSection] || {};
  
  const sectionSubjectIds = state.sectionSubjects[selectedSection] || [];
  const requiredSubjects = state.subjects.filter(s => sectionSubjectIds.includes(s.id));

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
    showToast('AI Auto-suggested placement applied for Phase 1');
  };

  const handleClearGrid = () => {
    if (confirm('Are you sure you want to clear the entire grid?')) {
      dispatch({
        type: ACTIONS.INIT_TIMETABLE_GRID,
        payload: { sectionId: selectedSection, grid: {} }
      });
    }
  };

  const handleDragStart = (e, subject, sourceKey = null) => {
    if (phase === 'PHASE2_IN_PROGRESS' || phase === 'PUBLISHED') return;
    setDraggedSubject({ ...subject, sourceKey });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', subject.id);
  };

  const handleDrop = (e, day, slotId) => {
    e.preventDefault();
    if (phase === 'PHASE2_IN_PROGRESS' || phase === 'PUBLISHED') return;
    if (!draggedSubject) return;

    const targetKey = slotKey(day, slotId);
    const targetCell = grid[targetKey];
    const sourceKey = draggedSubject.sourceKey;

    // Swap if dropping onto existing
    if (sourceKey && sourceKey !== targetKey && targetCell?.assignment) {
       dispatch({
         type: ACTIONS.UPDATE_TIMETABLE_SLOT,
         payload: { sectionId: selectedSection, key: sourceKey, assignment: targetCell.assignment }
       });
    } else if (sourceKey && sourceKey !== targetKey) {
       // Move to empty
       dispatch({
         type: ACTIONS.CLEAR_TIMETABLE_SLOT,
         payload: { sectionId: selectedSection, key: sourceKey }
       });
    }

    dispatch({
      type: ACTIONS.UPDATE_TIMETABLE_SLOT,
      payload: { 
        sectionId: selectedSection, 
        key: targetKey, 
        assignment: { subjectId: draggedSubject.id, type: draggedSubject.type, facultyId: draggedSubject.facultyId, facultyId2: draggedSubject.facultyId2 } 
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
    const { complete, missingHours } = checkPhase1Complete(grid, requiredSubjects);
    if (!complete) {
      showToast(`Phase 1 incomplete! Missing hours for: ${missingHours.map(m => m.subjectName).join(', ')}`, 'error');
      return;
    }
    dispatch({
      type: ACTIONS.SET_TIMETABLE_PHASE,
      payload: { sectionId: selectedSection, phase: 'PHASE2_IN_PROGRESS' }
    });
    showToast('Phase 1 Locked. Proceed to Phase 2 — Faculty Assignment.', 'success');
  };

  const publishTimetable = () => {
    if (!checkPhase2Complete(grid)) {
      showToast('Cannot publish: Not all subjects have a primary faculty assigned.', 'error');
      return;
    }
    if (!confirm('Publish the official timetable for this section? This finalises all assignments.')) return;
    dispatch({ type: ACTIONS.PUBLISH_TIMETABLE, payload: { sectionId: selectedSection } });
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        id: `NOTIF_${Date.now()}`, userId: 'FACULTY',
        title: 'Timetable Published',
        message: `The official timetable for ${section?.label} has been published.`,
        type: 'SUCCESS', read: false, createdAt: new Date().toISOString(),
      }
    });
    showToast(`Timetable for ${section?.label} published!`, 'success');
  };

  const submitProposal = () => {
    dispatch({
      type: ACTIONS.SUBMIT_PROPOSAL,
      payload: {
        id: `PROP_${Date.now()}`,
        sectionId: selectedSection,
        sectionLabel: section?.label,
        submittedBy: state.currentUser.name,
        timestamp: new Date().toISOString(),
        status: 'PENDING_HOD',
        gridChanges: grid, // Snapshot of the current grid
      }
    });
    showToast(`Timetable Proposal submitted to HOD for approval!`, 'success');
  };

  const unlockPhase1 = () => {
    if (confirm('Unlock Phase 1? Your faculty assignments will remain intact, but you can swap subjects.')) {
      dispatch({
        type: ACTIONS.SET_TIMETABLE_PHASE,
        payload: { sectionId: selectedSection, phase: 'PHASE1_DRAFT' }
      });
    }
  };

  const handleSmartAllocate = () => {
    let assignmentsMade = 0;
    const currentGrid = { ...grid };
    
    // Calculate current workloads for tracking
    const facultyLoads = {};
    state.faculty.forEach(f => {
      const profile = getFacultyWorkloadProfile(f);
      facultyLoads[f.id] = { current: profile.effectiveWorkload, max: profile.maxHours };
    });

    Object.entries(currentGrid).forEach(([key, cell]) => {
      if (!cell?.assignment?.subjectId || cell.assignment.facultyId) return;
      
      const subject = state.subjects.find(s => s.id === cell.assignment.subjectId);
      if (!subject) return;

      const [day, slotId] = key.split('_');
      
      // Find eligible faculty
      let bestFaculty = null;
      let highestScore = -1;

      for (const f of state.faculty) {
        // Check collision
        const collisions = detectCollisions(state.timetableGrids, f.id, day, isNaN(slotId) ? slotId : Number(slotId));
        if (collisions.length > 0) continue;
        
        // Check workload limit
        const hoursToAdd = subject.hoursPerWeek || 3;
        if (facultyLoads[f.id].current + hoursToAdd > facultyLoads[f.id].max) continue;
        
        // Calculate score
        const score = getSkillMatchScore(f, subject.id);
        if (score > highestScore) {
          highestScore = score;
          bestFaculty = f;
        }
      }

      if (bestFaculty) {
        assignFaculty(key, bestFaculty.id);
        facultyLoads[bestFaculty.id].current += (subject.hoursPerWeek || 3);
        assignmentsMade++;
      }
    });

    if (assignmentsMade > 0) showToast(`Smart Allocation assigned ${assignmentsMade} slots!`, 'success');
    else showToast('Could not allocate any more slots due to constraints.', 'warning');
  };

  const assignFaculty = (key, facultyId, isSecondary = false) => {
    const cell = grid[key];
    if (!cell || !cell.assignment) return;

    if (facultyId) {
      const [day, slotIdStr] = key.split('_');
      const slotId = isNaN(slotIdStr) ? slotIdStr : Number(slotIdStr);
      
      const collisions = detectCollisions(state.timetableGrids, facultyId, day, slotId);
      if (collisions.length > 0) {
        const conflictSection = state.sections.find(s => s.id === collisions[0].sectionId);
        showToast(`Collision Detected: Faculty is already teaching in ${conflictSection?.label} at this time.`, 'error');
        return; 
      }
    }

    const assignmentUpdate = { ...cell.assignment };
    if (isSecondary) assignmentUpdate.facultyId2 = facultyId;
    else assignmentUpdate.facultyId = facultyId;

    dispatch({
      type: ACTIONS.UPDATE_TIMETABLE_SLOT,
      payload: { sectionId: selectedSection, key, assignment: assignmentUpdate }
    });
    
    // Auto-default for same subject in this section
    if (facultyId && !isSecondary) {
      Object.entries(grid).forEach(([gKey, gCell]) => {
         if (gKey !== key && gCell?.assignment?.subjectId === cell.assignment.subjectId && !gCell.assignment.facultyId) {
             dispatch({
               type: ACTIONS.UPDATE_TIMETABLE_SLOT,
               payload: { sectionId: selectedSection, key: gKey, assignment: { ...gCell.assignment, facultyId } }
             });
         }
      });
    }

    if (facultyId) showToast('Faculty Assigned', 'success', 2000);
  };

  // Calculate remaining hours
  const placedCounts = {};
  Object.values(grid).forEach(cell => {
    if (cell?.assignment?.subjectId) {
      placedCounts[cell.assignment.subjectId] = (placedCounts[cell.assignment.subjectId] || 0) + 1;
    }
  });

  const renderSubjectBank = () => {
    if (phase !== 'PHASE1_DRAFT') return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-2xl mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-[80px]"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 relative z-10 gap-4">
          <div>
            <h3 className="font-heading font-bold text-xl text-white">Subject Bank</h3>
            <p className="text-sm text-[var(--text-secondary)]">Drag subjects to the timetable slots</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAutoSuggest} className="btn btn-outline hover:bg-[var(--primary)]/10 text-sm shadow-sm group">
              <SparklesIcon className="w-4 h-4 text-[var(--primary)] group-hover:rotate-12 transition-transform" /> 
              AI Auto-Suggest
            </button>
            <button onClick={handleClearGrid} className="btn btn-secondary text-sm">
              Clear Grid
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          {requiredSubjects.map(sub => {
            const placed = placedCounts[sub.id] || 0;
            const needed = sub.hoursPerWeek;
            const complete = placed >= needed;
            
            return (
              <motion.div 
                whileHover={!complete ? { scale: 1.05, y: -2 } : {}}
                whileTap={!complete ? { scale: 0.95 } : {}}
                key={sub.id}
                draggable={!complete}
                onDragStart={(e) => handleDragStart(e, sub)}
                className={cn(
                  "p-3 pr-4 rounded-xl border flex gap-3 shadow-sm select-none",
                  complete 
                    ? "bg-[var(--surface-3)] border-[var(--border)] opacity-60 cursor-not-allowed" 
                    : "bg-[var(--surface-1)] border-[var(--border-accent)] cursor-grab active:cursor-grabbing hover:border-[var(--primary)] hover:shadow-[var(--primary)]/10"
                )}
              >
                <div className={cn("flex flex-col justify-center items-center w-6 opacity-50", complete && "hidden")}>
                  <GripVertical className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)] mb-1">{sub.name}</div>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px]", sub.type === 'LAB' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300')}>
                      {sub.type}
                    </span>
                    <span className={cn(complete ? 'text-[var(--success)] font-bold' : 'text-[var(--text-secondary)]')}>
                      {placed} / {needed} hrs
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
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
          className={cn(
            "h-full w-full min-h-[90px] rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center relative group",
            phase === 'PHASE1_DRAFT' 
              ? draggedSubject ? "border-[var(--primary)]/30 bg-[var(--primary)]/5" : "border-[var(--border)] hover:border-[var(--primary)]/50" 
              : "border-transparent bg-[var(--surface-1)] opacity-50"
          )}
          onDrop={(e) => handleDrop(e, day, slot.id)}
          onDragOver={handleDragOver}
        >
          {phase === 'PHASE1_DRAFT' && !draggedSubject && (
            <div className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)] rounded-xl flex items-center justify-center transition-opacity">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Drop Here</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <motion.div 
        layoutId={`cell-${key}`}
        draggable={phase === 'PHASE1_DRAFT'}
        onDragStart={(e) => handleDragStart(e, { id: subject.id, type: subject.type, facultyId: assignment.facultyId, facultyId2: assignment.facultyId2 }, key)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "relative h-full w-full min-h-[90px] p-2.5 rounded-xl border flex flex-col justify-between group shadow-sm transition-colors",
          phase === 'PHASE1_DRAFT' && "cursor-grab active:cursor-grabbing",
          subject.type === 'LAB' 
            ? "bg-purple-900/10 border-purple-500/30 hover:border-purple-500/60" 
            : "bg-[var(--surface-2)] border-[var(--border-accent)] hover:border-[var(--primary)]/60"
        )}
      >
        <div>
          <div className="text-xs font-bold leading-tight text-[var(--text-primary)] mb-1 line-clamp-2" title={subject.name}>
            {subject.name}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">{subject.code}</div>
        </div>

        {phase === 'PHASE1_DRAFT' && (
          <button 
            onClick={() => handleRemoveSubject(key)}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all shadow-md z-10"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {(phase === 'PHASE2_IN_PROGRESS' || phase === 'PUBLISHED') && (
          <div className="mt-2 pt-2 border-t border-[var(--border)]/50 space-y-1">
            {/* Primary Faculty */}
            <div className="group/dropdown relative">
              {faculty ? (
                <div className="flex items-center justify-between gap-1 bg-[var(--surface-1)] rounded px-1.5 py-1 border border-[var(--primary)]/20 text-xs">
                  <span className="truncate text-[var(--primary-light)] font-semibold">{faculty.name}</span>
                  {phase === 'PHASE2_IN_PROGRESS' && (
                    <button onClick={() => assignFaculty(key, null)} className="text-[var(--text-muted)] hover:text-red-400 shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <select 
                  className="w-full text-[10px] bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded py-1 px-1 text-[var(--warning)] font-medium focus:outline-none appearance-none cursor-pointer"
                  onChange={(e) => assignFaculty(key, e.target.value)}
                  value=""
                >
                  <option value="" disabled>Primary Faculty...</option>
                  {state.faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              )}
              {/* Hover Dropdown Override */}
              {faculty && phase === 'PHASE2_IN_PROGRESS' && (
                 <div className="absolute inset-0 opacity-0 group-hover/dropdown:opacity-100 transition-opacity z-20 bg-[var(--surface-1)] border border-[var(--primary)] rounded flex items-center">
                   <select 
                    className="w-full h-full text-[10px] bg-transparent text-[var(--primary-light)] font-medium focus:outline-none appearance-none cursor-pointer px-1"
                    onChange={(e) => assignFaculty(key, e.target.value)}
                    value={faculty.id}
                   >
                     {state.faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                   </select>
                 </div>
              )}
            </div>

            {/* Secondary Faculty (LAB ONLY) */}
            {subject.type === 'LAB' && (
              <div className="group/dropdown2 relative">
                {assignment.facultyId2 ? (
                  <div className="flex items-center justify-between gap-1 bg-purple-900/20 rounded px-1.5 py-1 border border-purple-500/20 text-xs">
                    <span className="truncate text-purple-300 font-semibold">{state.faculty.find(f => f.id === assignment.facultyId2)?.name}</span>
                    {phase === 'PHASE2_IN_PROGRESS' && (
                      <button onClick={() => assignFaculty(key, null, true)} className="text-[var(--text-muted)] hover:text-red-400 shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  phase === 'PHASE2_IN_PROGRESS' && (
                    <select 
                      className="w-full text-[10px] bg-purple-900/10 border border-purple-500/30 rounded py-1 px-1 text-purple-300 font-medium focus:outline-none appearance-none cursor-pointer"
                      onChange={(e) => assignFaculty(key, e.target.value, true)}
                      value=""
                    >
                      <option value="" disabled>Secondary Faculty...</option>
                      {state.faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )
                )}
                 {/* Hover Dropdown Override for Secondary */}
                {assignment.facultyId2 && phase === 'PHASE2_IN_PROGRESS' && (
                   <div className="absolute inset-0 opacity-0 group-hover/dropdown2:opacity-100 transition-opacity z-20 bg-[var(--surface-1)] border border-purple-500 rounded flex items-center">
                     <select 
                      className="w-full h-full text-[10px] bg-transparent text-purple-300 font-medium focus:outline-none appearance-none cursor-pointer px-1"
                      onChange={(e) => assignFaculty(key, e.target.value, true)}
                      value={assignment.facultyId2}
                     >
                       {state.faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                     </select>
                   </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-[1600px] mx-auto pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Timetable Builder</h1>
          <p className="text-[var(--text-secondary)] mt-1 flex items-center gap-2">
            {phase === 'PHASE1_DRAFT' 
              ? <><div className="w-2 h-2 rounded-full bg-[var(--info)]"></div> Phase 1: Subject Placement</>
              : <><div className="w-2 h-2 rounded-full bg-[var(--warning)]"></div> Phase 2: Faculty Assignment</>
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="input-field max-w-[250px] shadow-sm font-medium"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            {state.sections.map(sec => (
              <option key={sec.id} value={sec.id}>{sec.label}</option>
            ))}
          </select>
          
          {phase === 'PHASE1_DRAFT' && (
            <button onClick={lockPhase1} className="btn btn-primary shadow-lg shadow-[var(--primary)]/20">
              <Lock className="w-4 h-4" /> Lock Phase 1
            </button>
          )}
          {phase === 'PHASE2_IN_PROGRESS' && (
            <div className="flex gap-2">
              <button onClick={handleSmartAllocate} className="btn bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20">
                <Wand2 className="w-4 h-4" /> Smart Allocate
              </button>
              <button onClick={unlockPhase1} className="btn btn-outline bg-[var(--surface-2)]">
                <Unlock className="w-4 h-4" /> Unlock P1
              </button>
              {state.currentUser.role === 'ASST_HOD' ? (
                <button onClick={submitProposal} className="btn bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20">
                  <Save className="w-4 h-4" /> Submit Proposal
                </button>
              ) : (
                <button onClick={publishTimetable} className="btn bg-[var(--success)] text-white shadow-lg shadow-[var(--success)]/20 hover:bg-emerald-500">
                  <Save className="w-4 h-4" /> Publish Timetable
                </button>
              )}
            </div>
          )}
          {phase === 'PUBLISHED' && (
            <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2">
              <Save className="w-4 h-4" /> Published
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {renderSubjectBank()}
      </AnimatePresence>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-2xl overflow-hidden border border-[var(--border)] shadow-xl"
      >
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left min-w-[1100px] border-collapse table-fixed">
            <thead>
              <tr>
                <th className="p-4 bg-[var(--surface-2)]/50 border-b border-r border-[var(--border)] w-24 text-center">
                  <div className="text-xs uppercase tracking-widest font-bold text-[var(--text-muted)]">Day</div>
                </th>
                {TIME_SLOTS.map(slot => (
                  <th key={slot.id} className="p-3 bg-[var(--surface-2)]/50 border-b border-r border-[var(--border)] text-center w-[11%]">
                    {slot.period 
                      ? <div className="font-bold text-[var(--text-primary)] text-sm mb-0.5">Period {slot.period}</div>
                      : <div className="font-bold text-[var(--warning)] text-sm mb-0.5">{slot.id}</div>
                    }
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
                  {TIME_SLOTS.map(slot => (
                    <td key={slot.id} className={cn("p-2 border-b border-r border-[var(--border)] align-top", slot.type !== 'NORMAL' ? 'bg-[var(--surface-3)]/30' : 'bg-[var(--bg-main)]/50')}>
                      {slot.type === 'NORMAL' ? renderGridCell(day, slot) : (
                         <div className="h-full flex items-center justify-center min-h-[90px]">
                           <span className="text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase rotate-[-90deg] whitespace-nowrap opacity-50">{slot.type}</span>
                         </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SparklesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
      <path d="M20 3v4"/>
      <path d="M22 5h-4"/>
      <path d="M4 17v2"/>
      <path d="M5 18H3"/>
    </svg>
  );
}
