function roundPercentage(value) {
  return Math.round(value);
}

/**
 * Attempt count plus average, best and latest percentage.
 *
 * @param {Array} results - The student's results, oldest first (at least one)
 */
function summarizePercentages(results) {
  const percentages = results.map((result) => result.percentage);
  return {
    attempts: results.length,
    averagePercentage: roundPercentage(percentages.reduce((sum, value) => sum + value, 0) / percentages.length),
    bestPercentage: Math.max(...percentages),
    latestPercentage: results[results.length - 1].percentage,
  };
}

/**
 * Add up each category's marks across all results and work out its accuracy.
 *
 * @param {Array} results - The student's results
 * @returns {Array<{category: string, correctMarks: number, totalMarks: number, accuracy: number}>} Sorted by category name
 */
function aggregateCategoryScores(results) {
  const totals = new Map();
  for (const result of results) {
    for (const categoryScore of result.categoryScores || []) {
      const current = totals.get(categoryScore.category) || { correctMarks: 0, totalMarks: 0 };
      current.correctMarks += categoryScore.score;
      current.totalMarks += categoryScore.total;
      totals.set(categoryScore.category, current);
    }
  }
  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, values]) => ({
      category,
      correctMarks: values.correctMarks,
      totalMarks: values.totalMarks,
      accuracy: roundPercentage((values.correctMarks / values.totalMarks) * 100),
    }));
}

/**
 * Pick the highest and lowest accuracy categories. Ties go to the first name alphabetically,
 * because the sorts below keep the alphabetical order of equal items.
 *
 * @param {Array} categoryPerformance - Output of aggregateCategoryScores
 */
function chooseCategory(categoryPerformance) {
  if (categoryPerformance.length === 0) return { strongestCategory: null, weakestCategory: null };
  const alphabetical = [...categoryPerformance].sort((left, right) => left.category.localeCompare(right.category));
  const strongest = [...alphabetical].sort((left, right) => right.accuracy - left.accuracy)[0];
  const weakest = [...alphabetical].sort((left, right) => left.accuracy - right.accuracy)[0];
  return { strongestCategory: strongest.category, weakestCategory: weakest.category };
}

/**
 * Build the chronological trend from the latest 20 results.
 *
 * @param {Array} results - The student's results, oldest first
 * @param {Map<string, string>} titleByTestId - Titles of the tests that still exist
 */
function buildTrend(results, titleByTestId) {
  return results.slice(-20).map((result) => ({
    date: new Date(result.submittedAt).toISOString().slice(0, 10),
    testTitle: titleByTestId.get(String(result.testId)) || 'Test removed',
    percentage: result.percentage,
  }));
}

module.exports = { roundPercentage, summarizePercentages, aggregateCategoryScores, chooseCategory, buildTrend };
