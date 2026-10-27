const request = require('supertest');
const app = require('../src/app');
const { Test, Question, Result } = require('../src/models');
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
