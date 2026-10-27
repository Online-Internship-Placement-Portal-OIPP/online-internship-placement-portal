const mongoose = require('mongoose');
const { Test, Question, Result } = require('../../models');
const AppError = require('../../utils/AppError');

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

module.exports = {
  listTests,
  getTestForAttempt,
};
