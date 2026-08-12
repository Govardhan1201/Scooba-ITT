// ============================================================
// TIMETABLE ENGINE
// Handles: slot definitions, phase state machine, collision detection,
// auto-suggest (concentration-based), grid helpers
// ============================================================

// ─── Time Slot Definitions ───────────────────────────────────
export const TIME_SLOTS = [
  { id: 1, label: '08:45 – 09:35', start: '08:45', end: '09:35', type: 'NORMAL', period: 1 },
  { id: 2, label: '09:35 – 10:25', start: '09:35', end: '10:25', type: 'NORMAL', period: 2 },
  { id: 'BREAK', label: '10:25 – 10:50', start: '10:25', end: '10:50', type: 'BREAK', period: null },
  { id: 3, label: '10:50 – 11:40', start: '10:50', end: '11:40', type: 'NORMAL', period: 3 },
  { id: 4, label: '11:40 – 12:30', start: '11:40', end: '12:30', type: 'NORMAL', period: 4 },
  { id: 5, label: '12:30 – 13:20', start: '12:30', end: '13:20', type: 'NORMAL', period: 5 },
  { id: 'LUNCH', label: '13:20 – 14:20', start: '13:20', end: '14:20', type: 'LUNCH', period: null },
  { id: 6, label: '14:20 – 15:10', start: '14:20', end: '15:10', type: 'NORMAL', period: 6 },
  { id: 7, label: '15:10 – 16:00', start: '15:10', end: '16:00', type: 'NORMAL', period: 7 },
];

export const TEACHING_SLOTS = TIME_SLOTS.filter((s) => s.type === 'NORMAL');
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Phase State Machine ─────────────────────────────────────
export const TIMETABLE_PHASES = {
  NOT_STARTED: 'NOT_STARTED',
  PHASE1_DRAFT: 'PHASE1_DRAFT',
  PHASE1_COMPLETE: 'PHASE1_COMPLETE',
  PHASE2_IN_PROGRESS: 'PHASE2_IN_PROGRESS',
  PHASE2_COMPLETE: 'PHASE2_COMPLETE',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  PUBLISHED: 'PUBLISHED',
};

export const PHASE_LABELS = {
  NOT_STARTED: 'Not Started',
  PHASE1_DRAFT: 'Phase 1 — Subject Placement',
  PHASE1_COMPLETE: 'Phase 1 Complete',
  PHASE2_IN_PROGRESS: 'Phase 2 — Faculty Assignment',
  PHASE2_COMPLETE: 'Phase 2 Complete',
  PENDING_APPROVAL: 'Pending HOD Approval',
  PUBLISHED: 'Published',
};

export function canTransitionTo(currentPhase, targetPhase) {
  const transitions = {
    NOT_STARTED: ['PHASE1_DRAFT'],
    PHASE1_DRAFT: ['PHASE1_COMPLETE'],
    PHASE1_COMPLETE: ['PHASE1_DRAFT', 'PHASE2_IN_PROGRESS'],
    PHASE2_IN_PROGRESS: ['PHASE2_COMPLETE', 'PHASE1_COMPLETE'],
    PHASE2_COMPLETE: ['PENDING_APPROVAL', 'PHASE2_IN_PROGRESS'],
    PENDING_APPROVAL: ['PUBLISHED', 'PHASE2_COMPLETE'],
    PUBLISHED: [],
  };
  return transitions[currentPhase]?.includes(targetPhase) ?? false;
}

// ─── Grid Key Helper ─────────────────────────────────────────
export function slotKey(day, periodId) {
  return `${day}_${periodId}`;
}

export function parseSlotKey(key) {
  const [day, periodId] = key.split('_');
  return { day, periodId: isNaN(periodId) ? periodId : Number(periodId) };
}

// ─── Empty Grid Generator ─────────────────────────────────────
export function createEmptyGrid() {
  const grid = {};
  DAYS.forEach((day) => {
    TIME_SLOTS.forEach((slot) => {
      grid[slotKey(day, slot.id)] = {
        day,
        slotId: slot.id,
        slotType: slot.type,
        assignment: null, // { subjectId, facultyId (Phase 2), type }
      };
    });
  });
  return grid;
}

// ─── Collision Detection ─────────────────────────────────────
/**
 * Detect faculty collisions across all sections in a semester.
 * Returns array of collision objects.
 */
export function detectCollisions(allSectionGrids, facultyId, day, slotId, excludeKey = null) {
  const collisions = [];
  for (const [sectionId, grid] of Object.entries(allSectionGrids)) {
    const key = slotKey(day, slotId);
    if (key === excludeKey) continue;
    const cell = grid[key];
    if (cell?.assignment?.facultyId === facultyId) {
      collisions.push({ sectionId, day, slotId, type: 'FACULTY_CONFLICT' });
    }
  }
  return collisions;
}

/**
 * Check if a subject is already placed on a given day for a section (RULE_TT_003)
 */
export function hasSubjectOnDay(grid, subjectId, day) {
  return TEACHING_SLOTS.some((slot) => {
    const cell = grid[slotKey(day, slot.id)];
    return cell?.assignment?.subjectId === subjectId;
  });
}

/**
 * Check consecutive lab slots
 */
export function areConsecutiveSlots(slotId1, slotId2) {
  const periods = TEACHING_SLOTS.map((s) => s.id);
  const idx1 = periods.indexOf(slotId1);
  const idx2 = periods.indexOf(slotId2);
  return Math.abs(idx1 - idx2) === 1;
}

/**
 * Get all collisions in a section's grid (Phase 2)
 */
export function getAllCollisions(grid, allSectionGrids, currentSectionId) {
  const collisions = [];
  DAYS.forEach((day) => {
    TEACHING_SLOTS.forEach((slot) => {
      const cell = grid[slotKey(day, slot.id)];
      if (!cell?.assignment?.facultyId) return;
      const others = detectCollisions(
        allSectionGrids,
        cell.assignment.facultyId,
        day,
        slot.id
      );
      others
        .filter((c) => c.sectionId !== currentSectionId)
        .forEach((c) => collisions.push({ ...c, conflictingKey: slotKey(day, slot.id) }));
    });
  });
  return collisions;
}

// ─── Phase 1 Completeness Check ──────────────────────────────
/**
 * Returns { complete, missingHours } for Phase 1.
 * A section's Phase 1 is complete when all subjects have their required
 * weekly hours placed in the grid.
 */
export function checkPhase1Complete(grid, subjects) {
  const placedHours = {};
  DAYS.forEach((day) => {
    TEACHING_SLOTS.forEach((slot) => {
      const cell = grid[slotKey(day, slot.id)];
      if (cell?.assignment?.subjectId) {
        const id = cell.assignment.subjectId;
        placedHours[id] = (placedHours[id] ?? 0) + 1;
      }
    });
  });
  const missingHours = [];
  for (const subject of subjects) {
    const placed = placedHours[subject.id] ?? 0;
    const required = subject.hoursPerWeek ?? 0;
    if (placed < required) {
      missingHours.push({ subjectId: subject.id, subjectName: subject.name, required, placed });
    }
  }
  return { complete: missingHours.length === 0, missingHours };
}

// ─── Phase 2 Completeness Check ──────────────────────────────
export function checkPhase2Complete(grid) {
  for (const day of DAYS) {
    for (const slot of TEACHING_SLOTS) {
      const cell = grid[slotKey(day, slot.id)];
      if (cell?.assignment?.subjectId && !cell?.assignment?.facultyId) {
        return false;
      }
    }
  }
  return true;
}

// ─── Concentration-Based Auto-Suggest ────────────────────────
/**
 * Smart subject placement based on cognitive science:
 * - Periods 1–2 (peak focus): hard/core subjects
 * - Periods 3–5 (sustained): medium difficulty
 * - Periods 6–7 (post-lunch): labs, practicals, light subjects
 *
 * Returns a pre-filled grid suggestion.
 */
export function autoSuggestPlacement(subjects) {
  const grid = createEmptyGrid();
  
  // Sort subjects into difficulty buckets
  const hard = subjects.filter((s) => s.difficulty === 'High' && s.type !== 'LAB');
  const medium = subjects.filter((s) => s.difficulty === 'Medium' && s.type !== 'LAB');
  const light = subjects.filter((s) => s.difficulty === 'Low' && s.type !== 'LAB');
  const labs = subjects.filter((s) => s.type === 'LAB');

  // Slot buckets by concentration level
  const morningSlots = []; // Periods 1,2 → high focus
  const midSlots = [];     // Periods 3,4,5
  const postLunchSlots = [];// Periods 6,7 → labs

  DAYS.forEach((day) => {
    morningSlots.push({ day, slotId: 1 }, { day, slotId: 2 });
    midSlots.push({ day, slotId: 3 }, { day, slotId: 4 }, { day, slotId: 5 });
    postLunchSlots.push({ day, slotId: 6 }, { day, slotId: 7 });
  });

  // Expand subjects to individual slots based on hoursPerWeek
  const hardQueue = expandSubjectsToSlots(hard);
  const mediumQueue = expandSubjectsToSlots(medium);
  const lightQueue = expandSubjectsToSlots(light);

  // Place in grid
  placeInSlots(grid, hardQueue, morningSlots);
  placeInSlots(grid, mediumQueue, midSlots);
  placeInSlots(grid, lightQueue, [...midSlots, ...morningSlots]);
  placeLabs(grid, labs, postLunchSlots);

  return grid;
}

function expandSubjectsToSlots(subjects) {
  const queue = [];
  subjects.forEach((s) => {
    for (let i = 0; i < (s.hoursPerWeek ?? 0); i++) {
      queue.push({ subjectId: s.id, type: 'THEORY' });
    }
  });
  return queue;
}

function placeInSlots(grid, queue, slots) {
  let qi = 0;
  for (const slot of slots) {
    if (qi >= queue.length) break;
    const key = slotKey(slot.day, slot.slotId);
    if (!grid[key]?.assignment) {
      grid[key].assignment = queue[qi];
      qi++;
    }
  }
}

function placeLabs(grid, labs, postLunchSlots) {
  labs.forEach((lab) => {
    // Labs need 2 consecutive post-lunch slots on the same day
    for (const day of DAYS) {
      const daySlots = postLunchSlots.filter((s) => s.day === day);
      if (daySlots.length >= 2) {
        const k6 = slotKey(day, 6);
        const k7 = slotKey(day, 7);
        if (!grid[k6]?.assignment && !grid[k7]?.assignment) {
          grid[k6].assignment = { subjectId: lab.id, type: 'LAB' };
          grid[k7].assignment = { subjectId: lab.id, type: 'LAB', continued: true };
          break;
        }
      }
    }
  });
}

// ─── Faculty Timetable Derivation ─────────────────────────────
/**
 * Derive individual faculty timetables from all section grids.
 * Returns Map<facultyId, [{day, slot, sectionId, subjectId}]>
 */
export function deriveFacultyTimetables(allSectionGrids) {
  const facultyMap = new Map();
  for (const [sectionId, grid] of Object.entries(allSectionGrids)) {
    for (const [key, cell] of Object.entries(grid)) {
      if (!cell?.assignment?.facultyId) continue;
      const { facultyId } = cell.assignment;
      if (!facultyMap.has(facultyId)) facultyMap.set(facultyId, []);
      facultyMap.get(facultyId).push({
        key,
        day: cell.day,
        slotId: cell.slotId,
        sectionId,
        subjectId: cell.assignment.subjectId,
        type: cell.assignment.type,
      });
    }
  }
  return facultyMap;
}
