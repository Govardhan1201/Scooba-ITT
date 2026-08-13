import React, { useState, useMemo } from "react";
import { useApp, ACTIONS } from "../../context/AppContext";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { getFacultyWorkloadProfile } from "../../engine/workload";
import { User, Edit2, Save, BookOpen, TrendingUp, CheckCircle, AlertTriangle, Mail, Hash, Award, X, Phone, Building, Briefcase, Plus } from "lucide-react";

const DESIGNATIONS = ["Professor", "Associate Professor", "Assistant Professor"];
const DEPARTMENTS = ["Computer Science Engineering", "Information Technology", "Electronics", "Mechanical", "Civil"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

// Validation
const BAD_WORDS = ['spam','hack','root','null','undefined','test123'];
const hasBadWords = (s) => BAD_WORDS.some(w => (s||'').toLowerCase().includes(w));
const phoneRe = /^[0-9+\-\s()]{10,15}$/;

export default function FacultyProfile() {
  const { state, dispatch, showToast } = useApp();
  const me = state.currentUser;
  const myFaculty = state.faculty.find(f => f.id === me?.facultyId) ?? state.faculty.find(f => f.email === me?.email);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState("");

  const profile = useMemo(() => {
    if (!myFaculty) return null;
    return getFacultyWorkloadProfile(myFaculty, state.settings.workloadWeights, {
      overloaded: state.settings.workloadThresholds.overloaded,
      balanced: { min: state.settings.workloadThresholds.balancedMin, max: state.settings.workloadThresholds.balancedMax },
      underloaded: state.settings.workloadThresholds.balancedMin,
    });
  }, [myFaculty, state.settings]);

  if (!myFaculty) return (
    <div className="p-8 text-[var(--text-secondary)]">Faculty profile not found. Contact HOD.</div>
  );

  const startEdit = () => {
    setFormData({
      name: myFaculty.name,
      email: myFaculty.email,
      empId: myFaculty.empId,
      phone: myFaculty.phone || '',
      department: myFaculty.department || 'Computer Science Engineering',
      designation: myFaculty.designation || 'Assistant Professor',
      gender: myFaculty.gender || 'Prefer not to say',
      age: myFaculty.age || '',
      qualifications: myFaculty.qualifications || [],
      experienceOverall: myFaculty.experienceOverall || 0,
      experienceVIIT: myFaculty.experienceVIIT || 0,
      specialization: myFaculty.specialization || '',
    });
    setErrors({});
    setEditing(true);
  };

  const set = (field) => (e) => {
    setFormData(f => ({ ...f, [field]: e.target.value }));
    setErrors(err => ({ ...err, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (hasBadWords(formData.name)) e.name = "Contains unauthorized keywords.";
    if (formData.phone && !phoneRe.test(formData.phone)) e.phone = "Invalid phone number.";
    const ageNum = parseInt(formData.age, 10);
    if (formData.age && (isNaN(ageNum) || ageNum < 18 || ageNum > 100)) e.age = "Enter a valid age.";
    
    const expO = parseFloat(formData.experienceOverall);
    if (isNaN(expO) || expO < 0 || expO > 60) e.experienceOverall = "Invalid overall experience.";
    
    const expV = parseFloat(formData.experienceVIIT);
    if (isNaN(expV) || expV < 0 || expV > 60) e.experienceVIIT = "Invalid VIIT experience.";
    
    if (expV > expO) e.experienceVIIT = "VIIT experience cannot exceed overall.";
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveEdit = () => {
    if (!validate()) return;
    
    dispatch({ 
      type: ACTIONS.UPDATE_FACULTY, 
      payload: { 
        ...myFaculty, 
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : null,
        experienceOverall: parseFloat(formData.experienceOverall),
        experienceVIIT: parseFloat(formData.experienceVIIT),
      } 
    });
    
    // Also update current user if it's the registered user
    if (me.id.startsWith('USR_')) {
      dispatch({ type: ACTIONS.UPDATE_PROFILE, payload: { id: me.id, name: formData.name, email: formData.email, designation: formData.designation }});
    }

    showToast("Profile updated successfully!", "success");
    setEditing(false);
  };

  const addQualification = () => {
    if (!newTag.trim() || hasBadWords(newTag)) return;
    if (formData.qualifications.includes(newTag.trim())) { setNewTag(''); return; }
    setFormData(f => ({ ...f, qualifications: [...f.qualifications, newTag.trim()] }));
    setNewTag("");
  };

  const removeQualification = (q) => {
    setFormData(f => ({ ...f, qualifications: f.qualifications.filter(x => x !== q) }));
  };

  const STATUS_CFG = {
    OVERLOADED: { color: "text-red-400", bg: "bg-red-950/40 border-red-900/50", Icon: AlertTriangle, label: "Overloaded" },
    BALANCED:   { color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10 border-[var(--primary)]/20", Icon: CheckCircle, label: "Balanced" },
    UNDERLOADED:{ color: "text-yellow-400", bg: "bg-yellow-950/40 border-yellow-900/50", Icon: TrendingUp, label: "Underloaded" },
  };
  const statusCfg = STATUS_CFG[profile?.status] ?? STATUS_CFG.BALANCED;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto pb-20">
      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl border border-[var(--border)] overflow-hidden"
      >
        <div className="h-32 bg-gradient-to-r from-[var(--primary)]/20 via-[var(--surface-2)] to-[var(--accent)]/10"></div>
        <div className="px-8 pb-8 -mt-16 flex items-end justify-between gap-4 flex-wrap">
          <div className="flex items-end gap-5 w-full md:w-auto">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-black font-bold text-4xl shadow-xl border-4 border-[var(--surface-1)] font-heading shrink-0">
              {myFaculty.name.charAt(0)}
            </div>
            <div className="pb-2 w-full">
              {editing ? (
                <div className="space-y-2 max-w-xs">
                  <input value={formData.name} onChange={set('name')} className="input-field text-xl font-bold py-1.5" placeholder="Full Name" />
                  {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-heading font-bold text-white">{myFaculty.name}</h1>
                  <p className="text-[var(--primary-light)] font-bold text-sm mt-0.5">{myFaculty.designation}</p>
                </>
              )}
            </div>
          </div>
          <div className="pb-2 flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="btn btn-secondary"><X className="w-4 h-4" /> Cancel</button>
                <button onClick={saveEdit} className="btn btn-primary"><Save className="w-4 h-4" /> Save Changes</button>
              </>
            ) : (
              <button onClick={startEdit} className="btn btn-secondary"><Edit2 className="w-4 h-4" /> Edit Profile</button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact & Info */}
        <div className="glass-panel rounded-2xl border border-[var(--border)] p-6 space-y-6">
          <h2 className="font-heading font-bold text-white flex items-center gap-2"><User className="w-5 h-5 text-[var(--primary)]" /> Profile Details</h2>
          
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Email</label>
                <input type="email" value={formData.email} onChange={set('email')} className="input-field mt-1" disabled />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Email cannot be changed.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Phone Number</label>
                <input type="tel" value={formData.phone} onChange={set('phone')} className="input-field mt-1" placeholder="+91 9876543210" />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Age</label>
                  <input type="number" value={formData.age} onChange={set('age')} className="input-field mt-1" min={18} max={100} />
                  {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Gender</label>
                  <select value={formData.gender} onChange={set('gender')} className="input-field mt-1">
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Designation</label>
                <select value={formData.designation} onChange={set('designation')} className="input-field mt-1">
                  {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Department</label>
                <select value={formData.department} onChange={set('department')} className="input-field mt-1">
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={Mail} label="Email" value={myFaculty.email} full />
              <InfoItem icon={Phone} label="Phone" value={myFaculty.phone} />
              <InfoItem icon={User} label="Gender" value={myFaculty.gender} />
              <InfoItem icon={Hash} label="Employee ID" value={myFaculty.empId} />
              <InfoItem icon={Hash} label="Age" value={myFaculty.age ? `${myFaculty.age} years` : ''} />
              <InfoItem icon={Award} label="Designation" value={myFaculty.designation} full />
              <InfoItem icon={Building} label="Department" value={myFaculty.department} full />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Qualifications & Experience */}
          <div className="glass-panel rounded-2xl border border-[var(--border)] p-6 space-y-6">
            <h2 className="font-heading font-bold text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-[var(--primary)]" /> Qualifications & Experience</h2>
            
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2 block">Qualifications (Tags)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.qualifications.map(q => (
                      <span key={q} className="bg-[var(--surface-3)] text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                        {q} <button onClick={() => removeQualification(q)} className="text-[var(--text-muted)] hover:text-red-400"><X className="w-3 h-3"/></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addQualification())} className="input-field py-2" placeholder="e.g. M.Tech, Ph.D" />
                    <button type="button" onClick={addQualification} className="btn btn-secondary px-3"><Plus className="w-4 h-4"/></button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Specialization</label>
                  <input value={formData.specialization} onChange={set('specialization')} className="input-field mt-1" placeholder="e.g. Artificial Intelligence" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Overall Experience (Years)</label>
                    <input type="number" step="0.5" value={formData.experienceOverall} onChange={set('experienceOverall')} className="input-field mt-1" />
                    {errors.experienceOverall && <p className="text-red-400 text-xs mt-1">{errors.experienceOverall}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Experience in VIIT (Years)</label>
                    <input type="number" step="0.5" value={formData.experienceVIIT} onChange={set('experienceVIIT')} className="input-field mt-1" />
                    {errors.experienceVIIT && <p className="text-red-400 text-xs mt-1">{errors.experienceVIIT}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Qualifications</p>
                  <div className="flex flex-wrap gap-2">
                    {(!myFaculty.qualifications || myFaculty.qualifications.length === 0) && <span className="text-sm text-white">—</span>}
                    {myFaculty.qualifications?.map(q => (
                      <span key={q} className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--primary)] text-xs font-bold px-2 py-1 rounded-md">{q}</span>
                    ))}
                  </div>
                </div>
                <InfoItem icon={BookOpen} label="Specialization" value={myFaculty.specialization} full />
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border)] text-center">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Overall Exp</p>
                    <p className="text-xl font-bold font-mono text-white mt-1">{myFaculty.experienceOverall || 0}<span className="text-sm text-[var(--text-muted)]">y</span></p>
                  </div>
                  <div className="bg-[var(--surface-2)] rounded-xl p-3 border border-[var(--border)] text-center">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">VIIT Exp</p>
                    <p className="text-xl font-bold font-mono text-white mt-1">{myFaculty.experienceVIIT || 0}<span className="text-sm text-[var(--text-muted)]">y</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Subject Skills (Readonly here, populated from Phase 5 setup/HOD assignment) */}
      <div className="glass-panel rounded-2xl border border-[var(--border)] p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-heading font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-[var(--primary)]" /> Subjects I Teach</h2>
          <p className="text-xs text-[var(--text-secondary)]">Managed by HOD via Academic Setup</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {(!myFaculty.skills || myFaculty.skills.length === 0) && (
            <p className="text-sm text-[var(--text-muted)]">No subjects mapped yet.</p>
          )}
          {myFaculty.skills?.map(skill => {
            const subject = state.subjects.find(s => s.id === skill.subjectId);
            return (
              <div key={skill.subjectId} className="bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2 rounded-xl flex items-center gap-3">
                <span className="text-sm font-bold text-white">{subject?.name ?? skill.subjectId}</span>
                <span className="text-xs text-[var(--primary)] font-mono bg-[var(--primary)]/10 px-2 py-0.5 rounded-lg">{subject?.code}</span>
                <div className="flex">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className={star <= (skill.proficiency ?? 3) ? "text-yellow-400 text-xs" : "text-[var(--surface-3)] text-xs"}>★</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function InfoItem({ icon: Icon, label, value, full }) {
  return (
    <div className={cn("flex items-start gap-3", full ? "col-span-2" : "")}>
      <Icon className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
        <p className="text-sm text-white font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}
