const request = require('supertest');
const app = require('../src/app');
const { Test, Question, Result, Activity } = require('../src/models');
const {
  createStudent,
  createAdmin,
  authHeader,
  createTestWithQuestions,
} = require('./helpers');

describe('TC-TEST-01 view available tests', () => {
  it('lists only tests with questions, calculates questionCount and totalMarks, and reflects student attempts', async () => {
    const student1 = await createStudent();
    const student2 = await createStudent();

    // Test A: 2 questions, marks 2 and 3 -> totalMarks = 5
    const { test: testA } = await createTestWithQuestions({
      title: 'Alphabetical Aptitude Test A',
      category: 'Quantitative',
      questions: [
        {
          text: 'Question 1 for Test A?',
          options: ['A', 'B', 'C', 'D'],
          correctOption: 0,
          category: 'Quantitative',
          marks: 2,
        },
        {
          text: 'Question 2 for Test A?',
          options: ['True', 'False'],
          correctOption: 1,
          category: 'Quantitative',
          marks: 3,
        },
      ],
    });

    // Test B: 1 question, marks 1 -> totalMarks = 1
    const { test: testB } = await createTestWithQuestions({
      title: 'Beta Reasoning Test B',
      category: 'Logical',
      questions: [
        {
          text: 'Question 1 for Test B?',
          options: ['X', 'Y', 'Z'],
          correctOption: 2,
          category: 'Logical',
          marks: 1,
        },
      ],
    });

    // Test C: 0 questions -> must NOT appear in available tests
    await Test.create({
      title: 'Empty Test C',
      category: 'Verbal',
      durationMinutes: 10,
    });

    // Insert Result documents directly through the model
    // student1 has 2 results for testA, 0 for testB
    await Result.create({
      studentId: student1._id,
      testId: testA._id,
      score: 5,
      totalMarks: 5,
      percentage: 100,
      categoryScores: [{ category: 'Quantitative', score: 5, total: 5 }],
    });
    await Result.create({
      studentId: student1._id,
      testId: testA._id,
      score: 2,
      totalMarks: 5,
      percentage: 40,
      categoryScores: [{ category: 'Quantitative', score: 2, total: 5 }],
    });

    // student2 has 1 result for testA (should not affect student1's attempts)
    await Result.create({
      studentId: student2._id,
      testId: testA._id,
      score: 3,
      totalMarks: 5,
      percentage: 60,
      categoryScores: [{ category: 'Quantitative', score: 3, total: 5 }],
    });

    const response = await request(app)
      .get('/api/tests')
      .set(authHeader(student1));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const items = response.body.data;
    expect(items).toHaveLength(2);

    // Sorted by title ascending
    expect(items[0].title).toBe('Alphabetical Aptitude Test A');
    expect(items[0].questionCount).toBe(2);
    expect(items[0].totalMarks).toBe(5);
    expect(items[0].attempts).toBe(2);

    expect(items[1].title).toBe('Beta Reasoning Test B');
    expect(items[1].questionCount).toBe(1);
    expect(items[1].totalMarks).toBe(1);
    expect(items[1].attempts).toBe(0);

    // Empty test C is not in the list
    const titles = items.map((t) => t.title);
    expect(titles).not.toContain('Empty Test C');
  });

  it('returns 403 FORBIDDEN when accessed with an admin token', async () => {
    const admin = await createAdmin();
    const response = await request(app)
      .get('/api/tests')
      .set(authHeader(admin));

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 UNAUTHORIZED when no token is provided', async () => {
    const response = await request(app).get('/api/tests');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('TC-TEST-02 open a test for attempt', () => {
  it('returns test details, questions, and options without exposing correctOption', async () => {
    const student = await createStudent();
    const { test } = await createTestWithQuestions({
      title: 'Quantitative Foundations',
      questions: [
        {
          text: 'What is 10 divided by 2?',
          options: ['2', '5', '10', '20'],
          correctOption: 1,
          category: 'Quantitative',
          marks: 2,
        },
        {
          text: 'What is 3 squared?',
          options: ['6', '9'],
          correctOption: 1,
          category: 'Quantitative',
          marks: 1,
        },
      ],
    });

    const response = await request(app)
      .get(`/api/tests/${test._id}`)
      .set(authHeader(student));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    expect(data.id).toBe(test._id.toString());
    expect(data.title).toBe('Quantitative Foundations');
    expect(data.questions).toHaveLength(2);
    expect(data.questions[0].text).toBe('What is 10 divided by 2?');
    expect(data.questions[0].options).toEqual(['2', '5', '10', '20']);
    expect(data.questions[1].text).toBe('What is 3 squared?');
    expect(data.questions[1].options).toEqual(['6', '9']);

    // Ensure correctOption is NEVER revealed anywhere in the response body
    const bodyStr = JSON.stringify(response.body);
    expect(bodyStr).not.toContain('correctOption');
  });

  it('returns 404 TEST_NOT_FOUND when test ID is unknown', async () => {
    const student = await createStudent();
    const unknownId = '507f1f77bcf86cd799439011';

    const response = await request(app)
      .get(`/api/tests/${unknownId}`)
      .set(authHeader(student));

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('TEST_NOT_FOUND');
  });

  it('returns 404 TEST_NOT_FOUND when test has no questions', async () => {
    const student = await createStudent();
    const emptyTest = await Test.create({
      title: 'Questionless Test',
      category: 'Logical',
      durationMinutes: 15,
    });

    const response = await request(app)
      .get(`/api/tests/${emptyTest._id}`)
      .set(authHeader(student));

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('TEST_NOT_FOUND');
  });

  it('returns 400 INVALID_REQUEST when test ID is malformed', async () => {
    const student = await createStudent();

    const response = await request(app)
      .get('/api/tests/not-a-valid-object-id')
      .set(authHeader(student));

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_REQUEST');
  });
});

describe('TC-TEST-03 score calculation', () => {
  /**
   * Fixture: one test with 4 questions across 2 categories with different marks.
   *   Q1 — Quantitative, marks 2, correctOption 0 ('A')
   *   Q2 — Quantitative, marks 3, correctOption 1 ('B')
   *   Q3 — Logical,      marks 1, correctOption 2 ('C')
   *   Q4 — Logical,      marks 2, correctOption 0 ('X')
   * totalMarks = 2 + 3 + 1 + 2 = 8
   */
  async function setupScoringFixture() {
    const student = await createStudent();
    const { test, questions } = await createTestWithQuestions({
      title: 'Scoring Fixture Test',
      category: 'Mixed',
      questions: [
        { text: 'Q1 Quantitative?', options: ['A', 'B', 'C', 'D'], correctOption: 0, category: 'Quantitative', marks: 2 },
        { text: 'Q2 Quantitative?', options: ['A', 'B', 'C', 'D'], correctOption: 1, category: 'Quantitative', marks: 3 },
        { text: 'Q3 Logical?',      options: ['A', 'B', 'C', 'D'], correctOption: 2, category: 'Logical',      marks: 1 },
        { text: 'Q4 Logical?',      options: ['X', 'Y'],            correctOption: 0, category: 'Logical',      marks: 2 },
      ],
    });
    return { student, test, questions };
  }

  it('all correct answers → score 8, percentage 100, correct categoryScores', async () => {
    const { student, test, questions } = await setupScoringFixture();

    const answers = [
      { questionId: questions[0]._id.toString(), selectedOption: 0 },
      { questionId: questions[1]._id.toString(), selectedOption: 1 },
      { questionId: questions[2]._id.toString(), selectedOption: 2 },
      { questionId: questions[3]._id.toString(), selectedOption: 0 },
    ];

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const d = res.body.data;
    expect(d.score).toBe(8);
    expect(d.totalMarks).toBe(8);
    expect(d.percentage).toBe(100);

    // categoryScores sorted alphabetically: Logical first, then Quantitative
    expect(d.categoryScores).toHaveLength(2);
    expect(d.categoryScores[0].category).toBe('Logical');
    expect(d.categoryScores[0].score).toBe(3);
    expect(d.categoryScores[0].total).toBe(3);
    expect(d.categoryScores[1].category).toBe('Quantitative');
    expect(d.categoryScores[1].score).toBe(5);
    expect(d.categoryScores[1].total).toBe(5);

    // correctOption must never appear in the response
    expect(JSON.stringify(res.body)).not.toContain('correctOption');
  });

  it('all wrong answers → score 0, percentage 0', async () => {
    const { student, test, questions } = await setupScoringFixture();

    const answers = [
      { questionId: questions[0]._id.toString(), selectedOption: 3 }, // wrong (correct is 0)
      { questionId: questions[1]._id.toString(), selectedOption: 0 }, // wrong (correct is 1)
      { questionId: questions[2]._id.toString(), selectedOption: 0 }, // wrong (correct is 2)
      { questionId: questions[3]._id.toString(), selectedOption: 1 }, // wrong (correct is 0)
    ];

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(0);
    expect(res.body.data.totalMarks).toBe(8);
    expect(res.body.data.percentage).toBe(0);
    expect(res.body.data.categoryScores[0].score).toBe(0); // Logical
    expect(res.body.data.categoryScores[1].score).toBe(0); // Quantitative
  });

  it('mixed answers → correct partial score and percentage', async () => {
    const { student, test, questions } = await setupScoringFixture();

    // Correct: Q1 (2 marks) and Q3 (1 mark) = 3 / 8 = 38%
    const answers = [
      { questionId: questions[0]._id.toString(), selectedOption: 0 }, // correct
      { questionId: questions[1]._id.toString(), selectedOption: 0 }, // wrong
      { questionId: questions[2]._id.toString(), selectedOption: 2 }, // correct
      { questionId: questions[3]._id.toString(), selectedOption: 1 }, // wrong
    ];

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(3);
    expect(res.body.data.totalMarks).toBe(8);
    expect(res.body.data.percentage).toBe(38); // Math.round(3/8*100) = 38
  });

  it('unanswered questions score 0 and totalMarks still reflects full test', async () => {
    const { student, test, questions } = await setupScoringFixture();

    // Only answer Q1 correctly (2 marks), leave the rest unanswered
    const answers = [
      { questionId: questions[0]._id.toString(), selectedOption: 0 },
    ];

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(2);
    expect(res.body.data.totalMarks).toBe(8);
    expect(res.body.data.percentage).toBe(25); // Math.round(2/8*100)
  });

  it('unknown questionId returns 400 INVALID_SUBMISSION and writes no Result', async () => {
    const { student, test, questions } = await setupScoringFixture();
    const countBefore = await Result.countDocuments();

    const answers = [
      { questionId: '507f1f77bcf86cd799439011', selectedOption: 0 }, // not in this test
    ];

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SUBMISSION');
    expect(await Result.countDocuments()).toBe(countBefore);
  });

  it('duplicate questionId returns 400 INVALID_SUBMISSION and writes no Result', async () => {
    const { student, test, questions } = await setupScoringFixture();
    const countBefore = await Result.countDocuments();

    const qId = questions[0]._id.toString();
    const answers = [
      { questionId: qId, selectedOption: 0 },
      { questionId: qId, selectedOption: 1 }, // duplicate
    ];

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SUBMISSION');
    expect(await Result.countDocuments()).toBe(countBefore);
  });

  it('selectedOption out of range returns 400 INVALID_SUBMISSION and writes no Result', async () => {
    const { student, test, questions } = await setupScoringFixture();
    const countBefore = await Result.countDocuments();

    const answers = [
      { questionId: questions[0]._id.toString(), selectedOption: 10 }, // Q1 has 4 options (0-3)
    ];

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SUBMISSION');
    expect(await Result.countDocuments()).toBe(countBefore);
  });

  it('successful submission creates exactly one Result and one TEST_COMPLETED Activity', async () => {
    const { student, test, questions } = await setupScoringFixture();
    const resultsBefore = await Result.countDocuments();
    const activitiesBefore = await Activity.countDocuments({ type: 'TEST_COMPLETED' });

    const answers = [
      { questionId: questions[0]._id.toString(), selectedOption: 0 },
    ];

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers });

    expect(res.status).toBe(200);
    expect(await Result.countDocuments()).toBe(resultsBefore + 1);
    expect(await Activity.countDocuments({ type: 'TEST_COMPLETED' })).toBe(activitiesBefore + 1);

    const activity = await Activity.findOne({ studentId: student._id, type: 'TEST_COMPLETED' });
    expect(activity.refId.toString()).toBe(test._id.toString());
  });

  it('response never contains correctOption', async () => {
    const { student, test, questions } = await setupScoringFixture();

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers: [] });

    expect(JSON.stringify(res.body)).not.toContain('correctOption');
  });
});

describe('TC-TEST-04 view result', () => {
  it('list is newest first', async () => {
    const student = await createStudent();
    const { test, questions } = await setupScoringFixture2();

    // Submit twice
    await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers: [] });

    await new Promise((r) => setTimeout(r, 10)); // ensure different timestamps

    await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers: [{ questionId: questions[0]._id.toString(), selectedOption: 0 }] });

    const res = await request(app)
      .get('/api/results')
      .set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const items = res.body.data;
    expect(items.length).toBeGreaterThanOrEqual(2);

    // Newest first — higher score result was submitted second
    const dates = items.map((r) => new Date(r.submittedAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
    }
  });

  it('own result returns 200 with categoryScores', async () => {
    const student = await createStudent();
    const { test, questions } = await setupScoringFixture2();

    const submitRes = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers: [{ questionId: questions[0]._id.toString(), selectedOption: 0 }] });

    const resultId = submitRes.body.data.resultId;

    const res = await request(app)
      .get(`/api/results/${resultId}`)
      .set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resultId).toBe(resultId);
    expect(Array.isArray(res.body.data.categoryScores)).toBe(true);
  });

  it("another student's result returns 404 RESULT_NOT_FOUND", async () => {
    const owner = await createStudent();
    const other = await createStudent();
    const { test, questions } = await setupScoringFixture2();

    const submitRes = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(owner))
      .send({ answers: [] });

    const resultId = submitRes.body.data.resultId;

    const res = await request(app)
      .get(`/api/results/${resultId}`)
      .set(authHeader(other));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RESULT_NOT_FOUND');
  });

  it('malformed result id returns 400 INVALID_REQUEST', async () => {
    const student = await createStudent();

    const res = await request(app)
      .get('/api/results/not-valid-id')
      .set(authHeader(student));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it("deleted test shows testTitle 'Test removed' and preserves the original testId", async () => {
    const student = await createStudent();
    const { test, questions } = await setupScoringFixture2();
    const originalTestId = test._id.toString();

    const submitRes = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers: [] });

    const resultId = submitRes.body.data.resultId;

    // Delete the test
    await Test.findByIdAndDelete(test._id);

    const res = await request(app)
      .get(`/api/results/${resultId}`)
      .set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.data.testTitle).toBe('Test removed');
    // testId must still equal the original test id
    expect(res.body.data.testId).toBe(originalTestId);

    // Also check the list
    const listRes = await request(app)
      .get('/api/results')
      .set(authHeader(student));

    const item = listRes.body.data.find((r) => r.resultId === resultId);
    expect(item.testTitle).toBe('Test removed');
    expect(item.testId).toBe(originalTestId);
  });
});

describe('TC-TEST-03 additional: invalid selectedOption values', () => {
  it('selectedOption -1 returns 400 INVALID_SUBMISSION and writes no Result', async () => {
    const student = await createStudent();
    const { test, questions } = await createTestWithQuestions({
      title: 'Negative Option Test',
      category: 'Quantitative',
      questions: [
        { text: 'Is a negative option valid?', options: ['A', 'B'], correctOption: 0, category: 'Quantitative', marks: 1 },
      ],
    });
    const countBefore = await Result.countDocuments();

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers: [{ questionId: questions[0]._id.toString(), selectedOption: -1 }] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SUBMISSION');
    expect(await Result.countDocuments()).toBe(countBefore);
  });

  it('selectedOption 1.5 (non-integer) returns 400 INVALID_SUBMISSION and writes no Result', async () => {
    const student = await createStudent();
    const { test, questions } = await createTestWithQuestions({
      title: 'Float Option Test',
      category: 'Quantitative',
      questions: [
        { text: 'Is a float option valid?', options: ['A', 'B'], correctOption: 0, category: 'Quantitative', marks: 1 },
      ],
    });
    const countBefore = await Result.countDocuments();

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers: [{ questionId: questions[0]._id.toString(), selectedOption: 1.5 }] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SUBMISSION');
    expect(await Result.countDocuments()).toBe(countBefore);
  });
});

describe('TC-TEST-03 additional: recordActivity failure does not break submit', () => {
  it('returns 200 with resultId even when recordActivity rejects', async () => {
    // Spy on the module-level export so aptitude.service.js (which calls
    // activityService.recordActivity) picks up the mock without destructuring issues
    const activityService = require('../src/modules/progress/activity.service');
    const spy = jest.spyOn(activityService, 'recordActivity').mockRejectedValueOnce(
      new Error('activity store unavailable')
    );

    const student = await createStudent();
    const { test, questions } = await createTestWithQuestions({
      title: 'Activity Failure Test',
      category: 'Logical',
      questions: [
        { text: 'Does the submit survive?', options: ['Yes', 'No'], correctOption: 0, category: 'Logical', marks: 1 },
      ],
    });

    const res = await request(app)
      .post(`/api/tests/${test._id}/submit`)
      .set(authHeader(student))
      .send({ answers: [{ questionId: questions[0]._id.toString(), selectedOption: 0 }] });

    // Must still succeed with 200
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resultId).toBeTruthy();

    // Result must have been saved
    expect(await Result.countDocuments({ studentId: student._id })).toBe(1);

    spy.mockRestore();
  });
});

describe('TC-TEST-04 additional: auth guards for submit and results endpoints', () => {
  let testFixture;

  beforeAll(async () => {
    testFixture = await createTestWithQuestions({
      title: 'Auth Guard Fixture',
      category: 'Logical',
      questions: [
        { text: 'Auth guard question text?', options: ['Yes', 'No'], correctOption: 0, category: 'Logical', marks: 1 },
      ],
    });
  });

  // POST /api/tests/:id/submit — auth guards
  it('POST /submit with no token returns 401 UNAUTHORIZED', async () => {
    const res = await request(app)
      .post(`/api/tests/${testFixture.test._id}/submit`)
      .send({ answers: [] });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /submit with admin token returns 403 FORBIDDEN', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .post(`/api/tests/${testFixture.test._id}/submit`)
      .set(authHeader(admin))
      .send({ answers: [] });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // GET /api/results — auth guards (no fixture needed)
  it('GET /results with no token returns 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/results');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /results with admin token returns 403 FORBIDDEN', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get('/api/results')
      .set(authHeader(admin));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // GET /api/results/:id — auth guards (no fixture needed)
  it('GET /results/:id with no token returns 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/results/507f1f77bcf86cd799439011');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /results/:id with admin token returns 403 FORBIDDEN', async () => {
    const admin = await createAdmin();
    const res = await request(app)
      .get('/api/results/507f1f77bcf86cd799439011')
      .set(authHeader(admin));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

/** Shared helper for TC-TEST-04 fixtures (single-question test). */
async function setupScoringFixture2() {
  const { test, questions } = await createTestWithQuestions({
    title: 'Result View Test',
    category: 'Logical',
    questions: [
      { text: 'Simple Q?', options: ['Yes', 'No'], correctOption: 0, category: 'Logical', marks: 1 },
    ],
  });
  return { test, questions };
}
