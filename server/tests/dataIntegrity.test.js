const request = require('supertest');
const app = require('../src/app');
const { Application, Internship, Result } = require('../src/models');
const { authHeader, createAdmin, createInternship, createStudent, createTestWithQuestions } = require('./helpers');

describe('TC-DATA-01 application and result data integrity', () => {
  it('concurrent duplicate applications create exactly one record', async () => {
    const student = await createStudent();
    const internship = await createInternship();
    const payload = { internshipId: internship._id.toString() };
    const responses = await Promise.all([
      request(app).post('/api/applications').set(authHeader(student)).send(payload),
      request(app).post('/api/applications').set(authHeader(student)).send(payload),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await Application.countDocuments({ studentId: student._id, internshipId: internship._id })).toBe(1);
  });

  it('creates one result linked to the token student and submitted test', async () => {
    const student = await createStudent();
    const { test, questions } = await createTestWithQuestions({ questions: [{ text: 'Integrity question?', options: ['Yes', 'No'], correctOption: 0, category: 'Logical', marks: 1 }] });
    const response = await request(app).post(`/api/tests/${test._id}/submit`).set(authHeader(student)).send({ answers: [{ questionId: questions[0]._id.toString(), selectedOption: 0 }] });
    expect(response.status).toBe(200);
    expect(await Result.countDocuments({ studentId: student._id, testId: test._id })).toBe(1);
  });

  it('writes no result for an invalid submission', async () => {
    const student = await createStudent();
    const { test, questions } = await createTestWithQuestions({ questions: [{ text: 'Invalid submission question?', options: ['Yes', 'No'], correctOption: 0, category: 'Logical', marks: 1 }] });
    const response = await request(app).post(`/api/tests/${test._id}/submit`).set(authHeader(student)).send({ answers: [{ questionId: questions[0]._id.toString(), selectedOption: 99 }] });
    expect(response.status).toBe(400);
    expect(await Result.countDocuments({ studentId: student._id, testId: test._id })).toBe(0);
  });

  it('rejects a duplicate application at the database level through the unique index', async () => {
    const student = await createStudent();
    const internship = await createInternship();
    const record = { studentId: student._id, internshipId: internship._id };
    await Application.create(record);
    await expect(Application.create(record)).rejects.toMatchObject({ code: 11000 });
    expect(await Application.countDocuments(record)).toBe(1);
  });

  it('rejects a studentId in the request body and takes the owner from the token', async () => {
    const student = await createStudent();
    const otherStudent = await createStudent();
    const internship = await createInternship();
    const internshipId = internship._id.toString();
    const spoofed = await request(app).post('/api/applications').set(authHeader(student)).send({ internshipId, studentId: otherStudent._id.toString() });
    expect(spoofed.status).toBe(400);
    expect(spoofed.body.error.code).toBe('INVALID_APPLICATION');
    expect(await Application.countDocuments({ internshipId: internship._id })).toBe(0);
    const applied = await request(app).post('/api/applications').set(authHeader(student)).send({ internshipId });
    expect(applied.status).toBe(201);
    expect(await Application.countDocuments({ studentId: student._id, internshipId: internship._id })).toBe(1);
    expect(await Application.countDocuments({ studentId: otherStudent._id })).toBe(0);
  });

  it('deleting an internship also deletes its applications', async () => {
    const student = await createStudent();
    const admin = await createAdmin();
    const internship = await createInternship();
    const applied = await request(app).post('/api/applications').set(authHeader(student)).send({ internshipId: internship._id.toString() });
    expect(applied.status).toBe(201);
    const response = await request(app).delete(`/api/admin/internships/${internship._id}`).set(authHeader(admin));
    expect(response.status).toBe(200);
    expect(await Application.countDocuments({ internshipId: internship._id })).toBe(0);
  });
});
