// ============================================================
// FLEXIBLE RULE ENGINE
// Rules are data-driven objects. HOD can toggle/configure from Settings.
// New rules = add a rule object + register a validator. No arch changes.
// ============================================================

export const RULE_TYPES = { HARD: 'HARD', SOFT: 'SOFT' };
export const RULE_CATEGORIES = {
  TIMETABLE: 'TIMETABLE',
  WORKLOAD: 'WORKLOAD',
  ASSIGNMENT: 'ASSIGNMENT',
  FACULTY: 'FACULTY',
  ABSENCE: 'ABSENCE',
};

// Default rule definitions
export const DEFAULT_RULES = [
  {
    id: 'RULE_TT_001',
    name: 'Lunch Break Unassignable',
    type: RULE_TYPES.HARD,
    category: RULE_CATEGORIES.TIMETABLE,
    enabled: true,
    params: { breakPeriod: 'LUNCH' },
    description: 'Lunch period (13:20–14:20) cannot have any class assigned.',
    editable: false,
  },
  {
    id: 'RULE_TT_002',
    name: 'Morning Break Unassignable',
    type: RULE_TYPES.HARD,
    category: RULE_CATEGORIES.TIMETABLE,
    enabled: true,
    params: { breakPeriod: 'BREAK' },
    description: 'Morning break (10:25–10:50) cannot have any class assigned.',
    editable: false,
  },
  {
    id: 'RULE_TT_003',
    name: 'No Duplicate Subject in Same Day',
    type: RULE_TYPES.HARD,
    category: RULE_CATEGORIES.TIMETABLE,
    enabled: true,
    params: {},
    description: 'A class cannot have the same theory subject more than once per day.',
    editable: true,
  },
  {
    id: 'RULE_TT_004',
    name: 'Labs Must Be Consecutive',
    type: RULE_TYPES.HARD,
    category: RULE_CATEGORIES.TIMETABLE,
    enabled: true,
    params: { minConsecutive: 2 },
    description: 'Lab sessions must occupy at least 2 consecutive periods.',
    editable: true,
  },
  {
    id: 'RULE_TT_005',
    name: 'No More Than 1 Lab Per Day Per Section',
    type: RULE_TYPES.SOFT,
    category: RULE_CATEGORIES.TIMETABLE,
    enabled: true,
    params: {},
    description: 'A section should not have more than one lab session per day.',
    editable: true,
  },
  {
    id: 'RULE_TT_006',
    name: 'Concentration-Based Subject Placement',
    type: RULE_TYPES.SOFT,
    category: RULE_CATEGORIES.TIMETABLE,
    enabled: true,
    params: {
      hardSubjectPeriods: [1, 2],
      labPeriods: [6, 7],
    },
    description:
      'Hard/core subjects should be in morning periods (1–2). Labs should be post-lunch (6–7).',
    editable: true,
  },
  {
    id: 'RULE_AS_001',
    name: 'Expert Priority for Theory',
    type: RULE_TYPES.SOFT,
    category: RULE_CATEGORIES.ASSIGNMENT,
    enabled: true,
    params: { preferredSkillLevel: 'Expert' },
    description: 'Faculty with Expert skill level gets priority for theory classes.',
    editable: true,
  },
  {
    id: 'RULE_AS_002',
    name: 'Minimum Lab Skill Level',
    type: RULE_TYPES.HARD,
    category: RULE_CATEGORIES.ASSIGNMENT,
    enabled: true,
    params: { minSkillLevel: 'Intermediate', minSkillScore: 60 },
    description: 'Faculty must have at least Intermediate skill to conduct lab sessions.',
    editable: true,
  },
  {
    id: 'RULE_AS_003',
    name: 'Faculty Cannot Teach Unknown Subject',
    type: RULE_TYPES.SOFT,
    category: RULE_CATEGORIES.ASSIGNMENT,
    enabled: true,
    params: { allowHODOverride: true },
    description: 'Faculty should not be assigned to subjects outside their skill list (HOD can override).',
    editable: true,
  },
  {
    id: 'RULE_WL_001',
    name: 'Workload Limit Warning',
    type: RULE_TYPES.SOFT,
    category: RULE_CATEGORIES.WORKLOAD,
    enabled: true,
    params: { allowHODOverride: true },
    description: 'Warn when faculty effective workload exceeds their designation limit.',
    editable: true,
  },
  {
    id: 'RULE_WL_002',
    name: 'Underload Alert',
    type: RULE_TYPES.SOFT,
    category: RULE_CATEGORIES.WORKLOAD,
    enabled: true,
    params: { underloadThreshold: 70 },
    description: 'Alert when faculty workload utilization falls below 70%.',
    editable: true,
  },
  {
    id: 'RULE_FA_001',
    name: 'Replacement Must Have Required Skill',
    type: RULE_TYPES.HARD,
    category: RULE_CATEGORIES.ABSENCE,
    enabled: true,
    params: { minSkillScore: 60 },
    description: 'Replacement faculty must have at least Intermediate skill for the subject.',
    editable: true,
  },
  {
    id: 'RULE_FA_002',
    name: 'Replacement Workload Check',
    type: RULE_TYPES.SOFT,
    category: RULE_CATEGORIES.ABSENCE,
    enabled: true,
    params: { allowOverride: true },
    description: 'Replacement should not push faculty over their workload limit.',
    editable: true,
  },
];

// Rule registry — validators keyed by rule ID
const ruleValidators = {
  RULE_TT_001: (context) => {
    const { slot } = context;
    if (slot?.type === 'LUNCH') return { pass: false, message: 'Lunch break period cannot be assigned.' };
    return { pass: true };
  },
  RULE_TT_002: (context) => {
    const { slot } = context;
    if (slot?.type === 'BREAK') return { pass: false, message: 'Morning break period cannot be assigned.' };
    return { pass: true };
  },
  RULE_TT_003: (context) => {
    const { existingSlots, subjectId, day } = context;
    const sameDay = existingSlots.filter(
      (s) => s.day === day && s.subjectId === subjectId && s.type !== 'LAB'
    );
    if (sameDay.length > 0) return { pass: false, message: 'Subject already scheduled on this day.' };
    return { pass: true };
  },
  RULE_AS_002: (context) => {
    const { faculty, subject } = context;
    if (subject?.type !== 'LAB') return { pass: true };
    const skill = faculty?.skills?.find((s) => s.subjectId === subject.id);
    const skillScores = { Expert: 100, Advanced: 80, Intermediate: 60, Beginner: 30 };
    if (!skill || (skillScores[skill.level] ?? 0) < 60) {
      return { pass: false, message: `${faculty?.name} lacks minimum skill (Intermediate) for this lab.` };
    }
    return { pass: true };
  },
  RULE_WL_001: (context) => {
    const { faculty, additionalHours, weights } = context;
    const currentEffective = faculty?.effectiveWorkload ?? 0;
    const limit = faculty?.workloadLimit ?? 20;
    const newEffective = currentEffective + additionalHours * (weights?.theory ?? 1.0);
    if (newEffective > limit) {
      return {
        pass: false,
        message: `${faculty?.name} will exceed workload limit (${newEffective.toFixed(1)}h > ${limit}h).`,
      };
    }
    return { pass: true };
  },
};

/**
 * Evaluate a set of rules against a context object.
 * Returns { violations: [{rule, message}], warnings: [{rule, message}] }
 */
export function evaluateRules(ruleSet, context) {
  const violations = [];
  const warnings = [];

  for (const rule of ruleSet) {
    if (!rule.enabled) continue;
    const validator = ruleValidators[rule.id];
    if (!validator) continue;
    const result = validator(context);
    if (!result.pass) {
      if (rule.type === RULE_TYPES.HARD) {
        violations.push({ rule, message: result.message });
      } else {
        warnings.push({ rule, message: result.message });
      }
    }
  }

  return { violations, warnings };
}

export function getRulesByCategory(rules, category) {
  return rules.filter((r) => r.category === category);
}

export function toggleRule(rules, ruleId) {
  return rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
}

export function updateRuleParams(rules, ruleId, params) {
  return rules.map((r) => (r.id === ruleId ? { ...r, params: { ...r.params, ...params } } : r));
}
