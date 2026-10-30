const { Result, Test } = require('../../models');
const { summarizePercentages, aggregateCategoryScores, chooseCategory, buildTrend } = require('./analysis.utils');

async function getAnalysis(studentId) {
  const results = await Result.find({ studentId }).sort({ submittedAt: 1, _id: 1 }).lean();
  if (results.length === 0) {
    return { attempts: 0, message: 'Take your first aptitude test to see your performance analysis.' };
  }
  const testIds = [...new Set(results.map((result) => String(result.testId)))];
  const tests = await Test.find({ _id: { $in: testIds } }, 'title').lean();
  const titleByTestId = new Map(tests.map((test) => [String(test._id), test.title]));
  const categoryPerformance = aggregateCategoryScores(results);
  return {
    ...summarizePercentages(results),
    categoryPerformance,
    ...chooseCategory(categoryPerformance),
    trend: buildTrend(results, titleByTestId),
  };
}

module.exports = { getAnalysis };
