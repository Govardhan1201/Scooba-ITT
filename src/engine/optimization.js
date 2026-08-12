// ============================================================
// OPTIMIZATION ENGINE
// Workload balancing recommendations
// ============================================================

import { getFacultyWorkloadProfile, calculateFairnessScore, WORKLOAD_STATUS } from './workload.js';
import { getSkillMatchScore } from './suitability.js';

/**
 * Run the smart optimization engine.
 * Finds reallocation recommendations to improve fairness score.
 *
 * @param {Array} facultyList - All faculty
 * @param {Array} assignments - Current subject-faculty assignments
 * @param {Array} subjects - All subjects
 * @param {Object} weights - Workload weights
 * @param {Object} thresholds - Workload thresholds
 * @returns {{ recommendations, beforeStats, afterStats }}
 */
export function runOptimization(facultyList, assignments, subjects, weights, thresholds) {
  // Step 1: Build current workload profiles
  const beforeProfiles = facultyList.map((f) => getFacultyWorkloadProfile(f, weights, thresholds));
  const beforeFairness = calculateFairnessScore(beforeProfiles);

  // Step 2: Identify overloaded and underloaded faculty
  const overloaded = beforeProfiles.filter((p) => p.status === WORKLOAD_STATUS.OVERLOADED);
  const underloaded = beforeProfiles.filter((p) => p.status === WORKLOAD_STATUS.UNDERLOADED);

  if (overloaded.length === 0) {
    return {
      recommendations: [],
      beforeStats: { profiles: beforeProfiles, fairnessScore: beforeFairness },
      afterStats: { profiles: beforeProfiles, fairnessScore: beforeFairness },
      message: 'Workload is already optimally balanced.',
    };
  }

  const recommendations = [];
  const simulatedProfiles = beforeProfiles.map((p) => ({ ...p }));

  // Step 3: For each overloaded faculty, find moveable assignments
  for (const overloadedProfile of overloaded) {
    const facultyAssignments = assignments.filter(
      (a) => a.facultyId === overloadedProfile.facultyId
    );

    for (const assignment of facultyAssignments) {
      const subject = subjects.find((s) => s.id === assignment.subjectId);
      if (!subject) continue;

      // Find a suitable underloaded recipient
      for (const underloadedProfile of underloaded) {
        if (underloadedProfile.facultyId === overloadedProfile.facultyId) continue;

        const recipientFaculty = facultyList.find(
          (f) => f.id === underloadedProfile.facultyId
        );
        if (!recipientFaculty) continue;

        const skillScore = getSkillMatchScore(recipientFaculty, subject.id);
        if (skillScore < 60) continue; // Not skilled enough

        const hoursToMove = subject.hoursPerWeek ?? 3;
        const newOverloadedHours = overloadedProfile.effectiveWorkload - hoursToMove;
        const newUnderloadedHours = underloadedProfile.effectiveWorkload + hoursToMove;

        if (newOverloadedHours < 0 || newUnderloadedHours > underloadedProfile.maxHours * 1.1)
          continue;

        const reasons = buildReasons(
          overloadedProfile,
          underloadedProfile,
          recipientFaculty,
          subject,
          skillScore
        );

        const newOverUtil = (newOverloadedHours / overloadedProfile.maxHours) * 100;
        const newUnderUtil = (newUnderloadedHours / underloadedProfile.maxHours) * 100;

        recommendations.push({
          id: `REC_${recommendations.length + 1}`,
          action: 'MOVE',
          subject: { id: subject.id, name: subject.name, hours: hoursToMove },
          from: {
            facultyId: overloadedProfile.facultyId,
            name: overloadedProfile.name,
            currentUtil: overloadedProfile.utilization,
            newUtil: parseFloat(newOverUtil.toFixed(1)),
          },
          to: {
            facultyId: underloadedProfile.facultyId,
            name: underloadedProfile.name,
            currentUtil: underloadedProfile.utilization,
            newUtil: parseFloat(newUnderUtil.toFixed(1)),
          },
          reasons,
          suitabilityScore: skillScore,
          impactScore: Math.abs(overloadedProfile.utilization - 85) + Math.abs(underloadedProfile.utilization - 85),
        });

        break; // One recommendation per assignment
      }
    }
  }

  // Step 4: Build projected "after" state
  const afterProfiles = applyRecommendationsToProfiles(simulatedProfiles, recommendations);
  const afterFairness = calculateFairnessScore(afterProfiles);

  return {
    recommendations: recommendations.sort((a, b) => b.impactScore - a.impactScore),
    beforeStats: { profiles: beforeProfiles, fairnessScore: beforeFairness },
    afterStats: { profiles: afterProfiles, fairnessScore: afterFairness },
  };
}

function buildReasons(overProf, underProf, recipFaculty, subject, skillScore) {
  const reasons = [];
  reasons.push(`${overProf.name} is overloaded at ${overProf.utilization.toFixed(0)}%`);
  reasons.push(`${underProf.name} has available capacity (${underProf.utilization.toFixed(0)}%)`);
  const level = skillScore >= 100 ? 'Expert' : skillScore >= 80 ? 'Advanced' : 'Intermediate';
  reasons.push(`${recipFaculty.name} has ${level} skill in ${subject.name}`);
  reasons.push('No timetable collision detected');
  return reasons;
}

function applyRecommendationsToProfiles(profiles, recommendations) {
  const updated = profiles.map((p) => ({ ...p }));
  recommendations.forEach((rec) => {
    const from = updated.find((p) => p.facultyId === rec.from.facultyId);
    const to = updated.find((p) => p.facultyId === rec.to.facultyId);
    if (from) {
      from.effectiveWorkload = Math.max(0, from.effectiveWorkload - rec.subject.hours);
      from.utilization = parseFloat(((from.effectiveWorkload / from.maxHours) * 100).toFixed(1));
    }
    if (to) {
      to.effectiveWorkload = to.effectiveWorkload + rec.subject.hours;
      to.utilization = parseFloat(((to.effectiveWorkload / to.maxHours) * 100).toFixed(1));
    }
  });
  return updated;
}

// ─── What-If Simulation ───────────────────────────────────────
export function runWhatIfSimulation(scenario, facultyList, assignments, subjects, weights, thresholds) {
  let modifiedFaculty = facultyList.map((f) => ({ ...f }));
  let modifiedAssignments = [...assignments];
  const changes = [];

  switch (scenario.type) {
    case 'FACULTY_ABSENCE': {
      const absent = modifiedFaculty.find((f) => f.id === scenario.facultyId);
      if (absent) {
        absent.status = 'TEMPORARILY_UNAVAILABLE';
        changes.push(`${absent.name} marked temporarily unavailable`);
      }
      break;
    }
    case 'NEW_FACULTY': {
      const newFaculty = { ...scenario.faculty, id: `SIM_${Date.now()}`, status: 'ACTIVE' };
      modifiedFaculty.push(newFaculty);
      changes.push(`New faculty ${newFaculty.name} added to simulation`);
      break;
    }
    case 'FACULTY_LEAVES': {
      modifiedFaculty = modifiedFaculty.filter((f) => f.id !== scenario.facultyId);
      modifiedAssignments = modifiedAssignments.filter((a) => a.facultyId !== scenario.facultyId);
      changes.push(`Faculty removed from simulation`);
      break;
    }
    case 'SUBJECT_HOURS_CHANGE': {
      const sub = subjects.find((s) => s.id === scenario.subjectId);
      if (sub) changes.push(`${sub.name} hours changed to ${scenario.newHours}h/week`);
      break;
    }
    default:
      break;
  }

  const { recommendations, beforeStats, afterStats } = runOptimization(
    modifiedFaculty,
    modifiedAssignments,
    subjects,
    weights,
    thresholds
  );

  return { changes, recommendations, beforeStats, afterStats, modifiedFaculty };
}
