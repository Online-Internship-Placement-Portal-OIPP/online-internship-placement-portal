const mongoose = require('mongoose');
const { Test, Question, Result } = require('../../models');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
// Keep a reference to the module so tests can spy on its exports at runtime
const activityService = require('../progress/activity.service');

/**
 * List all available tests that contain at least one question.
 * Computes questionCount, totalMarks, and attempts per student.
 *
 * @param {string} studentId - The calling student's user ID
 * @returns {Promise<Array<object>>} Tests sorted by title ascending
 */
async function listTests(studentId) {
  let studentObjId = null;
  if (studentId && mongoose.isValidObjectId(studentId)) {
    studentObjId = typeof studentId === 'string'
      ? new mongoose.Types.ObjectId(studentId)
      : studentId;
  }

  const tests = await Test.aggregate([
    {
      $lookup: {
        from: 'questions',
        localField: '_id',
        foreignField: 'testId',
        as: 'questions',
      },
    },
    {
      $match: {
        'questions.0': { $exists: true },
      },
    },
    {
      $lookup: {
        from: 'results',
        let: { testId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$testId', '$$testId'] },
                  { $eq: ['$studentId', studentObjId] },
                ],
              },
            },
          },
        ],
        as: 'results',
      },
    },
    {
      $sort: { title: 1 },
    },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        title: 1,
        category: 1,
        description: { $ifNull: ['$description', ''] },
        durationMinutes: 1,
        questionCount: { $size: '$questions' },
        totalMarks: {
          $sum: {
            $map: {
              input: '$questions',
              as: 'q',
              in: { $ifNull: ['$$q.marks', 1] },
            },
          },
        },
        attempts: { $size: '$results' },
      },
    },
  ]);

  return tests;
}

/**
 * Retrieve a test and its questions for taking an attempt.
 * Never includes or selects correctOption.
 *
 * @param {string} testId - Test identifier
 * @returns {Promise<object>} Test details with questions
 */
async function getTestForAttempt(testId) {
  if (!mongoose.isValidObjectId(testId)) {
    throw new AppError('INVALID_REQUEST');
  }

  const test = await Test.findById(testId);
  if (!test) {
    throw new AppError('TEST_NOT_FOUND');
  }

  const questions = await Question.find({ testId: test._id }).sort({ _id: 1 });
  if (!questions || questions.length === 0) {
    throw new AppError('TEST_NOT_FOUND');
  }

  return {
    id: test._id.toString(),
    title: test.title,
    category: test.category,
    description: test.description || '',
    durationMinutes: test.durationMinutes,
    questions: questions.map((q) => ({
      id: q._id.toString(),
      text: q.text,
      options: q.options,
      category: q.category,
      marks: q.marks,
    })),
  };
}

/**
 * Score a test submission, save a Result, and record activity.
 * correctOption is loaded server-side and NEVER included in the return value.
 *
 * @param {string} studentId - ID of the submitting student (from req.user.id)
 * @param {string} testId    - Test being submitted
 * @param {Array<{questionId: string, selectedOption: number}>} answers
 * @returns {Promise<object>} { resultId, testId, score, totalMarks, percentage, categoryScores }
 */
async function evaluateSubmission(studentId, testId, answers) {
  // 1. Load the test
  const test = await Test.findById(testId);
  if (!test) {
    throw new AppError('TEST_NOT_FOUND');
  }

  // 2. Load all questions for the test, including the hidden correctOption field
  const questions = await Question.find({ testId: test._id }).select('+correctOption');
  if (!questions || questions.length === 0) {
    throw new AppError('TEST_NOT_FOUND');
  }

  // Build a map of questionId → question for O(1) lookup
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  // 3. Validate answers before writing anything
  const seenIds = new Set();
  for (const answer of answers) {
    const qIdStr = answer.questionId;

    // Unknown questionId
    if (!questionMap.has(qIdStr)) {
      throw new AppError('INVALID_SUBMISSION');
    }

    // Duplicate questionId
    if (seenIds.has(qIdStr)) {
      throw new AppError('INVALID_SUBMISSION');
    }
    seenIds.add(qIdStr);

    // selectedOption must be a non-negative integer within the options range
    const q = questionMap.get(qIdStr);
    const opt = answer.selectedOption;
    if (!Number.isInteger(opt) || opt < 0 || opt >= q.options.length) {
      throw new AppError('INVALID_SUBMISSION');
    }
  }

  // 4. Build an answer lookup map: questionId → selectedOption
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOption]));

  // 5 & 6. Compute score, totalMarks and categoryScores in one pass
  let score = 0;
  let totalMarks = 0;
  const categoryMap = {}; // { [category]: { score, total } }

  for (const q of questions) {
    const qIdStr = q._id.toString();
    const marks = q.marks || 1;
    totalMarks += marks;

    if (!categoryMap[q.category]) {
      categoryMap[q.category] = { score: 0, total: 0 };
    }
    categoryMap[q.category].total += marks;

    if (answerMap.has(qIdStr) && answerMap.get(qIdStr) === q.correctOption) {
      score += marks;
      categoryMap[q.category].score += marks;
    }
  }

  // Percentage — guard against zero totalMarks
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  // Sort categoryScores alphabetically by category name
  const categoryScores = Object.entries(categoryMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, vals]) => ({
      category,
      score: vals.score,
      total: vals.total,
    }));

  // 7. Persist exactly ONE Result document
  const result = await Result.create({
    studentId,
    testId: test._id,
    score,
    totalMarks,
    percentage,
    categoryScores,
    submittedAt: new Date(),
  });

  // 8. Record activity — failure must not break a successful submit
  try {
    await activityService.recordActivity(studentId, 'TEST_COMPLETED', test._id);
  } catch (activityError) {
    logger.warn('Unable to record TEST_COMPLETED activity', {
      studentId,
      testId: test._id.toString(),
      message: activityError.message,
    });
  }

  // 9. Return summary — correctOption never included
  return {
    resultId: result._id.toString(),
    testId: test._id.toString(),
    score,
    totalMarks,
    percentage,
    categoryScores,
  };
}

/**
 * List all results for a student, newest first.
 * testTitle falls back to 'Test removed' when the test has been deleted.
 *
 * @param {string} studentId
 * @returns {Promise<Array<object>>}
 */
async function listResults(studentId) {
  // Use lean() but do NOT populate — we need the raw testId ObjectId to survive
  // even when the test has been deleted (populate nulls the field when the ref is missing).
  const results = await Result.find({ studentId })
    .sort({ submittedAt: -1 })
    .lean();

  // Collect unique testIds that still exist
  const testIds = [...new Set(results.map((r) => r.testId.toString()))];
  const tests = await Test.find({ _id: { $in: testIds } }, 'title').lean();
  const testTitleMap = new Map(tests.map((t) => [t._id.toString(), t.title]));

  return results.map((r) => {
    const rawTestId = r.testId.toString();
    return {
      resultId: r._id.toString(),
      testId: rawTestId,
      testTitle: testTitleMap.get(rawTestId) || 'Test removed',
      score: r.score,
      totalMarks: r.totalMarks,
      percentage: r.percentage,
      submittedAt: r.submittedAt,
    };
  });
}

/**
 * Retrieve a single result that belongs to the given student.
 * Returns 404 RESULT_NOT_FOUND (rather than 403) to avoid revealing
 * the existence of another student's data (SR-04).
 *
 * @param {string} studentId
 * @param {string} resultId
 * @returns {Promise<object>}
 */
async function getResult(studentId, resultId) {
  // Use lean() without populate to preserve the raw testId even after deletion
  const result = await Result.findOne({ _id: resultId, studentId }).lean();

  if (!result) {
    throw new AppError('RESULT_NOT_FOUND');
  }

  const rawTestId = result.testId.toString();
  const test = await Test.findById(rawTestId, 'title').lean();

  return {
    resultId: result._id.toString(),
    testId: rawTestId,
    testTitle: test ? test.title : 'Test removed',
    score: result.score,
    totalMarks: result.totalMarks,
    percentage: result.percentage,
    categoryScores: result.categoryScores,
    submittedAt: result.submittedAt,
  };
}

module.exports = {
  listTests,
  getTestForAttempt,
  evaluateSubmission,
  listResults,
  getResult,
};
