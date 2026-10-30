/**
 * S2-05: Preparation progress tracking.
 * Requirements: FR-12, FR-13, SR-04 (TC-PROG-01, TC-PROG-02).
 */

const request = require('supertest');

const app = require('../src/app');
const { Activity, Result, Test, Internship } = require('../src/models');
const {
  createStudent,
  createAdmin,
  authHeader,
  createInternship,
  createTestWithQuestions,
} = require('./helpers');

require('./setup');

const getProgress = (user) => request(app).get('/api/progress').set(authHeader(user));

/** Submit a test through the real API, answering its first question correctly. */
function submitTest(user, test, question) {
  return request(app)
    .post(`/api/tests/${test._id}/submit`)
    .set(authHeader(user))
    .send({ answers: [{ questionId: String(question._id), selectedOption: 1 }] });
}

describe('TC-PROG-01 - Preparation activities are recorded (FR-12)', () => {
  test('progress changes after applying for an internship', async () => {
    const student = await createStudent();
    const internship = await createInternship({ title: 'Backend Intern' });

    const before = await getProgress(student);
    expect(before.status).toBe(200);
    expect(before.body.data.applicationsSubmitted).toBe(0);
    expect(before.body.data.recentActivities).toEqual([]);

    const applied = await request(app)
      .post('/api/applications')
      .set(authHeader(student))
      .send({ internshipId: String(internship._id) });
    expect(applied.status).toBe(201);

    const after = await getProgress(student);
    expect(after.body.data.applicationsSubmitted).toBe(1);
    expect(after.body.data.recentActivities).toHaveLength(1);
    expect(after.body.data.recentActivities[0]).toEqual({
      type: 'INTERNSHIP_APPLIED',
      refId: String(internship._id),
      label: 'Backend Intern',
      at: expect.any(String),
    });
  });

  test('progress changes after completing a test', async () => {
    const student = await createStudent();
    const { test, questions } = await createTestWithQuestions({ title: 'Quant Basics' });

    const before = await getProgress(student);
    expect(before.body.data).toMatchObject({
      testsAvailable: 1,
      testsCompleted: 0,
      totalAttempts: 0,
      completionPercentage: 0,
    });

    const submitted = await submitTest(student, test, questions[0]);
    expect(submitted.status).toBe(200);

    const after = await getProgress(student);
    expect(after.body.data).toMatchObject({
      testsAvailable: 1,
      testsCompleted: 1,
      totalAttempts: 1,
      completionPercentage: 100,
    });
    expect(after.body.data.recentActivities[0]).toEqual({
      type: 'TEST_COMPLETED',
      refId: String(test._id),
      label: 'Quant Basics',
      at: expect.any(String),
    });
  });
});

describe('TC-PROG-02 - Student views preparation progress (FR-13)', () => {
  test('a new student with no tests gets zero counts and 0% completion', async () => {
    const student = await createStudent();

    const response = await getProgress(student);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      testsAvailable: 0,
      testsCompleted: 0,
      totalAttempts: 0,
      applicationsSubmitted: 0,
      completionPercentage: 0,
      recentActivities: [],
    });
  });

  test('a retake adds an attempt but does not add a completed test', async () => {
    const student = await createStudent();
    const first = await createTestWithQuestions({ title: 'First Test' });
    await createTestWithQuestions({ title: 'Second Test' });
    await createTestWithQuestions({ title: 'Third Test' });

    await submitTest(student, first.test, first.questions[0]);
    await submitTest(student, first.test, first.questions[0]);

    const response = await getProgress(student);

    expect(response.body.data).toMatchObject({
      testsAvailable: 3,
      testsCompleted: 1,
      totalAttempts: 2,
      completionPercentage: 33,
    });
    expect(response.body.data.recentActivities).toHaveLength(2);
  });

  test('a test without questions is not counted as available', async () => {
    const student = await createStudent();
    await createTestWithQuestions();
    await Test.create({ title: 'Empty Test', category: 'Verbal', durationMinutes: 10 });

    const response = await getProgress(student);

    expect(response.body.data.testsAvailable).toBe(1);
  });

  test('returns only the latest 10 activities, newest first', async () => {
    const student = await createStudent();
    const { test } = await createTestWithQuestions();
    const start = Date.now();

    await Activity.create(
      Array.from({ length: 12 }, (_, index) => ({
        studentId: student._id,
        type: 'TEST_COMPLETED',
        refId: test._id,
        createdAt: new Date(start - index * 60000),
      }))
    );

    const { recentActivities } = (await getProgress(student)).body.data;

    expect(recentActivities).toHaveLength(10);
    expect(new Date(recentActivities[0].at).getTime()).toBe(start);
    expect(new Date(recentActivities[9].at).getTime()).toBe(start - 9 * 60000);
  });

  test('activities for deleted records are labelled "Removed item"', async () => {
    const student = await createStudent();
    const { test, questions } = await createTestWithQuestions();
    const internship = await createInternship();

    await submitTest(student, test, questions[0]);
    await request(app)
      .post('/api/applications')
      .set(authHeader(student))
      .send({ internshipId: String(internship._id) });

    await Test.deleteOne({ _id: test._id });
    await Internship.deleteOne({ _id: internship._id });

    const { recentActivities } = (await getProgress(student)).body.data;

    expect(recentActivities.map((activity) => activity.label)).toEqual([
      'Removed item',
      'Removed item',
    ]);
  });

  // Deviation D-11: results for deleted tests stay in history but not in completion.
  test('a completed test that was later deleted does not inflate completion', async () => {
    const student = await createStudent();
    const removed = await createTestWithQuestions({ title: 'Removed Test' });
    await createTestWithQuestions({ title: 'Remaining Test' });

    await submitTest(student, removed.test, removed.questions[0]);
    await Test.deleteOne({ _id: removed.test._id });

    const response = await getProgress(student);

    expect(response.body.data).toMatchObject({
      testsAvailable: 1,
      testsCompleted: 0,
      totalAttempts: 1,
      completionPercentage: 0,
    });
  });

  test('never includes data from another student (SR-04)', async () => {
    const student = await createStudent();
    const other = await createStudent();
    const { test, questions } = await createTestWithQuestions();
    const internship = await createInternship();

    await submitTest(other, test, questions[0]);
    await request(app)
      .post('/api/applications')
      .set(authHeader(other))
      .send({ internshipId: String(internship._id) });
    expect(await Result.countDocuments({ studentId: other._id })).toBe(1);

    const response = await getProgress(student);

    expect(response.body.data).toEqual({
      testsAvailable: 1,
      testsCompleted: 0,
      totalAttempts: 0,
      applicationsSubmitted: 0,
      completionPercentage: 0,
      recentActivities: [],
    });
  });

  test('returns 401 UNAUTHORIZED without a token', async () => {
    const response = await request(app).get('/api/progress');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('returns 403 FORBIDDEN for an administrator', async () => {
    const admin = await createAdmin();

    const response = await getProgress(admin);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
});
