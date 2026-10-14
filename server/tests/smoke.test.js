const request = require('supertest');
const app = require('../src/app');
const { Application } = require('../src/models');
const { createStudent, createInternship, createTestWithQuestions } = require('./helpers');

describe('Smoke tests', () => {
  it('returns an available database from the health endpoint', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: 'ok', db: 'up' },
    });
  });

  it('returns the standard error envelope for an unknown route', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects malformed JSON without exposing a server error', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{bad json');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_REQUEST');
  });

  it('creates usable documents through the test helpers', async () => {
    const student = await createStudent();
    const internship = await createInternship();
    const { test, questions } = await createTestWithQuestions();

    expect(student.role).toBe('student');
    expect(internship.status).toBe('open');
    expect(test.title).toBe('Test Aptitude Set');
    expect(questions).toHaveLength(1);
  });

  it('enforces the application unique index required by NFR-04', async () => {
    const student = await createStudent();
    const internship = await createInternship();

    await Application.create({ studentId: student._id, internshipId: internship._id });

    await expect(
      Application.create({ studentId: student._id, internshipId: internship._id })
    ).rejects.toMatchObject({ code: 11000 });
  });
});
