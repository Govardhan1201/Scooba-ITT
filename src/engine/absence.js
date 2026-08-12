// ============================================================
// ABSENCE ENGINE
// Handles: faculty absence analysis, replacement suggestions,
// suitability scoring, workload impact
// ============================================================

import { TEACHING_SLOTS, DAYS, slotKey } from './timetable.js';

const SKILL_LEVEL_SCORES = { Expert: 100, Advanced: 80, Intermediate: 60, Beginner: 30 };

export function getAffectedDayNames(startDate, endDate) {
  const days = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const cur = new Date(start);
  while (cur <= end) {
    const name = dayNames[cur.getDay()];
    if (DAYS.includes(name) && !days.includes(name)) {
      days.push(name);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function findAffectedClasses(facultyId, affectedDays, allSectionGrids) {
  const affected = [];
  for (const [sectionId, grid] of Object.entries(allSectionGrids)) {
    for (const day of affectedDays) {
      for (const slot of TEACHING_SLOTS) {
        const key = slotKey(day, slot.id);
        const cell = grid[key];
        if (cell?.assignment?.facultyId === facultyId) {
          affected.push({ sectionId, day, slotId: slot.id, slotLabel: slot.label, subjectId: cell.assignment.subjectId, type: cell.assignment.type ?? 'THEORY', key });
        }
      }
    }
  }
  return affected;
}

export function calcSuitabilityScore(candidate, subjectId, affectedSlots, allSectionGrids, workloadStats) {
  const skillEntry = candidate.skills?.find(s => s.subjectId === subjectId);
  const skillScore = skillEntry ? (SKILL_LEVEL_SCORES[skillEntry.level] ?? 0) * 0.4 : 0;
  const profile = workloadStats?.profiles?.find(p => p.facultyId === candidate.id);
  const remainingCapacity = profile?.remainingCapacity ?? 0;
  const capacityScore = Math.min(30, remainingCapacity * 3);
  const availabilityScore = affectedSlots.length > 0
    ? (affectedSlots.filter(s => { const avail = candidate.availability?.[s.day]; return avail === 'full' || avail === 'morning'; }).length / affectedSlots.length) * 20
    : 20;
  let hasCollision = false;
  for (const slot of affectedSlots) {
    for (const [sectionId, grid] of Object.entries(allSectionGrids)) {
      const key = slotKey(slot.day, slot.slotId);
      const cell = grid[key];
      if (cell?.assignment?.facultyId === candidate.id) { hasCollision = true; break; }
    }
    if (hasCollision) break;
  }
  const collisionScore = hasCollision ? 0 : 10;
  return { total: Math.round(skillScore + capacityScore + availabilityScore + collisionScore), skillScore: Math.round(skillScore), capacityScore: Math.round(capacityScore), availabilityScore: Math.round(availabilityScore), collisionScore, hasCollision };
}

export function buildReplacementPlan(absentFacultyId, affectedClasses, allFaculty, allSectionGrids, workloadStats) {
  return affectedClasses.map(affectedClass => {
    const candidates = allFaculty
      .filter(f => f.id !== absentFacultyId && f.status === 'ACTIVE' && f.skills?.some(s => s.subjectId === affectedClass.subjectId))
      .map(faculty => { const scoreData = calcSuitabilityScore(faculty, affectedClass.subjectId, [affectedClass], allSectionGrids, workloadStats); return { faculty, score: scoreData.total, breakdown: scoreData }; })
      .sort((a, b) => b.score - a.score);
    return { affectedClass, candidates, recommended: candidates[0] ?? null };
  });
}
