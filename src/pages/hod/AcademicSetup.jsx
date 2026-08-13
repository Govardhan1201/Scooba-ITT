import React, { useState } from 'react';
import { useApp, ACTIONS } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BookOpen, Layers, Plus, Edit2, Trash2, X, Save, Clock, Book } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getFacultyWorkloadProfile } from '../../engine/workload';
import { deriveFacultyTimetables } from '../../engine/timetable';

function Modal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="glass-panel rounded-2xl p-6 w-full max-w-lg border border-[var(--border-accent)] shadow-2xl relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-heading font-bold text-white mb-6">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function AcademicSetup() {
  const { state, dispatch, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('FACULTY');

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Academic Setup</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage core entities like Faculty, Subjects, and Classes.</p>
      </div>

      <div className="flex gap-2 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] w-fit flex-wrap">
        {[
          { id: 'FACULTY', label: 'Faculty', icon: Users },
          { id: 'SUBJECTS', label: 'Subjects', icon: BookOpen },
          { id: 'SECTIONS', label: 'Classes / Sections', icon: Layers },
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
        {activeTab === 'FACULTY' && <FacultyManager state={state} dispatch={dispatch} showToast={showToast} />}
        {activeTab === 'SUBJECTS' && <SubjectManager state={state} dispatch={dispatch} showToast={showToast} />}
        {activeTab === 'SECTIONS' && <SectionManager state={state} dispatch={dispatch} showToast={showToast} />}
      </div>
    </div>
  );
}

function FacultyManager({ state, dispatch, showToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({ name: '', empId: '', email: '', designation: 'Assistant Professor', specialization: '' });

  const handleSave = () => {
    if (!formData.name || !formData.empId) return showToast('Name and Employee ID are required', 'error');
    
    if (editingFaculty) {
      dispatch({ type: ACTIONS.UPDATE_FACULTY, payload: { ...editingFaculty, ...formData } });
      showToast('Faculty updated successfully', 'success');
    } else {
      const newFaculty = {
        id: `FAC_${Date.now()}`,
        status: 'ACTIVE',
        skills: [],
        preferences: [],
        availability: { Monday: 'full', Tuesday: 'full', Wednesday: 'full', Thursday: 'full', Friday: 'full', Saturday: 'full' },
        responsibilities: { theoryHours: 0, labHours: 0, projectHours: 0, examHours: 0, mentoringHours: 0, deptHours: 0 },
        ...formData
      };
      dispatch({ type: ACTIONS.ADD_FACULTY, payload: newFaculty });
      showToast('Faculty added successfully', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this faculty member?')) {
      dispatch({ type: ACTIONS.DELETE_FACULTY, payload: id });
      showToast('Faculty deleted', 'success');
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold text-white">Faculty List</h2>
        <button onClick={() => { setEditingFaculty(null); setFormData({ name: '', empId: '', email: '', designation: 'Assistant Professor', specialization: '' }); setIsModalOpen(true); }} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Faculty
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.faculty.map(f => {
          const profile = getFacultyWorkloadProfile(f);
          const facultyTimetables = deriveFacultyTimetables(state.timetableGrids);
          const assignments = facultyTimetables.get(f.id) || [];
          const uniqueSubjects = [...new Set(assignments.map(a => a.subjectId))].map(id => state.subjects.find(s => s.id === id)?.name).filter(Boolean);

          return (
          <div key={f.id} className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white text-lg leading-tight">{f.name}</h3>
                <span className="text-[10px] bg-[var(--surface-3)] text-[var(--text-muted)] px-2 py-1 rounded font-mono shrink-0 ml-2">{f.empId}</span>
              </div>
              <p className="text-xs text-[var(--primary-light)] font-bold mb-3">{f.designation}</p>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>Workload: <strong className={cn(profile.effectiveWorkload > profile.maxHours ? "text-red-400" : "text-[var(--primary)]")}>{profile.effectiveWorkload}h / {profile.maxHours}h</strong></span>
                </div>
                <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                  <Book className="w-3.5 h-3.5 text-[var(--text-muted)] mt-0.5 shrink-0" />
                  <span className="line-clamp-2">Subjects: {uniqueSubjects.length > 0 ? uniqueSubjects.join(', ') : <span className="italic opacity-50">No assignments</span>}</span>
                </div>
              </div>
              
              <p className="text-[10px] text-[var(--text-muted)]">{f.specialization || 'General'}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-end gap-2">
              <button onClick={() => { setEditingFaculty(f); setFormData({ name: f.name, empId: f.empId, email: f.email, designation: f.designation, specialization: f.specialization }); setIsModalOpen(true); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(f.id)} className="p-1.5 text-[var(--text-muted)] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        )})}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingFaculty ? "Edit Faculty" : "Add Faculty"}>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-[var(--text-secondary)]">Name *</label><input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-[var(--text-secondary)]">Employee ID *</label><input type="text" className="input-field" value={formData.empId} onChange={e => setFormData({...formData, empId: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-[var(--text-secondary)]">Email</label><input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-[var(--text-secondary)]">Designation</label>
            <select className="input-field" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})}>
              <option>Professor</option><option>Associate Professor</option><option>Assistant Professor</option>
            </select>
          </div>
          <div><label className="text-xs font-bold text-[var(--text-secondary)]">Specialization</label><input type="text" className="input-field" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} /></div>
          <button onClick={handleSave} className="btn btn-primary w-full mt-4"><Save className="w-4 h-4" /> Save Faculty</button>
        </div>
      </Modal>
    </div>
  );
}

function SubjectManager({ state, dispatch, showToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'THEORY', credits: 3, hoursPerWeek: 3 });

  const handleSave = () => {
    if (!formData.name || !formData.code) return showToast('Name and Code are required', 'error');
    if (editingSubject) {
      dispatch({ type: ACTIONS.UPDATE_SUBJECT, payload: { ...editingSubject, ...formData, credits: Number(formData.credits), hoursPerWeek: Number(formData.hoursPerWeek) } });
      showToast('Subject updated successfully', 'success');
    } else {
      dispatch({ type: ACTIONS.ADD_SUBJECT, payload: { id: `SUB_${Date.now()}`, ...formData, credits: Number(formData.credits), hoursPerWeek: Number(formData.hoursPerWeek) } });
      showToast('Subject added successfully', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this subject?')) { dispatch({ type: ACTIONS.DELETE_SUBJECT, payload: id }); showToast('Subject deleted', 'success'); }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold text-white">Subject List</h2>
        <button onClick={() => { setEditingSubject(null); setFormData({ name: '', code: '', type: 'THEORY', credits: 3, hoursPerWeek: 3 }); setIsModalOpen(true); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Add Subject</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.subjects.map(s => (
          <div key={s.id} className={cn("p-4 rounded-xl border flex flex-col justify-between", s.type === 'LAB' ? "bg-purple-900/10 border-purple-500/20" : "bg-blue-900/10 border-blue-500/20")}>
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white text-lg leading-tight">{s.name}</h3>
                <span className="text-[10px] bg-[var(--surface-3)] text-white px-2 py-1 rounded font-mono shrink-0 ml-2">{s.code}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", s.type === 'LAB' ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300")}>{s.type}</span>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--surface-3)] text-[var(--text-secondary)]">{s.credits} Credits</span>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--surface-3)] text-[var(--text-secondary)]">{s.hoursPerWeek} Hrs/Wk</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-end gap-2">
              <button onClick={() => { setEditingSubject(s); setFormData({ name: s.name, code: s.code, type: s.type, credits: s.credits, hoursPerWeek: s.hoursPerWeek }); setIsModalOpen(true); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(s.id)} className="p-1.5 text-[var(--text-muted)] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSubject ? "Edit Subject" : "Add Subject"}>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-[var(--text-secondary)]">Name *</label><input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-[var(--text-secondary)]">Code *</label><input type="text" className="input-field" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
          <div><label className="text-xs font-bold text-[var(--text-secondary)]">Type</label>
            <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="THEORY">THEORY</option><option value="LAB">LAB</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-[var(--text-secondary)]">Credits</label><input type="number" min="1" className="input-field" value={formData.credits} onChange={e => setFormData({...formData, credits: e.target.value})} /></div>
            <div><label className="text-xs font-bold text-[var(--text-secondary)]">Hours / Week</label><input type="number" min="1" className="input-field" value={formData.hoursPerWeek} onChange={e => setFormData({...formData, hoursPerWeek: e.target.value})} /></div>
          </div>
          <button onClick={handleSave} className="btn btn-primary w-full mt-4"><Save className="w-4 h-4" /> Save Subject</button>
        </div>
      </Modal>
    </div>
  );
}

function SectionManager({ state, dispatch, showToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({ year: 1, section: 'A', label: '', strength: 60, deptId: 'DEPT_CSE' });

  const handleSave = () => {
    if (!formData.label) return showToast('Label is required', 'error');
    if (editingSection) {
      dispatch({ type: ACTIONS.UPDATE_SECTION, payload: { ...editingSection, ...formData, year: Number(formData.year), strength: Number(formData.strength) } });
      showToast('Section updated successfully', 'success');
    } else {
      dispatch({ type: ACTIONS.ADD_SECTION, payload: { id: `SEC_${Date.now()}`, semesterId: state.currentSemester.id, ...formData, year: Number(formData.year), strength: Number(formData.strength) } });
      showToast('Section added successfully', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this section?')) { dispatch({ type: ACTIONS.DELETE_SECTION, payload: id }); showToast('Section deleted', 'success'); }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold text-white">Sections (Classes) List</h2>
        <button onClick={() => { setEditingSection(null); setFormData({ year: 1, section: 'A', label: 'CSE - 1st Year A', strength: 60, deptId: 'DEPT_CSE' }); setIsModalOpen(true); }} className="btn btn-primary"><Plus className="w-4 h-4" /> Add Section</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.sections.map(s => (
          <div key={s.id} className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white text-lg leading-tight">{s.label}</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Year: {s.year} | Sec: {s.section}</p>
              <p className="text-xs text-[var(--text-secondary)]">Strength: {s.strength} students</p>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-end gap-2">
              <button onClick={() => { setEditingSection(s); setFormData({ year: s.year, section: s.section, label: s.label, strength: s.strength, deptId: s.deptId }); setIsModalOpen(true); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(s.id)} className="p-1.5 text-[var(--text-muted)] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSection ? "Edit Section" : "Add Section"}>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-[var(--text-secondary)]">Display Label *</label><input type="text" className="input-field" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="e.g. CSE - 2nd Year A" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-[var(--text-secondary)]">Year</label><input type="number" min="1" max="4" className="input-field" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} /></div>
            <div><label className="text-xs font-bold text-[var(--text-secondary)]">Section (A, B, C)</label><input type="text" className="input-field" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value.toUpperCase()})} /></div>
          </div>
          <div><label className="text-xs font-bold text-[var(--text-secondary)]">Strength (Number of Students)</label><input type="number" min="1" className="input-field" value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} /></div>
          <button onClick={handleSave} className="btn btn-primary w-full mt-4"><Save className="w-4 h-4" /> Save Section</button>
        </div>
      </Modal>
    </div>
  );
}
