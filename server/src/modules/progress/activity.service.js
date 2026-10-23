const { Activity } = require('../../models');

/**
 * Used by M3 (applications) and M4 (aptitude) — SAD component dependencies 2 and 3.
 * Activity recording is intentionally a secondary operation: callers decide
 * whether a failure should be logged without rolling back the main operation.
 */
async function recordActivity(studentId, type, refId) {
  if (!['TEST_COMPLETED', 'INTERNSHIP_APPLIED'].includes(type)) {
    throw new Error(`Unsupported activity type: ${type}`);
  }

  return Activity.create({ studentId, type, refId });
}

module.exports = { recordActivity };
