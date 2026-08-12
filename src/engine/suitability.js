// ============================================================
// SUITABILITY ENGINE
// Ranks faculty for a given subject/task based on multiple factors
// ============================================================

export const SKILL_LEVELS = ['Expert', 'Advanced', 'Intermediate', 'Beginner'];
export const SKILL_SCORES = { Expert: 100, Advanced: 80, Intermediate: 60, Beginner: 30, None: 0 };

// ─── Skill Match Score ────────────────────────────────────────
export function getSkillMatchScore(faculty, subjectId) {
  const skill = faculty.skills?.find((s) => s.subjectId === subjectId);
  return SKILL_SCORES[skill?.level ?? 'None'] ?? 0;
}

// ─── Capacity Score ───────────────────────────────────────────
export function getCapacityScore(remainingCapacity, hoursNeeded) {
  if (remainingCapacity <= 0) return 0;
  if (remainingCapacity >= hoursNeeded * 2) return 100;
  return Math.round((remainingCapacity / (hoursNeeded * 2)) * 100);
}

// ─── Availability Score ───────────────────────────────────────
export function getAvailabilityScore(faculty, day, slotId, facultyTimetable) {
  if (faculty.status !== 'ACTIVE') return 0;
  const isBusy = facultyTimetable?.some(
    (entry) => entry.day === day && entry.slotId === slotId
  );
  return isBusy ? 0 : 100;
}

// ─── Continuity Score ─────────────────────────────────────────
export function getContinuityScore(faculty, sectionId, subjectId, currentAssignments) {
  const already = currentAssignments?.some(
    (a) => a.facultyId === faculty.id && a.sectionId === sectionId && a.subjectId === subjectId
  );
  return already ? 100 : 60;
}

// ─── Preference Score ─────────────────────────────────────────
export function getPreferenceScore(faculty, subjectId) {
  const pref = faculty.preferences?.find((p) => p.subjectId === subjectId);
  if (!pref) return 50; // neutral
  const map = { preferred: 100, neutral: 50, avoid: 10 };
  return map[pref.level] ?? 50;
}

// ─── Composite Suitability Score ──────────────────────────────
const SCORE_WEIGHTS = {
  skillMatch: 0.35,
  capacity: 0.25,
  availability: 0.20,
  continuity: 0.10,
  preference: 0.10,
};

export function calculateSuitabilityScore(
  faculty,
  { subjectId, sectionId, day, slotId, hoursNeeded = 1 },
  facultyTimetable,
  currentAssignments,
  workloadProfile
) {
  const skillMatch = getSkillMatchScore(faculty, subjectId);
  const capacity = getCapacityScore(workloadProfile?.remainingCapacity ?? 0, hoursNeeded);
  const availability = getAvailabilityScore(faculty, day, slotId, facultyTimetable);
  const continuity = getContinuityScore(faculty, sectionId, subjectId, currentAssignments);
  const preference = getPreferenceScore(faculty, subjectId);

  const composite = Math.round(
    skillMatch * SCORE_WEIGHTS.skillMatch +
    capacity * SCORE_WEIGHTS.capacity +
    availability * SCORE_WEIGHTS.availability +
    continuity * SCORE_WEIGHTS.continuity +
    preference * SCORE_WEIGHTS.preference
  );

  return {
    facultyId: faculty.id,
    name: faculty.name,
    designation: faculty.designation,
    scores: { skillMatch, capacity, availability, continuity, preference },
    composite,
    workloadUtilization: workloadProfile?.utilization ?? 0,
    remainingCapacity: workloadProfile?.remainingCapacity ?? 0,
  };
}

/**
 * Rank all eligible faculty for a given slot.
 * Returns sorted array (highest score first).
 */
export function rankFacultyForSlot(
  facultyList,
  taskContext,
  allFacultyTimetables,
  currentAssignments,
  workloadProfiles,
  rules = []
) {
  const ranked = facultyList
    .filter((f) => f.status === 'ACTIVE')
    .map((faculty) => {
      const timetable = allFacultyTimetables?.get(faculty.id) ?? [];
      const profile = workloadProfiles?.find((p) => p.facultyId === faculty.id);
      const score = calculateSuitabilityScore(
        faculty,
        taskContext,
        timetable,
        currentAssignments,
        profile
      );

      // Check hard rules
      const hardViolations = [];
      if (taskContext.subjectType === 'LAB') {
        const skillScore = getSkillMatchScore(faculty, taskContext.subjectId);
        if (skillScore < 60) {
          hardViolations.push('Insufficient skill for lab');
        }
      }

      return { ...score, hardViolations, eligible: hardViolations.length === 0 };
    })
    .sort((a, b) => {
      // Ineligible always last
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return b.composite - a.composite;
    });

  return ranked;
}
