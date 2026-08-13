import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  USERS, FACULTY, SUBJECTS, SECTIONS, ROOMS, SEMESTERS, ACADEMIC_YEARS,
  FACULTY_ASSIGNMENTS, ABSENCES, NOTIFICATIONS, AUDIT_LOG, DEFAULT_SETTINGS,
  SECTION_SUBJECTS, TIMETABLE_PHASES_STATE,
} from '../data/mockData.js';
import { DEFAULT_RULES } from '../engine/rules.js';
import { getDepartmentWorkloadStats } from '../engine/workload.js';
import { createEmptyGrid, deriveFacultyTimetables } from '../engine/timetable.js';

// ─── Initial State ────────────────────────────────────────────
const initialState = {
  // Auth
  currentUser: null,
  isAuthenticated: false,
  authError: null,

  // Academic Context
  currentSemester: SEMESTERS.find((s) => s.status === 'ACTIVE') ?? SEMESTERS[0],
  academicYears: ACADEMIC_YEARS,
  semesters: SEMESTERS,

  // Core Data
  faculty: FACULTY,
  subjects: SUBJECTS,
  sections: SECTIONS,
  rooms: ROOMS,
  assignments: FACULTY_ASSIGNMENTS,
  absences: ABSENCES,
  notifications: NOTIFICATIONS,
  auditLog: AUDIT_LOG,

  // Timetable State
  timetablePhases: TIMETABLE_PHASES_STATE,
  timetableGrids: {},  // sectionId → grid

  // Section-Subject Mapping
  sectionSubjects: SECTION_SUBJECTS,

  // Settings
  settings: DEFAULT_SETTINGS,
  rules: DEFAULT_RULES,

  // UI State
  sidebarCollapsed: false,
  toasts: [],
};

// ─── Action Types ─────────────────────────────────────────────
export const ACTIONS = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  AUTH_ERROR: 'AUTH_ERROR',

  // Faculty
  ADD_FACULTY: 'ADD_FACULTY',
  UPDATE_FACULTY: 'UPDATE_FACULTY',
  DELETE_FACULTY: 'DELETE_FACULTY',

  // Subjects
  ADD_SUBJECT: 'ADD_SUBJECT',
  UPDATE_SUBJECT: 'UPDATE_SUBJECT',
  DELETE_SUBJECT: 'DELETE_SUBJECT',

  // Sections
  ADD_SECTION: 'ADD_SECTION',
  UPDATE_SECTION: 'UPDATE_SECTION',
  DELETE_SECTION: 'DELETE_SECTION',

  // Rooms
  ADD_ROOM: 'ADD_ROOM',
  UPDATE_ROOM: 'UPDATE_ROOM',
  DELETE_ROOM: 'DELETE_ROOM',

  // Timetable
  INIT_TIMETABLE_GRID: 'INIT_TIMETABLE_GRID',
  UPDATE_TIMETABLE_SLOT: 'UPDATE_TIMETABLE_SLOT',
  CLEAR_TIMETABLE_SLOT: 'CLEAR_TIMETABLE_SLOT',
  SET_TIMETABLE_PHASE: 'SET_TIMETABLE_PHASE',
  PUBLISH_TIMETABLE: 'PUBLISH_TIMETABLE',

  // Section-Subject Mapping
  SET_SECTION_SUBJECTS: 'SET_SECTION_SUBJECTS',

  // Assignments
  ADD_ASSIGNMENT: 'ADD_ASSIGNMENT',
  UPDATE_ASSIGNMENT: 'UPDATE_ASSIGNMENT',
  DELETE_ASSIGNMENT: 'DELETE_ASSIGNMENT',

  // Absences
  ADD_ABSENCE: 'ADD_ABSENCE',
  UPDATE_ABSENCE: 'UPDATE_ABSENCE',

  // Notifications
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',

  // Audit Log
  ADD_AUDIT_ENTRY: 'ADD_AUDIT_ENTRY',

  // Settings & Rules
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  UPDATE_RULES: 'UPDATE_RULES',

  // UI
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',

  // Semesters
  ADD_SEMESTER: 'ADD_SEMESTER',
  UPDATE_SEMESTER: 'UPDATE_SEMESTER',
  SET_CURRENT_SEMESTER: 'SET_CURRENT_SEMESTER',
};

// ─── Reducer ──────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    // Auth
    case ACTIONS.LOGIN:
      return { ...state, currentUser: action.payload, isAuthenticated: true, authError: null };
    case ACTIONS.LOGOUT:
      return { ...state, currentUser: null, isAuthenticated: false };
    case ACTIONS.AUTH_ERROR:
      return { ...state, authError: action.payload };

    // Faculty
    case ACTIONS.ADD_FACULTY:
      return { ...state, faculty: [...state.faculty, action.payload] };
    case ACTIONS.UPDATE_FACULTY:
      return {
        ...state,
        faculty: state.faculty.map((f) => f.id === action.payload.id ? { ...f, ...action.payload } : f),
      };
    case ACTIONS.DELETE_FACULTY:
      return { ...state, faculty: state.faculty.filter((f) => f.id !== action.payload) };

    // Subjects
    case ACTIONS.ADD_SUBJECT:
      return { ...state, subjects: [...state.subjects, action.payload] };
    case ACTIONS.UPDATE_SUBJECT:
      return { ...state, subjects: state.subjects.map((s) => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case ACTIONS.DELETE_SUBJECT:
      return { ...state, subjects: state.subjects.filter((s) => s.id !== action.payload) };

    // Sections
    case ACTIONS.ADD_SECTION:
      return { ...state, sections: [...state.sections, action.payload] };
    case ACTIONS.UPDATE_SECTION:
      return { ...state, sections: state.sections.map((s) => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case ACTIONS.DELETE_SECTION:
      return { ...state, sections: state.sections.filter((s) => s.id !== action.payload) };

    // Rooms
    case ACTIONS.ADD_ROOM:
      return { ...state, rooms: [...state.rooms, action.payload] };
    case ACTIONS.UPDATE_ROOM:
      return { ...state, rooms: state.rooms.map((r) => r.id === action.payload.id ? { ...r, ...action.payload } : r) };
    case ACTIONS.DELETE_ROOM:
      return { ...state, rooms: state.rooms.filter((r) => r.id !== action.payload) };

    // Timetable
    case ACTIONS.INIT_TIMETABLE_GRID: {
      const { sectionId, grid } = action.payload;
      return { ...state, timetableGrids: { ...state.timetableGrids, [sectionId]: grid } };
    }
    case ACTIONS.UPDATE_TIMETABLE_SLOT: {
      const { sectionId, key, assignment } = action.payload;
      const currentGrid = state.timetableGrids[sectionId] ?? createEmptyGrid();
      return {
        ...state,
        timetableGrids: {
          ...state.timetableGrids,
          [sectionId]: { ...currentGrid, [key]: { ...currentGrid[key], assignment } },
        },
      };
    }
    case ACTIONS.CLEAR_TIMETABLE_SLOT: {
      const { sectionId, key } = action.payload;
      const currentGrid = state.timetableGrids[sectionId] ?? createEmptyGrid();
      return {
        ...state,
        timetableGrids: {
          ...state.timetableGrids,
          [sectionId]: { ...currentGrid, [key]: { ...currentGrid[key], assignment: null } },
        },
      };
    }
    case ACTIONS.SET_TIMETABLE_PHASE:
      return {
        ...state,
        timetablePhases: { ...state.timetablePhases, [action.payload.sectionId]: action.payload.phase },
      };
    case ACTIONS.PUBLISH_TIMETABLE:
      return {
        ...state,
        timetablePhases: { ...state.timetablePhases, [action.payload]: 'PUBLISHED' },
      };

    // Section Subjects
    case ACTIONS.SET_SECTION_SUBJECTS:
      return {
        ...state,
        sectionSubjects: { ...state.sectionSubjects, [action.payload.sectionId]: action.payload.subjectIds },
      };

    // Assignments
    case ACTIONS.ADD_ASSIGNMENT:
      return { ...state, assignments: [...state.assignments, action.payload] };
    case ACTIONS.UPDATE_ASSIGNMENT:
      return { ...state, assignments: state.assignments.map((a) => a.id === action.payload.id ? { ...a, ...action.payload } : a) };
    case ACTIONS.DELETE_ASSIGNMENT:
      return { ...state, assignments: state.assignments.filter((a) => a.id !== action.payload) };

    // Absences
    case ACTIONS.ADD_ABSENCE:
      return { ...state, absences: [...state.absences, action.payload] };
    case ACTIONS.UPDATE_ABSENCE:
      return { ...state, absences: state.absences.map((a) => a.id === action.payload.id ? { ...a, ...action.payload } : a) };

    // Notifications
    case ACTIONS.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map((n) => n.id === action.payload ? { ...n, read: true } : n),
      };
    case ACTIONS.ADD_NOTIFICATION:
      return { ...state, notifications: [action.payload, ...state.notifications] };

    // Audit Log
    case ACTIONS.ADD_AUDIT_ENTRY:
      return { ...state, auditLog: [action.payload, ...state.auditLog] };

    // Settings & Rules
    case ACTIONS.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case ACTIONS.UPDATE_RULES:
      return { ...state, rules: action.payload };

    // UI
    case ACTIONS.TOGGLE_SIDEBAR:
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case ACTIONS.ADD_TOAST:
      return { ...state, toasts: [...state.toasts, action.payload] };
    case ACTIONS.REMOVE_TOAST:
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };

    // Semesters
    case ACTIONS.ADD_SEMESTER:
      return { ...state, semesters: [...state.semesters, action.payload] };
    case ACTIONS.UPDATE_SEMESTER:
      return { ...state, semesters: state.semesters.map((s) => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case ACTIONS.SET_CURRENT_SEMESTER:
      return { ...state, currentSemester: action.payload };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Derived: workload stats (recomputed when faculty/assignments/settings/timetable change)
  const facultyTimetables = deriveFacultyTimetables(state.timetableGrids);
  
  const facultyWithDynamicLoad = state.faculty.map(f => {
      const timetableEntries = facultyTimetables.get(f.id) || [];
      const theoryHoursFromGrid = timetableEntries.filter(e => e.type !== 'LAB').length;
      const labHoursFromGrid = timetableEntries.filter(e => e.type === 'LAB').length;

      return {
          ...f,
          responsibilities: {
              ...f.responsibilities,
              theoryHours: (f.responsibilities?.theoryHours || 0) + theoryHoursFromGrid,
              labHours: (f.responsibilities?.labHours || 0) + labHoursFromGrid
          }
      };
  }).filter((f) => f.status !== 'ON_LEAVE');

  const workloadStats = getDepartmentWorkloadStats(
    facultyWithDynamicLoad,
    state.settings.workloadWeights,
    {
      overloaded: state.settings.workloadThresholds.overloaded,
      balanced: {
        min: state.settings.workloadThresholds.balancedMin,
        max: state.settings.workloadThresholds.balancedMax,
      },
      underloaded: state.settings.workloadThresholds.balancedMin,
    }
  );

  // Derived: unread notification count
  const unreadCount = state.notifications.filter(
    (n) => !n.read && (n.userId === state.currentUser?.id || n.userId === state.currentUser?.role)
  ).length;

  // Derived: pending approvals count
  const pendingApprovals = {
    absences: state.absences.filter((a) => a.status === 'PENDING_HOD').length,
    total: state.absences.filter((a) => a.status === 'PENDING_HOD').length,
  };

  // Helper: add audit entry
  const addAuditEntry = (action, entity, entityId, detail) => {
    dispatch({
      type: ACTIONS.ADD_AUDIT_ENTRY,
      payload: {
        id: `AUD_${Date.now()}`,
        userId: state.currentUser?.id,
        userName: state.currentUser?.name,
        action,
        entity,
        entityId,
        detail,
        timestamp: new Date().toISOString(),
      },
    });
  };

  // Helper: show toast
  const showToast = (message, type = 'success', duration = 4000) => {
    const id = `TOAST_${Date.now()}`;
    dispatch({ type: ACTIONS.ADD_TOAST, payload: { id, message, type } });
    setTimeout(() => dispatch({ type: ACTIONS.REMOVE_TOAST, payload: id }), duration);
  };

  // Auth helpers
  const login = (email, password) => {
    const user = USERS.find((u) => u.email === email && u.password === password);
    if (user) {
      dispatch({ type: ACTIONS.LOGIN, payload: user });
      return true;
    }
    dispatch({ type: ACTIONS.AUTH_ERROR, payload: 'Invalid email or password.' });
    return false;
  };

  const logout = () => dispatch({ type: ACTIONS.LOGOUT });

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      workloadStats,
      unreadCount,
      pendingApprovals,
      addAuditEntry,
      showToast,
      login,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;
