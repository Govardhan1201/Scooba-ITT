// ============================================================
// WORKLOAD ENGINE
// Handles: workload calculation, classification, fairness scoring
// ============================================================

// ─── Designation Defaults ────────────────────────────────────
export const DESIGNATION_DEFAULTS = {
  Professor: { maxHours: 10, label: 'Professor', shortLabel: 'Prof' },
  'Associate Professor': { maxHours: 16, label: 'Associate Professor', shortLabel: 'Assoc. Prof' },
  'Assistant Professor': { maxHours: 20, label: 'Assistant Professor', shortLabel: 'Asst. Prof' },
};

// ─── Responsibility Weight Defaults ──────────────────────────
export const DEFAULT_WEIGHTS = {
  theory: 1.0,
  laboratory: 1.2,
  projectGuidance: 1.3,
  examination: 1.5,
  mentoring: 0.8,
  departmentWork: 0.5,
};

// ─── Workload Status Thresholds ──────────────────────────────
export const DEFAULT_THRESHOLDS = {
  overloaded: 100,   // > 100% = overloaded
  balanced: { min: 70, max: 100 },
  underloaded: 70,   // < 70% = underloaded
};

export const WORKLOAD_STATUS = {
  OVERLOADED: 'OVERLOADED',
  BALANCED: 'BALANCED',
  UNDERLOADED: 'UNDERLOADED',
};

// ─── Core Calculation ─────────────────────────────────────────
/**
 * Calculate effective workload for a single faculty member.
 * @param {Object} faculty - Faculty object with responsibilities
 * @param {Object} weights - Responsibility weights (configurable)
 * @returns {Object} workload breakdown + totals
 */
export function calculateWorkload(faculty, weights = DEFAULT_WEIGHTS) {
  const r = faculty.responsibilities ?? {};

  const breakdown = {
    theory: (r.theoryHours ?? 0) * weights.theory,
    laboratory: (r.labHours ?? 0) * weights.laboratory,
    projectGuidance: (r.projectHours ?? 0) * weights.projectGuidance,
    examination: (r.examHours ?? 0) * weights.examination,
    mentoring: (r.mentoringHours ?? 0) * weights.mentoring,
    departmentWork: (r.deptHours ?? 0) * weights.departmentWork,
  };

  const rawHours = Object.values(r).reduce((a, b) => a + (b ?? 0), 0);
  const effectiveWorkload = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return {
    breakdown,
    rawHours,
    effectiveWorkload: parseFloat(effectiveWorkload.toFixed(2)),
    rawBreakdown: {
      theory: r.theoryHours ?? 0,
      laboratory: r.labHours ?? 0,
      projectGuidance: r.projectHours ?? 0,
      examination: r.examHours ?? 0,
      mentoring: r.mentoringHours ?? 0,
      departmentWork: r.deptHours ?? 0,
    },
  };
}

/**
 * Calculate utilization percentage.
 */
export function calculateUtilization(effectiveWorkload, maxHours) {
  if (!maxHours || maxHours === 0) return 0;
  return parseFloat(((effectiveWorkload / maxHours) * 100).toFixed(1));
}

/**
 * Classify workload status.
 */
export function classifyWorkload(utilization, thresholds = DEFAULT_THRESHOLDS) {
  if (utilization > thresholds.overloaded) return WORKLOAD_STATUS.OVERLOADED;
  if (utilization >= thresholds.balanced.min) return WORKLOAD_STATUS.BALANCED;
  return WORKLOAD_STATUS.UNDERLOADED;
}

/**
 * Full workload profile for one faculty member.
 */
export function getFacultyWorkloadProfile(faculty, weights = DEFAULT_WEIGHTS, thresholds = DEFAULT_THRESHOLDS) {
  const designationInfo = DESIGNATION_DEFAULTS[faculty.designation] ?? { maxHours: 20 };
  const maxHours = faculty.customWorkloadLimit ?? designationInfo.maxHours;
  const { breakdown, rawHours, effectiveWorkload, rawBreakdown } = calculateWorkload(faculty, weights);
  const utilization = calculateUtilization(effectiveWorkload, maxHours);
  const status = classifyWorkload(utilization, thresholds);
  const remainingCapacity = Math.max(0, maxHours - effectiveWorkload);

  return {
    facultyId: faculty.id,
    name: faculty.name,
    designation: faculty.designation,
    maxHours,
    rawHours,
    effectiveWorkload,
    utilization,
    status,
    remainingCapacity,
    breakdown,
    rawBreakdown,
  };
}

// ─── Department Workload Overview ────────────────────────────
/**
 * Calculates department-level workload statistics.
 */
export function getDepartmentWorkloadStats(facultyList, weights, thresholds) {
  const profiles = facultyList.map((f) => getFacultyWorkloadProfile(f, weights, thresholds));

  const overloaded = profiles.filter((p) => p.status === WORKLOAD_STATUS.OVERLOADED);
  const balanced = profiles.filter((p) => p.status === WORKLOAD_STATUS.BALANCED);
  const underloaded = profiles.filter((p) => p.status === WORKLOAD_STATUS.UNDERLOADED);

  const avgUtilization =
    profiles.length > 0
      ? parseFloat((profiles.reduce((a, p) => a + p.utilization, 0) / profiles.length).toFixed(1))
      : 0;

  const fairnessScore = calculateFairnessScore(profiles);

  return {
    total: facultyList.length,
    overloaded: overloaded.length,
    balanced: balanced.length,
    underloaded: underloaded.length,
    avgUtilization,
    fairnessScore,
    profiles,
  };
}

/**
 * Fairness score: 0–100. Higher = more balanced distribution.
 * Uses coefficient of variation (lower CV = higher fairness).
 */
export function calculateFairnessScore(profiles) {
  if (profiles.length === 0) return 0;
  const utilizations = profiles.map((p) => p.utilization);
  const mean = utilizations.reduce((a, b) => a + b, 0) / utilizations.length;
  if (mean === 0) return 100;
  const variance = utilizations.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / utilizations.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean; // coefficient of variation
  // Map CV to 0–100 score (CV=0 → 100, CV≥0.5 → 0)
  const score = Math.max(0, Math.min(100, Math.round((1 - cv / 0.5) * 100)));
  return score;
}

// ─── Teaching Hours From Timetable ───────────────────────────
/**
 * Count theory and lab hours for a faculty from their timetable entries.
 */
export function countTeachingHoursFromTimetable(facultyTimetableEntries) {
  let theoryHours = 0;
  let labHours = 0;
  facultyTimetableEntries.forEach((entry) => {
    if (entry.type === 'LAB') labHours += 1;
    else theoryHours += 1;
  });
  return { theoryHours, labHours };
}
