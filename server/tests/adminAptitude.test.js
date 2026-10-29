/**
 * S2-03: TC-ADM-02 Admin Aptitude Test and Question Management.
 */

const request = require('supertest');
const app = require('../src/app');

const {
  createAdmin,
  createStudent,
  authHeader,
  createTestWithQuestions,
} = require('./helpers');

require('./setup');

describe('TC-ADM-02 Admin Aptitude Management', () => {
  let adminHeader;
  let studentHeader;

  beforeEach(async () => {
    const admin = await createAdmin();
    const student = await createStudent();

    adminHeader = authHeader(admin);
    studentHeader = authHeader(student);
  });

  test('admin can access the aptitude test list', async () => {
    const res = await request(app)
      .get('/api/admin/tests')
      .set(adminHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('student cannot access admin aptitude tests', async () => {
    const res = await request(app)
      .get('/api/admin/tests')
      .set(studentHeader);

    expect(res.status).toBe(403);
  });

  test('unauthenticated user cannot access admin aptitude tests', async () => {
    const res = await request(app)
      .get('/api/admin/tests');

    expect(res.status).toBe(401);
  });

  test('student cannot create an aptitude test', async () => {
    const res = await request(app)
      .post('/api/admin/tests')
      .set(studentHeader)
      .send({
        title: 'Unauthorized Aptitude Test',
        category: 'Quantitative',
        description: 'Should not be created.',
        durationMinutes: 20,
      });

    expect(res.status).toBe(403);
  });

  test('student cannot delete an aptitude test', async () => {
    const { test } = await createTestWithQuestions();

    const res = await request(app)
      .delete(`/api/admin/tests/${test._id}`)
      .set(studentHeader);

    expect(res.status).toBe(403);
  });
    test('admin can create an aptitude test', async () => {
    const res = await request(app)
      .post('/api/admin/tests')
      .set(adminHeader)
      .send({
        title: 'Placement Aptitude Test',
        category: 'Quantitative',
        description: 'A test for placement preparation.',
        durationMinutes: 30,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Placement Aptitude Test');
  });

  test('admin can view a test with its questions', async () => {
    const { test } = await createTestWithQuestions();

    const res = await request(app)
      .get(`/api/admin/tests/${test._id}`)
      .set(adminHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.questions).toHaveLength(1);
    expect(res.body.data.questions[0].correctOption).toBe(1);
  });

  test('admin can update an aptitude test', async () => {
    const { test } = await createTestWithQuestions();

    const res = await request(app)
      .put(`/api/admin/tests/${test._id}`)
      .set(adminHeader)
      .send({ title: 'Updated Aptitude Test' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Aptitude Test');
  });

  test('admin can delete an aptitude test', async () => {
    const { Test, Question } = require('../src/models');
    const { test } = await createTestWithQuestions();

    const res = await request(app)
      .delete(`/api/admin/tests/${test._id}`)
      .set(adminHeader);

    expect(res.status).toBe(200);
    expect(await Test.findById(test._id)).toBeNull();
    expect(await Question.countDocuments({ testId: test._id })).toBe(0);
  });
    test('admin can add a question to an aptitude test', async () => {
    const { Question } = require('../src/models');
    const { test } = await createTestWithQuestions();

    const res = await request(app)
      .post(`/api/admin/tests/${test._id}/questions`)
      .set(adminHeader)
      .send({
        text: 'What is 10 plus 5?',
        options: ['10', '15', '20', '25'],
        correctOption: 1,
        category: 'Quantitative',
        marks: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const saved = await Question.findById(res.body.data.id);
    expect(saved).not.toBeNull();
    expect(saved.testId.toString()).toBe(test._id.toString());
  });

  test('admin can update an aptitude question', async () => {
    const { questions } = await createTestWithQuestions();
    const question = questions[0];

    const res = await request(app)
      .put(`/api/admin/questions/${question._id}`)
      .set(adminHeader)
      .send({ text: 'What is 5 plus 5?' });

    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe('What is 5 plus 5?');
  });

  test('admin can delete an aptitude question', async () => {
    const { Question } = require('../src/models');
    const { questions } = await createTestWithQuestions();
    const question = questions[0];

    const res = await request(app)
      .delete(`/api/admin/questions/${question._id}`)
      .set(adminHeader);

    expect(res.status).toBe(200);
    expect(await Question.findById(question._id)).toBeNull();
  });
    test('rejects a question with an invalid correctOption', async () => {
    const { test } = await createTestWithQuestions();

    const res = await request(app)
      .post(`/api/admin/tests/${test._id}/questions`)
      .set(adminHeader)
      .send({
        text: 'What is 2 plus 3?',
        options: ['4', '5', '6'],
        correctOption: 5,
        category: 'Quantitative',
        marks: 1,
      });

    expect(res.status).toBe(400);
  });

  test('rejects an aptitude test without a title', async () => {
    const res = await request(app)
      .post('/api/admin/tests')
      .set(adminHeader)
      .send({
        category: 'Quantitative',
        durationMinutes: 30,
      });

    expect(res.status).toBe(400);
  });

  test('rejects unknown fields when creating a test', async () => {
    const res = await request(app)
      .post('/api/admin/tests')
      .set(adminHeader)
      .send({
        title: 'Placement Practice',
        category: 'Quantitative',
        durationMinutes: 30,
        unexpectedField: 'not allowed',
      });

    expect(res.status).toBe(400);
  });
});