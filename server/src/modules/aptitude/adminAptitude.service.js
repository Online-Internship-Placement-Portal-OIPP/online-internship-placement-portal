
const mongoose = require('mongoose');
const { Test, Question } = require('../../models');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
// Shared check for transaction support (replica set vs standalone MongoDB).
const internshipsAdmin = require('../internships/adminInternships.service');
const { z } = require('zod');

// GET /api/admin/tests
async function listTests() {
  const tests = await Test.find().sort({ title: 1 }).lean();

  const counts = await Question.aggregate([
    { $group: { _id: '$testId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    counts.map((item) => [String(item._id), item.count])
  );

  return tests.map((test) => ({
    id: String(test._id),
    title: test.title,
    category: test.category,
    description: test.description || '',
    durationMinutes: test.durationMinutes,
    questionCount: countMap.get(String(test._id)) || 0,
  }));
}

// GET /api/admin/tests/:id
async function getTest(id) {
  const test = await Test.findById(id);

  if (!test) {
    throw new AppError('TEST_NOT_FOUND');
  }

  // Admins are allowed to see correctOption.
  const questions = await Question.find({ testId: id })
    .select('+correctOption')
    .sort({ _id: 1 });

  return {
    ...test.toJSON(),
    questions: questions.map((question) => question.toJSON()),
  };
}

// POST /api/admin/tests
async function createTest(data, adminId) {
  const test = await Test.create(data);

  logger.info('Admin aptitude test created', {
    adminId,
    testId: String(test._id),
  });

  return test;
}

// PUT /api/admin/tests/:id
async function updateTest(id, data, adminId) {
  const test = await Test.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!test) {
    throw new AppError('TEST_NOT_FOUND');
  }

  logger.info('Admin aptitude test updated', {
    adminId,
    testId: String(test._id),
  });

  return test;
}

/**
 * Delete a test and its questions. Result documents are kept so students
 * retain their attempt history (D-06).
 */
async function cascadeDeleteTest(id, session = null) {
  const options = session ? { session } : {};

  const test = await Test.findById(id).session(session);
  if (!test) {
    throw new AppError('TEST_NOT_FOUND');
  }

  await Question.deleteMany({ testId: id }, options);
  await Test.findByIdAndDelete(id, options);
}

// DELETE /api/admin/tests/:id
// Uses a transaction on a replica set; a standalone local MongoDB has no
// transactions, so the two deletes run one after the other there.
async function deleteTest(id, adminId) {
  if (internshipsAdmin.supportsTransactions()) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(() => cascadeDeleteTest(id, session));
    } finally {
      await session.endSession();
    }
  } else {
    await cascadeDeleteTest(id);
  }

  logger.info('Admin aptitude test deleted', {
    adminId,
    testId: String(id),
  });

  return { deleted: true, id };
}

// POST /api/admin/tests/:id/questions
async function createQuestion(testId, data, adminId) {
  const test = await Test.findById(testId);

  if (!test) {
    throw new AppError('TEST_NOT_FOUND');
  }

  // correctOption < options.length is already enforced by createQuestionSchema.
  const question = await Question.create({
    ...data,
    testId,
  });

  // correctOption has select:false, but is available
  // on this newly created document.
  logger.info('Admin aptitude question created', {
    adminId,
    testId: String(testId),
    questionId: String(question._id),
  });

  return question;
}

// PUT /api/admin/questions/:qid
async function updateQuestion(id, data, adminId) {
  // Explicitly select the correct answer for admin editing.
  const question = await Question.findById(id)
    .select('+correctOption');

  if (!question) {
    throw new AppError('QUESTION_NOT_FOUND');
  }

  // Validate against the FINAL options, not only incoming fields.
  const finalOptions = data.options || question.options;
  const finalCorrectOption =
    data.correctOption !== undefined
      ? data.correctOption
      : question.correctOption;

  if (
    !Number.isInteger(finalCorrectOption) ||
    finalCorrectOption < 0 ||
    finalCorrectOption >= finalOptions.length
  ) {
    // Thrown as a ZodError so errorHandler returns VALIDATION_ERROR with field details.
    throw new z.ZodError([
      {
        code: 'custom',
        path: ['correctOption'],
        message: 'correctOption must be a valid index within options.',
      },
    ]);
  }

  question.set(data);
  await question.save();

  logger.info('Admin aptitude question updated', {
    adminId,
    questionId: String(question._id),
  });

  return question;
}

// DELETE /api/admin/questions/:qid
async function deleteQuestion(id, adminId) {
  const question = await Question.findByIdAndDelete(id);

  if (!question) {
    throw new AppError('QUESTION_NOT_FOUND');
  }

  logger.info('Admin aptitude question deleted', {
    adminId,
    questionId: String(id),
  });

  return { deleted: true, id };
}

module.exports = {
  listTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
