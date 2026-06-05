/**
 * Operational compliance bands + display scales for the Principal/School and
 * Teacher telemetry (FCR-3.6 / TPD). Lifted out of the views so a policy change
 * (e.g. State revises the PTR target or the TPD-hours floor) is a config edit,
 * not a code edit — consistent with the config-driven mandate. These are
 * service-delivery thresholds, distinct from the published KPI numbers in
 * kpiCatalog.ts (which remain the source of truth for KPI values).
 */
export const COMPLIANCE = {
  ptr: { green: 27, amber: 32 }, // pupil:teacher ratio (lower is better)
  classCapacity: { green: 30, amber: 33 }, // max students per class (lower is better)
  enrolment: { green: 150, amber: 120 }, // enrolment floor (higher is better)
  training: { green: 50, amber: 40 }, // avg school training hours / TPD hours (higher is better)
  chronicPctOfEnrolment: { green: 0.05, amber: 0.1 }, // chronic absentees as a share of enrolment (lower is better)
  defaults: { enrolment: 200, teachers: 10 }, // fallbacks when an entity has no enrolment/teacher meta
  tpdTargetHours: 50, // mirrors kpiCatalog tpd_hours target "Min 50 hrs/yr"
  needsImprovementBelow: 60, // teacher overall-% under which the supportive "needs improvement" copy shows
  gsqacDisplayMax: 1000, // GSQAC /100 quality score rendered out of 1000 on the scoreboard
} as const;
