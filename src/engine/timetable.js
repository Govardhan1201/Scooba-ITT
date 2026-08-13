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
/**
 * Detect faculty collisions across ALL sections across ALL years.
 */
export function detectCollisions(allSectionGrids, facultyId, day, slotId, excludeKey = null) {
  const collisions = [];
  if (!facultyId) return collisions;
  for (const [sectionId, grid] of Object.entries(allSectionGrids)) {
    const key = slotKey(day, slotId);
    if (key === excludeKey) continue;
    const cell = grid[key];
    // Check primary faculty
    if (cell?.assignment?.facultyId === facultyId) {
      collisions.push({ sectionId, day, slotId, type: 'FACULTY_CONFLICT' });
    }
    // Check secondary faculty (for LABs)
    if (cell?.assignment?.facultyId2 === facultyId) {
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

/**
 * Smart subject placement based on cognitive science:
 * - Fills the exact hours required by each subject.
 * - Spreads subjects evenly across the week.
 * - Periods 1–2 (peak focus): hard/core subjects
 * - Periods 3–5 (sustained): medium difficulty
 * - Periods 6–7 (post-lunch): labs, practicals, light subjects
 */
export function autoSuggestPlacement(subjects) {
  const grid = createEmptyGrid();
  
  // Sort subjects into difficulty buckets
  const hard = subjects.filter((s) => s.difficulty === 'High' && s.type !== 'LAB');
  const medium = subjects.filter((s) => s.difficulty === 'Medium' && s.type !== 'LAB');
  const light = subjects.filter((s) => (s.difficulty === 'Low' || !s.difficulty) && s.type !== 'LAB');
  const labs = subjects.filter((s) => s.type === 'LAB');

  // We want to randomize day arrays to distribute load
  const shuffledDays = () => [...DAYS].sort(() => Math.random() - 0.5);

  const placeTheory = (subjectList, allowedPeriods) => {
    subjectList.forEach(sub => {
      let hoursNeeded = sub.hoursPerWeek || 3;
      let hoursPlaced = 0;
      
      // Try to place max 1 hour per day
      for (const day of shuffledDays()) {
        if (hoursPlaced >= hoursNeeded) break;
        // Check if subject is already on this day to avoid cognitive overload (unless forced)
        if (hasSubjectOnDay(grid, sub.id, day) && hoursNeeded <= 6) continue;
        
        for (const period of allowedPeriods) {
          const key = slotKey(day, period);
          if (!grid[key].assignment) {
            grid[key].assignment = { subjectId: sub.id, type: 'THEORY' };
            hoursPlaced++;
            break; // Move to next day
          }
        }
      }
      
      // If we still need hours (grid is getting full), fall back to any available slot
      if (hoursPlaced < hoursNeeded) {
        for (const day of DAYS) {
          if (hoursPlaced >= hoursNeeded) break;
          for (const slot of TEACHING_SLOTS) {
            const key = slotKey(day, slot.id);
            if (!grid[key].assignment) {
              grid[key].assignment = { subjectId: sub.id, type: 'THEORY' };
              hoursPlaced++;
              if (hoursPlaced >= hoursNeeded) break;
            }
          }
        }
      }
    });
  };

  const placeLabs = (labList) => {
    labList.forEach(lab => {
      let hoursNeeded = lab.hoursPerWeek || 3;
      let sessionsNeeded = Math.ceil(hoursNeeded / 2); // 2 hours per lab session typically
      let sessionsPlaced = 0;

      for (const day of shuffledDays()) {
        if (sessionsPlaced >= sessionsNeeded) break;
        // Labs prefer periods 6 and 7
        const k6 = slotKey(day, 6);
        const k7 = slotKey(day, 7);
        if (!grid[k6].assignment && !grid[k7].assignment) {
          grid[k6].assignment = { subjectId: lab.id, type: 'LAB' };
          grid[k7].assignment = { subjectId: lab.id, type: 'LAB', continued: true };
          sessionsPlaced++;
        }
      }
      
      // Fallback to periods 3,4,5 if 6,7 are full
      if (sessionsPlaced < sessionsNeeded) {
        for (const day of shuffledDays()) {
          if (sessionsPlaced >= sessionsNeeded) break;
          const k3 = slotKey(day, 3);
          const k4 = slotKey(day, 4);
          const k5 = slotKey(day, 5);
          if (!grid[k3].assignment && !grid[k4].assignment && !grid[k5].assignment) {
             grid[k3].assignment = { subjectId: lab.id, type: 'LAB' };
             grid[k4].assignment = { subjectId: lab.id, type: 'LAB', continued: true };
             grid[k5].assignment = { subjectId: lab.id, type: 'LAB', continued: true };
             sessionsPlaced++;
          } else if (!grid[k4].assignment && !grid[k5].assignment) {
             grid[k4].assignment = { subjectId: lab.id, type: 'LAB' };
             grid[k5].assignment = { subjectId: lab.id, type: 'LAB', continued: true };
             sessionsPlaced++;
          }
        }
      }
    });
  };

  // Execute placements
  placeLabs(labs); // Place labs first as they need consecutive blocks
  placeTheory(hard, [1, 2, 3]); // Hard subjects in morning
  placeTheory(medium, [3, 4, 5]); // Medium subjects mid-day
  placeTheory(light, [1, 2, 3, 4, 5, 6, 7]); // Light subjects anywhere available

  return grid;
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
