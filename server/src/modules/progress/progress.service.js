const { Activity, Application, Internship, Question, Result, Test } = require('../../models');

const RECENT_ACTIVITY_LIMIT = 10;
const REMOVED_LABEL = 'Removed item';

/**
 * Tests a student can take today: the test exists and has at least one question.
 *
 * @returns {Promise<Set<string>>} Available test IDs
 */
async function getAvailableTestIds() {
  const testIdsWithQuestions = await Question.distinct('testId');
  const tests = await Test.find({ _id: { $in: testIdsWithQuestions } }, '_id').lean();
  return new Set(tests.map((test) => String(test._id)));
}

/**
 * Load the student's latest activities and label each with its test or internship title.
 * The title is looked up by type, and falls back when the record has been deleted.
 *
 * @param {string} studentId
 * @returns {Promise<Array<{type: string, refId: string, label: string, at: Date}>>}
 */
async function getRecentActivities(studentId) {
  const activities = await Activity.find({ studentId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(RECENT_ACTIVITY_LIMIT)
    .lean();

  const refIdsOfType = (type) => activities
    .filter((activity) => activity.type === type)
    .map((activity) => activity.refId);

  const [tests, internships] = await Promise.all([
    Test.find({ _id: { $in: refIdsOfType('TEST_COMPLETED') } }, 'title').lean(),
    Internship.find({ _id: { $in: refIdsOfType('INTERNSHIP_APPLIED') } }, 'title').lean(),
  ]);

  const titleById = new Map(
    [...tests, ...internships].map((record) => [String(record._id), record.title])
  );

  return activities.map((activity) => ({
    type: activity.type,
    refId: String(activity.refId),
    label: titleById.get(String(activity.refId)) || REMOVED_LABEL,
    at: activity.createdAt,
  }));
}

/**
 * Build the progress summary for one student (FR-13).
 * Every student query filters by studentId (SR-04).
 *
 * testsCompleted only counts tests that are still available, so removing a test
 * can never push completionPercentage above 100 (deviation D-11).
 *
 * @param {string} studentId - The calling student's user ID (from req.user.id)
 * @returns {Promise<object>} Counts, completion percentage and recent activities
 */
async function getProgress(studentId) {
  const [availableTestIds, attemptedTestIds, totalAttempts, applicationsSubmitted, recentActivities] =
    await Promise.all([
      getAvailableTestIds(),
      Result.distinct('testId', { studentId }),
      Result.countDocuments({ studentId }),
      Application.countDocuments({ studentId }),
      getRecentActivities(studentId),
    ]);

  const testsAvailable = availableTestIds.size;
  const testsCompleted = attemptedTestIds
    .filter((testId) => availableTestIds.has(String(testId)))
    .length;
  const completionPercentage = testsAvailable > 0
    ? Math.round((testsCompleted / testsAvailable) * 100)
    : 0;

  return {
    testsAvailable,
    testsCompleted,
    totalAttempts,
    applicationsSubmitted,
    completionPercentage,
    recentActivities,
  };
}

module.exports = { getProgress };
