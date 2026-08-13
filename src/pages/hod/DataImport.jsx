import React, { useState, useRef } from 'react';
import { useApp, ACTIONS } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X, Users, BookOpen, RotateCcw } from 'lucide-react';

/**
 * Parse CSV text into array of row objects using first row as headers.
 */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    // Simple CSV parse (handles quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += line[i];
      }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  }).filter(row => Object.values(row).some(v => v !== ''));
}

/**
 * EXPECTED FORMATS:
 *
 * SUBJECTS CSV:
 * Subject Code, Subject Name, Type (THEORY/LAB), Hours Per Week, Year, Semester, Difficulty (1-5)
 *
 * FACULTY CSV:
 * Name, Employee ID, Email, Designation, Specialization, Subjects Handled (semicolon-separated codes)
 */

export default function DataImport() {
  const { state, dispatch, showToast } = useApp();
  const [subjectFile, setSubjectFile] = useState(null);
  const [facultyFile, setFacultyFile] = useState(null);
  const [subjectPreview, setSubjectPreview] = useState(null);
  const [facultyPreview, setFacultyPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const subjectRef = useRef();
  const facultyRef = useRef();

  const parseFile = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(parseCSV(e.target.result));
      reader.readAsText(file);
    });
  };

  const handleSubjectFile = async (file) => {
    if (!file) return;
    setSubjectFile(file);
    const rows = await parseFile(file);
    setSubjectPreview(rows.slice(0, 5));
  };

  const handleFacultyFile = async (file) => {
    if (!file) return;
    setFacultyFile(file);
    const rows = await parseFile(file);
    setFacultyPreview(rows.slice(0, 5));
  };

  const importData = async () => {
    setImporting(true);
    setResult(null);
    let subjectsAdded = 0;
    let facultyAdded = 0;
    const errors = [];

    try {
      // Import Subjects
      if (subjectFile) {
        const rows = await parseFile(subjectFile);
        rows.forEach((row, i) => {
          const code = row['subject_code'] || row['code'] || row['subject_code'];
          const name = row['subject_name'] || row['name'] || row['full_name'] || row['subject_full_form'];
          const type = (row['type'] || 'THEORY').toUpperCase();
          const hours = parseInt(row['hours_per_week'] || row['weekly_recurrence'] || row['hours'] || '3', 10);
          const year = parseInt(row['year'] || '2', 10);
          const semester = parseInt(row['semester'] || '1', 10);
          const difficulty = parseInt(row['difficulty'] || '3', 10);

          if (!code || !name) {
            errors.push(`Row ${i + 2}: Missing subject code or name.`);
            return;
          }

          // Check for duplicate
          if (state.subjects.find(s => s.code === code)) {
            errors.push(`Row ${i + 2}: Subject code "${code}" already exists — skipped.`);
            return;
          }

          dispatch({
            type: ACTIONS.ADD_SUBJECT,
            payload: {
              id: `SUB_${code.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`,
              code: code.toUpperCase(),
              name,
              type: ['THEORY', 'LAB'].includes(type) ? type : 'THEORY',
              hoursPerWeek: isNaN(hours) ? 3 : hours,
              year,
              semester,
              difficulty: isNaN(difficulty) ? 3 : Math.min(5, Math.max(1, difficulty)),
              department: 'DEPT_CSE',
            },
          });
          subjectsAdded++;
        });
      }

      // Import Faculty
      if (facultyFile) {
        const rows = await parseFile(facultyFile);
        rows.forEach((row, i) => {
          const name = row['name'] || row['faculty_name'];
          const empId = row['employee_id'] || row['emp_id'] || row['id'] || row['employee id'];
          const email = row['email'] || '';
          const designation = row['designation'] || 'Assistant Professor';
          const specialization = row['specialization'] || '';
          const subjectsHandled = (row['subjects_handled'] || row['subjects'] || '').split(';').map(s => s.trim()).filter(Boolean);

          if (!name || !empId) {
            errors.push(`Row ${i + 2}: Missing faculty name or employee ID.`);
            return;
          }

          // Check for duplicate
          if (state.faculty.find(f => f.empId === empId)) {
            errors.push(`Row ${i + 2}: Employee ID "${empId}" already exists — skipped.`);
            return;
          }

          // Map subject codes to IDs
          const skills = subjectsHandled.map(code => {
            const sub = state.subjects.find(s => s.code === code.toUpperCase());
            return sub ? { subjectId: sub.id, level: 'Intermediate' } : null;
          }).filter(Boolean);

          dispatch({
            type: ACTIONS.ADD_FACULTY,
            payload: {
              id: `FAC_IMP_${Date.now()}_${i}`,
              name,
              empId,
              email,
              designation,
              specialization,
              status: 'ACTIVE',
              skills,
              preferences: [],
              availability: { Monday: 'full', Tuesday: 'full', Wednesday: 'full', Thursday: 'full', Friday: 'full', Saturday: 'full' },
              responsibilities: { theoryHours: 0, labHours: 0, projectHours: 0, examHours: 0, mentoringHours: 0, deptHours: 0 },
            },
          });
          facultyAdded++;
        });
      }

      setResult({ subjectsAdded, facultyAdded, errors });
      if (subjectsAdded > 0 || facultyAdded > 0) {
        showToast(`Import complete: ${subjectsAdded} subjects, ${facultyAdded} faculty added.`, 'success');
      }
    } catch (err) {
      showToast(`Import failed: ${err.message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  const clearFiles = () => {
    setSubjectFile(null);
    setFacultyFile(null);
    setSubjectPreview(null);
    setFacultyPreview(null);
    setResult(null);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1100px] mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600/30 to-green-800/10 border border-green-700/30 flex items-center justify-center">
          <FileSpreadsheet className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Data Import</h1>
          <p className="text-[var(--text-secondary)] mt-1">Upload CSV files to bulk-import subjects and faculty into the system.</p>
        </div>
      </div>

      {/* Format Guide */}
      <div className="glass-panel rounded-2xl border border-[var(--border)] p-6">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-400" /> Expected CSV Formats</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Subjects CSV — Required Columns</p>
            <div className="bg-[var(--surface-2)] rounded-xl p-4 font-mono text-xs text-[var(--primary-light)] space-y-1">
              <p>Subject Code, Subject Name, Type, Hours Per Week, Year, Semester, Difficulty</p>
              <p className="text-[var(--text-muted)] mt-2">Type: THEORY or LAB</p>
              <p className="text-[var(--text-muted)]">Difficulty: 1–5 (5 = hardest)</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Faculty CSV — Required Columns</p>
            <div className="bg-[var(--surface-2)] rounded-xl p-4 font-mono text-xs text-[var(--primary-light)] space-y-1">
              <p>Name, Employee ID, Email, Designation, Specialization, Subjects Handled</p>
              <p className="text-[var(--text-muted)] mt-2">Subjects Handled: semicolon-separated codes</p>
              <p className="text-[var(--text-muted)]">E.g.: DBMS;OS;DS</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Subject File Upload */}
        <DropZone
          label="Subjects CSV"
          icon={BookOpen}
          iconColor="text-blue-400"
          file={subjectFile}
          preview={subjectPreview}
          inputRef={subjectRef}
          accept=".csv,.xlsx"
          onFileChange={handleSubjectFile}
          onClear={() => { setSubjectFile(null); setSubjectPreview(null); }}
        />

        {/* Faculty File Upload */}
        <DropZone
          label="Faculty CSV"
          icon={Users}
          iconColor="text-purple-400"
          file={facultyFile}
          preview={facultyPreview}
          inputRef={facultyRef}
          accept=".csv,.xlsx"
          onFileChange={handleFacultyFile}
          onClear={() => { setFacultyFile(null); setFacultyPreview(null); }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={importData}
          disabled={(!subjectFile && !facultyFile) || importing}
          className="btn btn-primary flex items-center gap-2 px-6 py-3"
        >
          <Upload className="w-5 h-5" />
          {importing ? 'Importing...' : 'Import Data'}
        </button>
        <button onClick={clearFiles} className="btn btn-secondary flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Clear Files
        </button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-panel rounded-2xl border border-[var(--border)] p-6 space-y-4"
          >
            <h2 className="font-bold text-white flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[var(--primary)]" /> Import Results</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[var(--surface-2)] rounded-xl p-4 text-center border border-[var(--border)]">
                <p className="text-3xl font-heading font-bold text-[var(--primary)]">{result.subjectsAdded}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider">Subjects Added</p>
              </div>
              <div className="bg-[var(--surface-2)] rounded-xl p-4 text-center border border-[var(--border)]">
                <p className="text-3xl font-heading font-bold text-purple-400">{result.facultyAdded}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider">Faculty Added</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">{result.errors.length} Warnings</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-[var(--text-secondary)] bg-yellow-950/20 rounded-lg p-2 border border-yellow-900/20">{e}</p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropZone({ label, icon: Icon, iconColor, file, preview, inputRef, accept, onFileChange, onClear }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', iconColor)} />
          <h3 className="font-bold text-white">{label}</h3>
        </div>
        {file && (
          <button onClick={onClear} className="text-[var(--text-muted)] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-5">
        {!file ? (
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              dragging ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--primary)]/50'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFileChange(f); }}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm font-semibold text-white">Drop your CSV here</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">or click to browse</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-3 font-mono">{accept}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[var(--primary)]/5 rounded-xl border border-[var(--primary)]/20">
              <FileSpreadsheet className="w-5 h-5 text-[var(--primary)] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <CheckCircle className="w-5 h-5 text-[var(--primary)] ml-auto shrink-0" />
            </div>
            {preview && preview.length > 0 && (
              <div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Preview (first {preview.length} rows)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>{Object.keys(preview[0]).map(k => <th key={k} className="text-left px-2 py-1 text-[var(--text-muted)] font-mono">{k}</th>)}</tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-[var(--border)]">
                          {Object.values(row).map((v, j) => <td key={j} className="px-2 py-1.5 text-[var(--text-secondary)] truncate max-w-[120px]">{v}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}
