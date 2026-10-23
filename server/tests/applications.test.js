const request = require('supertest');
const app = require('../src/app');
const { Activity, Application, Internship } = require('../src/models');
const {
  authHeader,
  createAdmin,
  createInternship,
  createStudent,
} = require('./helpers');

describe('TC-APP-01 submit internship application', () => {
  it('submits once, records activity, and rejects a duplicate', async () => {
    const student = await createStudent();
    const internship = await createInternship();
    const headers = authHeader(student);

    const first = await request(app)
      .post('/api/applications')
      .set(headers)
      .send({ internshipId: internship._id.toString() });

    expect(first.status).toBe(201);
    expect(first.body.data).toMatchObject({
      internshipId: internship._id.toString(),
      status: 'Submitted',
    });
    expect(await Application.countDocuments({ studentId: student._id })).toBe(1);
    expect(await Activity.countDocuments({
      studentId: student._id,
      type: 'INTERNSHIP_APPLIED',
      refId: internship._id,
    })).toBe(1);

    const duplicate = await request(app)
      .post('/api/applications')
      .set(headers)
      .send({ internshipId: internship._id.toString() });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_APPLICATION');
  });

  it('rejects closed, past-deadline, unknown, and malformed internships', async () => {
    const student = await createStudent();
    const headers = authHeader(student);
    const closed = await createInternship({ status: 'closed' });
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const expired = await createInternship({ deadline: past });

    for (const internship of [closed, expired]) {
      const response = await request(app)
        .post('/api/applications')
        .set(headers)
        .send({ internshipId: internship._id.toString() });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_APPLICATION');
    }

    const unknown = await request(app)
      .post('/api/applications')
      .set(headers)
      .send({ internshipId: '507f1f77bcf86cd799439011' });
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe('INTERNSHIP_NOT_FOUND');

    const malformed = await request(app)
      .post('/api/applications')
      .set(headers)
      .send({ internshipId: 'not-an-object-id' });
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('INVALID_APPLICATION');
  });

  it('rejects admins, unauthenticated requests, and unknown body fields', async () => {
    const student = await createStudent();
    const admin = await createAdmin();
    const internship = await createInternship();

    const adminResponse = await request(app)
      .post('/api/applications')
      .set(authHeader(admin))
      .send({ internshipId: internship._id.toString() });
    expect(adminResponse.status).toBe(403);

    const unauthenticated = await request(app)
      .post('/api/applications')
      .send({ internshipId: internship._id.toString() });
    expect(unauthenticated.status).toBe(401);

    const extraField = await request(app)
      .post('/api/applications')
      .set(authHeader(student))
      .send({ internshipId: internship._id.toString(), studentId: student._id.toString() });
    expect(extraField.status).toBe(400);
  });
});

describe('TC-DATA-01 data integrity — duplicate applications', () => {
  it('allows exactly one record when duplicate requests race', async () => {
    const student = await createStudent();
    const internship = await createInternship();
    const payload = { internshipId: internship._id.toString() };
    const headers = authHeader(student);

    const responses = await Promise.all([
      request(app).post('/api/applications').set(headers).send(payload),
      request(app).post('/api/applications').set(headers).send(payload),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(await Application.countDocuments({ studentId: student._id, internshipId: internship._id })).toBe(1);
  });
});

describe('TC-APP-02 view own applications', () => {
  it('returns the caller applications newest first and handles removed internships', async () => {
    const student = await createStudent();
    const otherStudent = await createStudent();
    const first = await createInternship({ title: 'First Internship' });
    const second = await createInternship({ title: 'Second Internship' });
    const olderApplicationDate = new Date('2026-10-20T10:00:00.000Z');
    const newerApplicationDate = new Date('2026-10-21T10:00:00.000Z');
    await Application.create([
      { studentId: student._id, internshipId: first._id, appliedAt: olderApplicationDate },
      { studentId: student._id, internshipId: second._id, appliedAt: newerApplicationDate },
      { studentId: otherStudent._id, internshipId: first._id, appliedAt: olderApplicationDate },
    ]);
    await Internship.deleteOne({ _id: first._id });

    const response = await request(app)
      .get('/api/applications')
      .set(authHeader(student));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).toMatchObject({
      internshipTitle: 'Second Internship',
      company: 'OIPP Demo Company',
    });
    expect(response.body.data[1]).toMatchObject({
      internshipTitle: 'Internship removed',
      company: '—',
      location: '—',
    });
  });
});

describe('TC-SEC-04 applications are private', () => {
  it('returns only the caller applications and rejects admin access', async () => {
    const studentA = await createStudent();
    const studentB = await createStudent();
    const admin = await createAdmin();
    const first = await createInternship();
    const second = await createInternship();
    await Application.create([
      { studentId: studentA._id, internshipId: first._id },
      { studentId: studentA._id, internshipId: second._id },
      { studentId: studentB._id, internshipId: first._id },
    ]);

    const response = await request(app)
      .get('/api/applications')
      .set(authHeader(studentB));
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].internshipId).toBe(first._id.toString());

    const adminResponse = await request(app)
      .get('/api/applications')
      .set(authHeader(admin));
    expect(adminResponse.status).toBe(403);
  });
});
