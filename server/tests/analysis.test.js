const request = require('supertest');
const app = require('../src/app');
const { Result } = require('../src/models');
const { authHeader, createAdmin, createStudent, createTestWithQuestions } = require('./helpers');
const analysisUtils = require('../src/modules/analysis/analysis.utils');

describe('TC-PERF-01 analysis calculations', () => {
  it('calculates summary, category accuracy, and strongest/weakest categories', () => {
    const results = [
      { percentage: 50, categoryScores: [{ category: 'Logical', score: 1, total: 2 }, { category: 'Quantitative', score: 2, total: 2 }] },
      { percentage: 80, categoryScores: [{ category: 'Logical', score: 2, total: 2 }, { category: 'Quantitative', score: 1, total: 2 }] },
      { percentage: 70, categoryScores: [{ category: 'Logical', score: 1, total: 2 }, { category: 'Quantitative', score: 2, total: 2 }] },
    ];
    // Average = round((50 + 80 + 70) / 3) = 67; Logical = 4/6 = 67%; Quantitative = 5/6 = 83%.
    expect(analysisUtils.summarizePercentages(results)).toEqual({ attempts: 3, averagePercentage: 67, bestPercentage: 80, latestPercentage: 70 });
    const categories = analysisUtils.aggregateCategoryScores(results);
    expect(categories).toEqual([
      { category: 'Logical', correctMarks: 4, totalMarks: 6, accuracy: 67 },
      { category: 'Quantitative', correctMarks: 5, totalMarks: 6, accuracy: 83 },
    ]);
    expect(analysisUtils.chooseCategory(categories)).toEqual({ strongestCategory: 'Quantitative', weakestCategory: 'Logical' });
  });

  it('uses alphabetical tie-breaking and creates a chronological last-20 trend', () => {
    expect(analysisUtils.chooseCategory([{ category: 'Verbal', accuracy: 70 }, { category: 'Logical', accuracy: 70 }]))
      .toEqual({ strongestCategory: 'Logical', weakestCategory: 'Logical' });
    const trend = analysisUtils.buildTrend([
      { testId: 'a', submittedAt: '2026-10-02T10:00:00Z', percentage: 60 },
      { testId: 'b', submittedAt: '2026-10-03T10:00:00Z', percentage: 80 },
    ], new Map([['a', 'Logical'], ['b', 'Quantitative']]));
    expect(trend).toEqual([
      { date: '2026-10-02', testTitle: 'Logical', percentage: 60 },
      { date: '2026-10-03', testTitle: 'Quantitative', percentage: 80 },
    ]);
  });

  it('returns the exact empty response', async () => {
    const student = await createStudent();
    const response = await request(app).get('/api/analysis').set(authHeader(student));
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ attempts: 0, message: 'Take your first aptitude test to see your performance analysis.' });
  });

  it('returns hand-calculated caller-only analysis', async () => {
    const student = await createStudent();
    const otherStudent = await createStudent();
    const { test: firstTest } = await createTestWithQuestions({ title: 'Logical Set' });
    const { test: secondTest } = await createTestWithQuestions({ title: 'Quantitative Set' });
    await Result.create([
      { studentId: student._id, testId: firstTest._id, score: 1, totalMarks: 2, percentage: 50, categoryScores: [{ category: 'Logical', score: 1, total: 2 }], submittedAt: new Date('2026-10-01') },
      { studentId: student._id, testId: secondTest._id, score: 2, totalMarks: 2, percentage: 100, categoryScores: [{ category: 'Quantitative', score: 2, total: 2 }], submittedAt: new Date('2026-10-02') },
      { studentId: otherStudent._id, testId: secondTest._id, score: 0, totalMarks: 2, percentage: 0, categoryScores: [{ category: 'Quantitative', score: 0, total: 2 }] },
    ]);
    const response = await request(app).get('/api/analysis').set(authHeader(student));
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ attempts: 2, averagePercentage: 75, bestPercentage: 100, latestPercentage: 100, strongestCategory: 'Quantitative', weakestCategory: 'Logical' });
    expect(response.body.data.categoryPerformance).toEqual([
      { category: 'Logical', correctMarks: 1, totalMarks: 2, accuracy: 50 },
      { category: 'Quantitative', correctMarks: 2, totalMarks: 2, accuracy: 100 },
    ]);
    expect(response.body.data.trend).toEqual([
      { date: '2026-10-01', testTitle: 'Logical Set', percentage: 50 },
      { date: '2026-10-02', testTitle: 'Quantitative Set', percentage: 100 },
    ]);
  });

  it('rejects admins and unauthenticated callers', async () => {
    const admin = await createAdmin();
    expect((await request(app).get('/api/analysis').set(authHeader(admin))).status).toBe(403);
    expect((await request(app).get('/api/analysis')).status).toBe(401);
  });
});
