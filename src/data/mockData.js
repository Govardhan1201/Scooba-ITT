// ============================================================
// MOCK DATA — Realistic Full-Semester Dataset
// Academic Year 2026-27, Semester 1 (Active)
// Department: Computer Science Engineering (CSE)
// ============================================================

import { createEmptyGrid, slotKey, DAYS } from '../engine/timetable.js';

// ─── Academic Year & Semester ─────────────────────────────────
export const ACADEMIC_YEARS = [
  { id: 'AY_2026', name: '2026–27', startDate: '2026-06-01', endDate: '2027-05-31', status: 'ACTIVE' },
  { id: 'AY_2025', name: '2025–26', startDate: '2025-06-01', endDate: '2026-05-31', status: 'ARCHIVED' },
];

export const SEMESTERS = [
  {
    id: 'SEM_1',
    academicYearId: 'AY_2026',
    name: 'Semester 1',
    number: 1,
    startDate: '2026-07-01',
    endDate: '2026-12-15',
    status: 'ACTIVE',
  },
  {
    id: 'SEM_2',
    academicYearId: 'AY_2026',
    name: 'Semester 2',
    number: 2,
    startDate: '2027-01-10',
    endDate: '2027-05-30',
    status: 'UPCOMING',
  },
];

// ─── Departments & Sections ───────────────────────────────────
export const DEPARTMENTS = [
  { id: 'DEPT_CSE', name: 'Computer Science Engineering', code: 'CSE' },
  { id: 'DEPT_IT', name: 'Information Technology', code: 'IT' },
];

export const SECTIONS = [
  { id: 'SEC_CSE_2A', deptId: 'DEPT_CSE', year: 2, section: 'A', label: 'CSE – 2nd Year A', strength: 60, semesterId: 'SEM_1', advisorId: 'FAC_002' },
  { id: 'SEC_CSE_2B', deptId: 'DEPT_CSE', year: 2, section: 'B', label: 'CSE – 2nd Year B', strength: 62, semesterId: 'SEM_1', advisorId: 'FAC_005' },
  { id: 'SEC_CSE_3A', deptId: 'DEPT_CSE', year: 3, section: 'A', label: 'CSE – 3rd Year A', strength: 58, semesterId: 'SEM_1', advisorId: 'FAC_003' },
  { id: 'SEC_IT_2A',  deptId: 'DEPT_IT',  year: 2, section: 'A', label: 'IT – 2nd Year A',  strength: 55, semesterId: 'SEM_1', advisorId: 'FAC_009' },
];

// ─── Rooms & Labs ─────────────────────────────────────────────
export const ROOMS = [
  { id: 'ROOM_101', name: 'Room 101', type: 'CLASSROOM', capacity: 65, department: 'DEPT_CSE' },
  { id: 'ROOM_102', name: 'Room 102', type: 'CLASSROOM', capacity: 65, department: 'DEPT_CSE' },
  { id: 'ROOM_103', name: 'Room 103', type: 'CLASSROOM', capacity: 65, department: 'DEPT_CSE' },
  { id: 'ROOM_104', name: 'Room 104', type: 'CLASSROOM', capacity: 65, department: 'DEPT_IT' },
  { id: 'LAB_CSE_1', name: 'CS Lab 1', type: 'COMPUTER_LAB', capacity: 60, department: 'DEPT_CSE', equipment: ['Linux workstations', 'Oracle DB'] },
  { id: 'LAB_CSE_2', name: 'CS Lab 2', type: 'COMPUTER_LAB', capacity: 60, department: 'DEPT_CSE', equipment: ['Windows PCs', 'Visual Studio'] },
  { id: 'LAB_IT_1',  name: 'IT Lab 1', type: 'COMPUTER_LAB', capacity: 55, department: 'DEPT_IT' },
  { id: 'ROOM_SEMINAR', name: 'Seminar Hall', type: 'SEMINAR', capacity: 150 },
];

// ─── Faculty ──────────────────────────────────────────────────
export const FACULTY = [
  {
    id: 'FAC_001',
    name: 'Dr. Arjun Mehta',
    empId: 'CSE001',
    email: 'arjun.mehta@college.edu',
    phone: '9876543210',
    designation: 'Professor',
    department: 'DEPT_CSE',
    status: 'ACTIVE',
    photo: null,
    qualification: 'Ph.D. Computer Science',
    specialization: 'Database Systems',
    customWorkloadLimit: null,
    skills: [
      { subjectId: 'SUB_DBMS', level: 'Expert' },
      { subjectId: 'SUB_DS', level: 'Advanced' },
      { subjectId: 'SUB_OS', level: 'Intermediate' },
    ],
    preferences: [
      { subjectId: 'SUB_DBMS', level: 'preferred' },
      { subjectId: 'SUB_DS', level: 'neutral' },
    ],
    availability: {
      Monday: 'full', Tuesday: 'full', Wednesday: 'full',
      Thursday: 'full', Friday: 'full', Saturday: 'morning',
    },
    responsibilities: {
      theoryHours: 0, labHours: 0, projectHours: 2, examHours: 2,
      mentoringHours: 1, deptHours: 1,
    },
    joinDate: '2015-07-01',
  },
  {
    id: 'FAC_002',
    name: 'Dr. Priya Krishnan',
    empId: 'CSE002',
    email: 'priya.krishnan@college.edu',
    phone: '9876543211',
    designation: 'Associate Professor',
    department: 'DEPT_CSE',
    status: 'ACTIVE',
    photo: null,
    qualification: 'Ph.D. Algorithms',
    specialization: 'Data Structures & Algorithms',
    customWorkloadLimit: null,
    skills: [
      { subjectId: 'SUB_DS', level: 'Expert' },
      { subjectId: 'SUB_ADA', level: 'Expert' },
      { subjectId: 'SUB_DBMS', level: 'Advanced' },
    ],
    preferences: [{ subjectId: 'SUB_DS', level: 'preferred' }, { subjectId: 'SUB_ADA', level: 'preferred' }],
    availability: { Monday: 'full', Tuesday: 'full', Wednesday: 'full', Thursday: 'full', Friday: 'full', Saturday: 'full' },
    responsibilities: { theoryHours: 0, labHours: 0, projectHours: 1, examHours: 2, mentoringHours: 1, deptHours: 0.5 },
    joinDate: '2018-07-01',
  },
  {
    id: 'FAC_003',
    name: 'Mr. Rahul Sharma',
    empId: 'CSE003',
    email: 'rahul.sharma@college.edu',
    phone: '9876543212',
    designation: 'Assistant Professor',
    department: 'DEPT_CSE',
    status: 'ACTIVE',
    photo: null,
    qualification: 'M.Tech Computer Science',
    specialization: 'Computer Networks',
    customWorkloadLimit: null,
    skills: [
      { subjectId: 'SUB_CN', level: 'Expert' },
      { subjectId: 'SUB_OS', level: 'Expert' },
      { subjectId: 'SUB_DS', level: 'Intermediate' },
    ],
    preferences: [{ subjectId: 'SUB_CN', level: 'preferred' }],
    availability: { Monday: 'full', Tuesday: 'full', Wednesday: 'full', Thursday: 'full', Friday: 'full', Saturday: 'full' },
    responsibilities: { theoryHours: 0, labHours: 0, projectHours: 1, examHours: 1, mentoringHours: 0.5, deptHours: 0.5 },
    joinDate: '2020-07-01',
  },
  {
    id: 'FAC_004',
    name: 'Dr. Sunita Rao',
    empId: 'CSE004',
    email: 'sunita.rao@college.edu',
    phone: '9876543213',
    designation: 'Associate Professor',
    department: 'DEPT_CSE',
    status: 'ACTIVE',
    photo: null,
    qualification: 'Ph.D. Machine Learning',
    specialization: 'AI & Machine Learning',
    customWorkloadLimit: null,
    skills: [
      { subjectId: 'SUB_AI', level: 'Expert' },
      { subjectId: 'SUB_ML', level: 'Expert' },
      { subjectId: 'SUB_PYTHON', level: 'Advanced' },
    ],
    preferences: [{ subjectId: 'SUB_AI', level: 'preferred' }, { subjectId: 'SUB_ML', level: 'preferred' }],
    availability: { Monday: 'full', Tuesday: 'full', Wednesday: 'full', Thursday: 'full', Friday: 'full', Saturday: 'morning' },
    responsibilities: { theoryHours: 0, labHours: 0, projectHours: 2, examHours: 2, mentoringHours: 1, deptHours: 1 },
    joinDate: '2017-01-01',
  },
  {
    id: 'FAC_005',
    name: 'Ms. Kavya Nair',
    empId: 'CSE005',
    email: 'kavya.nair@college.edu',
    phone: '9876543214',
    designation: 'Assistant Professor',
    department: 'DEPT_CSE',
    status: 'ACTIVE',
    photo: null,
    qualification: 'M.Tech Software Engineering',
    specialization: 'Software Engineering & Testing',
    customWorkloadLimit: null,
    skills: [
      { subjectId: 'SUB_SE', level: 'Expert' },
      { subjectId: 'SUB_PYTHON', level: 'Expert' },
      { subjectId: 'SUB_DBMS', level: 'Advanced' },
    ],
    preferences: [{ subjectId: 'SUB_SE', level: 'preferred' }],
    availability: { Monday: 'full', Tuesday: 'full', Wednesday: 'full', Thursday: 'full', Friday: 'full', Saturday: 'full' },
    responsibilities: { theoryHours: 0, labHours: 0, projectHours: 0, examHours: 1, mentoringHours: 0.5, deptHours: 0 },
    joinDate: '2022-07-01',
  },
  {
    id: 'FAC_006',
    name: 'Dr. Vikram Patel',
    empId: 'CSE006',
    email: 'vikram.patel@college.edu',
    phone: '9876543215',
    designation: 'Professor',
    department: 'DEPT_CSE',
    status: 'ACTIVE',
    photo: null,
    qualification: 'Ph.D. Computer Architecture',
    specialization: 'Computer Organization',
    customWorkloadLimit: null,
    skills: [
      { subjectId: 'SUB_COA', level: 'Expert' },
      { subjectId: 'SUB_OS', level: 'Advanced' },
    ],
    preferences: [{ subjectId: 'SUB_COA', level: 'preferred' }],
    availability: { Monday: 'full', Tuesday: 'full', Wednesday: 'morning', Thursday: 'full', Friday: 'full', Saturday: 'none' },
    responsibilities: { theoryHours: 0, labHours: 0, projectHours: 1, examHours: 2, mentoringHours: 1, deptHours: 2 },
    joinDate: '2012-01-01',
  },
  {
    id: 'FAC_007',
    name: 'Mr. Arun Kumar',
    empId: 'CSE007',
    email: 'arun.kumar@college.edu',
    phone: '9876543216',
    designation: 'Assistant Professor',
    department: 'DEPT_CSE',
    status: 'ACTIVE',
    photo: null,
    qualification: 'M.Tech Computer Science',
    specialization: 'Web Technologies',
    customWorkloadLimit: null,
    skills: [
      { subjectId: 'SUB_WT', level: 'Expert' },
      { subjectId: 'SUB_PYTHON', level: 'Advanced' },
      { subjectId: 'SUB_DS', level: 'Beginner' },
    ],
    preferences: [{ subjectId: 'SUB_WT', level: 'preferred' }],
    availability: { Monday: 'full', Tuesday: 'full', Wednesday: 'full', Thursday: 'full', Friday: 'full', Saturday: 'full' },
    responsibilities: { theoryHours: 0, labHours: 0, projectHours: 0.5, examHours: 1, mentoringHours: 0.5, deptHours: 0 },
    joinDate: '2023-01-01',
  },
  {
    id: 'FAC_008',
    name: 'Dr. Meera Singh',
    empId: 'CSE008',
    email: 'meera.singh@college.edu',
    phone: '9876543217',
    designation: 'Associate Professor',
    department: 'DEPT_CSE',
    status: 'ON_LEAVE',
    photo: null,
    qualification: 'Ph.D. Compiler Design',
    specialization: 'Theory of Computation',
    customWorkloadLimit: null,
    skills: [
      { subjectId: 'SUB_TOC', level: 'Expert' },
      { subjectId: 'SUB_CD', level: 'Expert' },
    ],
    preferences: [],
    availability: { Monday: 'none', Tuesday: 'none', Wednesday: 'none', Thursday: 'none', Friday: 'none', Saturday: 'none' },
    responsibilities: { theoryHours: 0, labHours: 0, projectHours: 0, examHours: 0, mentoringHours: 0, deptHours: 0 },
    joinDate: '2019-07-01',
  },
  {
    id: 'FAC_009',
    name: 'Mr. Kiran Desai',
    empId: 'IT001',
    email: 'kiran.desai@college.edu',
    phone: '9876543218',
    designation: 'Assistant Professor',
    department: 'DEPT_IT',
    status: 'ACTIVE',
    photo: null,
    qualification: 'M.Tech IT',
    specialization: 'Networking',
    customWorkloadLimit: null,
    skills: [
      { subjectId: 'SUB_CN', level: 'Advanced' },
      { subjectId: 'SUB_WT', level: 'Intermediate' },
    ],
    preferences: [],
    availability: { Monday: 'full', Tuesday: 'full', Wednesday: 'full', Thursday: 'full', Friday: 'full', Saturday: 'full' },
    responsibilities: { theoryHours: 0, labHours: 0, projectHours: 0.5, examHours: 1, mentoringHours: 0.5, deptHours: 0 },
    joinDate: '2021-07-01',
  },
];

// ─── Subjects ─────────────────────────────────────────────────
export const SUBJECTS = [
  { id: 'SUB_DBMS', name: 'Database Management Systems', code: 'CS301', type: 'THEORY', credits: 4, hoursPerWeek: 4, difficulty: 'High', requiredSkill: 'SUB_DBMS', semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  { id: 'SUB_DS',   name: 'Data Structures',            code: 'CS302', type: 'THEORY', credits: 4, hoursPerWeek: 4, difficulty: 'High', requiredSkill: 'SUB_DS',   semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  { id: 'SUB_OS',   name: 'Operating Systems',          code: 'CS303', type: 'THEORY', credits: 3, hoursPerWeek: 3, difficulty: 'High', requiredSkill: 'SUB_OS',   semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  { id: 'SUB_COA',  name: 'Computer Organization',      code: 'CS304', type: 'THEORY', credits: 3, hoursPerWeek: 3, difficulty: 'Medium', requiredSkill: 'SUB_COA', semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  { id: 'SUB_SE',   name: 'Software Engineering',       code: 'CS305', type: 'THEORY', credits: 3, hoursPerWeek: 3, difficulty: 'Medium', requiredSkill: 'SUB_SE',  semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  { id: 'SUB_CN',   name: 'Computer Networks',          code: 'CS306', type: 'THEORY', credits: 3, hoursPerWeek: 3, difficulty: 'Medium', requiredSkill: 'SUB_CN',  semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  { id: 'SUB_ADA',  name: 'Algorithm Design & Analysis',code: 'CS307', type: 'THEORY', credits: 3, hoursPerWeek: 3, difficulty: 'High', requiredSkill: 'SUB_ADA',  semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  { id: 'SUB_TOC',  name: 'Theory of Computation',      code: 'CS308', type: 'THEORY', credits: 3, hoursPerWeek: 3, difficulty: 'High', requiredSkill: 'SUB_TOC',  semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  { id: 'SUB_AI',   name: 'Artificial Intelligence',    code: 'CS401', type: 'THEORY', credits: 3, hoursPerWeek: 3, difficulty: 'High', requiredSkill: 'SUB_AI',   semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  { id: 'SUB_ML',   name: 'Machine Learning',           code: 'CS402', type: 'THEORY', credits: 3, hoursPerWeek: 3, difficulty: 'High', requiredSkill: 'SUB_ML',   semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  { id: 'SUB_WT',   name: 'Web Technologies',           code: 'CS309', type: 'THEORY', credits: 2, hoursPerWeek: 2, difficulty: 'Low', requiredSkill: 'SUB_WT',    semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  { id: 'SUB_PYTHON',name: 'Python Programming',        code: 'CS310', type: 'THEORY', credits: 2, hoursPerWeek: 2, difficulty: 'Low', requiredSkill: 'SUB_PYTHON', semesterId: 'SEM_1', deptId: 'DEPT_CSE' },
  // Labs
  { id: 'SUB_DBMS_LAB', name: 'DBMS Lab',    code: 'CS301L', type: 'LAB', credits: 2, hoursPerWeek: 2, difficulty: 'High', requiredSkill: 'SUB_DBMS', semesterId: 'SEM_1', deptId: 'DEPT_CSE', linkedTheory: 'SUB_DBMS' },
  { id: 'SUB_DS_LAB',   name: 'DS Lab',      code: 'CS302L', type: 'LAB', credits: 2, hoursPerWeek: 2, difficulty: 'High', requiredSkill: 'SUB_DS',   semesterId: 'SEM_1', deptId: 'DEPT_CSE', linkedTheory: 'SUB_DS' },
  { id: 'SUB_CN_LAB',   name: 'Networks Lab',code: 'CS306L', type: 'LAB', credits: 2, hoursPerWeek: 2, difficulty: 'Medium', requiredSkill: 'SUB_CN', semesterId: 'SEM_1', deptId: 'DEPT_CSE', linkedTheory: 'SUB_CN' },
  { id: 'SUB_PYTHON_LAB',name: 'Python Lab', code: 'CS310L', type: 'LAB', credits: 1, hoursPerWeek: 2, difficulty: 'Low', requiredSkill: 'SUB_PYTHON', semesterId: 'SEM_1', deptId: 'DEPT_CSE', linkedTheory: 'SUB_PYTHON' },
];

// ─── Section-Subject Assignments (which subjects each section has) ─
export const SECTION_SUBJECTS = {
  'SEC_CSE_2A': ['SUB_DBMS', 'SUB_DS', 'SUB_OS', 'SUB_COA', 'SUB_SE', 'SUB_DBMS_LAB', 'SUB_DS_LAB'],
  'SEC_CSE_2B': ['SUB_DBMS', 'SUB_DS', 'SUB_OS', 'SUB_COA', 'SUB_SE', 'SUB_DBMS_LAB', 'SUB_DS_LAB'],
  'SEC_CSE_3A': ['SUB_AI', 'SUB_ML', 'SUB_CN', 'SUB_ADA', 'SUB_TOC', 'SUB_CN_LAB'],
  'SEC_IT_2A':  ['SUB_CN', 'SUB_WT', 'SUB_PYTHON', 'SUB_SE', 'SUB_CN_LAB', 'SUB_PYTHON_LAB'],
};

// ─── Timetable Grids (Phase status per section) ───────────────
export const TIMETABLE_PHASES_STATE = {
  'SEC_CSE_2A': 'PHASE2_IN_PROGRESS',
  'SEC_CSE_2B': 'PHASE1_DRAFT',
  'SEC_CSE_3A': 'PUBLISHED',
  'SEC_IT_2A':  'PHASE1_DRAFT',
};

// ─── Faculty Assignments (Phase 2 — subject to faculty) ───────
export const FACULTY_ASSIGNMENTS = [
  // CSE-2A
  { id: 'ASN_001', sectionId: 'SEC_CSE_2A', subjectId: 'SUB_DBMS', facultyId: 'FAC_001', type: 'THEORY' },
  { id: 'ASN_002', sectionId: 'SEC_CSE_2A', subjectId: 'SUB_DS',   facultyId: 'FAC_002', type: 'THEORY' },
  { id: 'ASN_003', sectionId: 'SEC_CSE_2A', subjectId: 'SUB_OS',   facultyId: 'FAC_003', type: 'THEORY' },
  { id: 'ASN_004', sectionId: 'SEC_CSE_2A', subjectId: 'SUB_COA',  facultyId: 'FAC_006', type: 'THEORY' },
  { id: 'ASN_005', sectionId: 'SEC_CSE_2A', subjectId: 'SUB_SE',   facultyId: 'FAC_005', type: 'THEORY' },
  { id: 'ASN_006', sectionId: 'SEC_CSE_2A', subjectId: 'SUB_DBMS_LAB', facultyId: 'FAC_001', type: 'LAB', coFacultyId: null },
  { id: 'ASN_007', sectionId: 'SEC_CSE_2A', subjectId: 'SUB_DS_LAB',   facultyId: 'FAC_002', type: 'LAB', coFacultyId: null },
  // CSE-3A (Published)
  { id: 'ASN_010', sectionId: 'SEC_CSE_3A', subjectId: 'SUB_AI',   facultyId: 'FAC_004', type: 'THEORY' },
  { id: 'ASN_011', sectionId: 'SEC_CSE_3A', subjectId: 'SUB_ML',   facultyId: 'FAC_004', type: 'THEORY' },
  { id: 'ASN_012', sectionId: 'SEC_CSE_3A', subjectId: 'SUB_CN',   facultyId: 'FAC_003', type: 'THEORY' },
  { id: 'ASN_013', sectionId: 'SEC_CSE_3A', subjectId: 'SUB_ADA',  facultyId: 'FAC_002', type: 'THEORY' },
  { id: 'ASN_014', sectionId: 'SEC_CSE_3A', subjectId: 'SUB_TOC',  facultyId: 'FAC_001', type: 'THEORY' },
  { id: 'ASN_015', sectionId: 'SEC_CSE_3A', subjectId: 'SUB_CN_LAB', facultyId: 'FAC_003', type: 'LAB' },
];

// ─── Absence Intimations ──────────────────────────────────────
export const ABSENCES = [
  {
    id: 'ABS_001',
    facultyId: 'FAC_003',
    fromDate: '2026-08-18',
    toDate: '2026-08-20',
    reason: 'Family medical emergency',
    note: 'Will be back by Monday 21st',
    status: 'PENDING_HOD',
    submittedAt: '2026-08-12T10:30:00',
    affectedClasses: [
      { sectionId: 'SEC_CSE_2A', subjectId: 'SUB_OS' },
      { sectionId: 'SEC_CSE_3A', subjectId: 'SUB_CN' },
      { sectionId: 'SEC_CSE_3A', subjectId: 'SUB_CN_LAB' },
    ],
    recommendations: [
      { subjectId: 'SUB_OS', sectionId: 'SEC_CSE_2A', replacementFacultyId: 'FAC_006', suitabilityScore: 72 },
      { subjectId: 'SUB_CN', sectionId: 'SEC_CSE_3A', replacementFacultyId: 'FAC_009', suitabilityScore: 81 },
      { subjectId: 'SUB_CN_LAB', sectionId: 'SEC_CSE_3A', replacementFacultyId: 'FAC_009', suitabilityScore: 78 },
    ],
    assistantHodAction: { action: 'RECOMMENDED', comment: 'Dr. Rahul has a valid reason. Replacements verified.', at: '2026-08-12T14:15:00' },
    hodAction: null,
  },
];

// ─── Notifications ────────────────────────────────────────────
export const NOTIFICATIONS = [
  { id: 'NOT_001', userId: 'FAC_003', type: 'ABSENCE', message: 'Your absence intimation for Aug 18–20 is under HOD review.', read: false, createdAt: '2026-08-12T14:15:00' },
  { id: 'NOT_002', userId: 'FAC_001', type: 'WORKLOAD', message: 'Your workload has been updated for Semester 1.', read: true, createdAt: '2026-08-10T09:00:00' },
  { id: 'NOT_003', userId: 'HOD_001', type: 'APPROVAL', message: 'Faculty absence intimation from Mr. Rahul Sharma awaits your approval.', read: false, createdAt: '2026-08-12T14:15:00' },
  { id: 'NOT_004', userId: 'HOD_001', type: 'WORKLOAD', message: 'Workload imbalance detected: Dr. Sunita Rao is overloaded (110%).', read: false, createdAt: '2026-08-11T11:00:00' },
  { id: 'NOT_005', userId: 'ASST_001', type: 'REQUEST', message: 'New absence intimation received from Mr. Rahul Sharma.', read: false, createdAt: '2026-08-12T10:30:00' },
];

// ─── Audit Log ────────────────────────────────────────────────
export const AUDIT_LOG = [
  { id: 'AUD_001', userId: 'HOD_001', userName: 'Dr. A. Krishnaswamy (HOD)', action: 'SEMESTER_CREATED', entity: 'Semester', entityId: 'SEM_1', detail: 'Created Semester 1 (2026-27)', timestamp: '2026-07-01T09:00:00' },
  { id: 'AUD_002', userId: 'HOD_001', userName: 'Dr. A. Krishnaswamy (HOD)', action: 'TIMETABLE_PHASE1_LOCKED', entity: 'Timetable', entityId: 'SEC_CSE_3A', detail: 'Phase 1 locked for CSE-3A', timestamp: '2026-07-10T11:00:00' },
  { id: 'AUD_003', userId: 'ASST_001', userName: 'Mrs. Lakshmi (Asst. HOD)', action: 'FACULTY_ASSIGNED', entity: 'Assignment', entityId: 'ASN_010', detail: 'Dr. Sunita Rao assigned to AI for CSE-3A', timestamp: '2026-07-15T10:30:00' },
  { id: 'AUD_004', userId: 'HOD_001', userName: 'Dr. A. Krishnaswamy (HOD)', action: 'TIMETABLE_PUBLISHED', entity: 'Timetable', entityId: 'SEC_CSE_3A', detail: 'CSE-3A timetable published', timestamp: '2026-07-20T15:00:00' },
  { id: 'AUD_005', userId: 'FAC_003', userName: 'Mr. Rahul Sharma', action: 'ABSENCE_SUBMITTED', entity: 'Absence', entityId: 'ABS_001', detail: 'Absence intimation for Aug 18–20 submitted', timestamp: '2026-08-12T10:30:00' },
  { id: 'AUD_006', userId: 'ASST_001', userName: 'Mrs. Lakshmi (Asst. HOD)', action: 'ABSENCE_REVIEWED', entity: 'Absence', entityId: 'ABS_001', detail: 'Asst HOD recommended approval with replacement', timestamp: '2026-08-12T14:15:00' },
];

// ─── Users (for auth) ─────────────────────────────────────────
export const USERS = [
  { id: 'HOD_001', name: 'Dr. A. Krishnaswamy', email: 'hod@college.edu', password: 'hod123', role: 'HOD', facultyId: null },
  { id: 'ASST_001', name: 'Mrs. Lakshmi Iyer', email: 'asst.hod@college.edu', password: 'asst123', role: 'ASST_HOD', facultyId: null },
  { id: 'FAC_001_U', name: 'Dr. Arjun Mehta', email: 'arjun.mehta@college.edu', password: 'fac123', role: 'FACULTY', facultyId: 'FAC_001' },
  { id: 'FAC_002_U', name: 'Dr. Priya Krishnan', email: 'priya.krishnan@college.edu', password: 'fac123', role: 'FACULTY', facultyId: 'FAC_002' },
  { id: 'FAC_003_U', name: 'Mr. Rahul Sharma', email: 'rahul.sharma@college.edu', password: 'fac123', role: 'FACULTY', facultyId: 'FAC_003' },
];

// ─── System Settings ──────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  institutionName: 'Sri Venkateswara College of Engineering',
  departmentName: 'Department of Computer Science & Engineering',
  workloadWeights: {
    theory: 1.0, laboratory: 1.2, projectGuidance: 1.3,
    examination: 1.5, mentoring: 0.8, departmentWork: 0.5,
  },
  workloadThresholds: { overloaded: 100, balancedMin: 70, balancedMax: 100 },
  designationLimits: {
    'Professor': 10,
    'Associate Professor': 16,
    'Assistant Professor': 20,
  },
};
