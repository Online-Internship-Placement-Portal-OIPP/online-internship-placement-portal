
/**
 * S1-07: Admin Internship Management API tests.
 */

const request = require('supertest');
const app = require('../src/app');
const { Internship } = require('../src/models');
const {
  createAdmin,
  createStudent,
  authHeader,
  createInternship,
} = require('./helpers');

require('./setup');

describe('TC-ADM-01 Admin Internship Management', () => {
  let adminHeader;
  let studentHeader;

  const validInternship = {
    title: 'Software Engineering Intern',
    company: 'Example Technologies',
    location: 'Bengaluru',
    category: 'Software Development',
    description: 'Develop and test software applications.',
    deadline: '2027-03-31',
    status: 'open',
  };

  beforeEach(async () => {
    const admin = await createAdmin();
    const student = await createStudent();

    adminHeader = authHeader(admin);
    studentHeader = authHeader(student);
  });

  test('admin can create an internship', async () => {
    const res = await request(app)
      .post('/api/admin/internships')
      .set(adminHeader)
      .send(validInternship);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(validInternship.title);

    const saved = await Internship.findOne({
      title: validInternship.title,
    });

    expect(saved).not.toBeNull();
  });

  test('admin can update an internship', async () => {
    const internship = await createInternship();

    const res = await request(app)
      .put(`/api/admin/internships/${internship._id}`)
      .set(adminHeader)
      .send({ title: 'Updated Internship Title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Internship Title');
  });

  test('admin can delete an internship', async () => {
    const internship = await createInternship();

    const res = await request(app)
      .delete(`/api/admin/internships/${internship._id}`)
      .set(adminHeader);

    expect(res.status).toBe(200);

    const deleted = await Internship.findById(internship._id);
    expect(deleted).toBeNull();
  });
  test('deleting an internship also deletes its applications', async () => {
  const { Application } = require('../src/models');

  const internship = await createInternship();
  const otherInternship = await createInternship();

  const student = await createStudent();

  await Application.create([
    {
      studentId: student._id,
      internshipId: internship._id,
    },
    {
      studentId: student._id,
      internshipId: otherInternship._id,
    },
  ]);

  const res = await request(app)
    .delete(`/api/admin/internships/${internship._id}`)
    .set(adminHeader);

  expect(res.status).toBe(200);
  expect(res.body.data).toEqual({
    deleted: true,
    id: String(internship._id),
  });

  const deletedInternship = await Internship.findById(internship._id);
  expect(deletedInternship).toBeNull();

  const deletedApplications = await Application.countDocuments({
    internshipId: internship._id,
  });
  expect(deletedApplications).toBe(0);

  const unrelatedApplications = await Application.countDocuments({
    internshipId: otherInternship._id,
  });
  expect(unrelatedApplications).toBe(1);
});

  test('student cannot create an internship', async () => {
    const res = await request(app)
      .post('/api/admin/internships')
      .set(studentHeader)
      .send(validInternship);

    expect(res.status).toBe(403);
  });

  test('student cannot update an internship', async () => {
    const internship = await createInternship();

    const res = await request(app)
      .put(`/api/admin/internships/${internship._id}`)
      .set(studentHeader)
      .send({ title: 'Unauthorized Update' });

    expect(res.status).toBe(403);
  });

  test('student cannot delete an internship', async () => {
    const internship = await createInternship();

    const res = await request(app)
      .delete(`/api/admin/internships/${internship._id}`)
      .set(studentHeader);

    expect(res.status).toBe(403);
  });

  test('unauthenticated user cannot create an internship', async () => {
    const res = await request(app)
      .post('/api/admin/internships')
      .send(validInternship);

    expect(res.status).toBe(401);
  });

  test('invalid internship data is rejected', async () => {
    const res = await request(app)
      .post('/api/admin/internships')
      .set(adminHeader)
      .send({
        title: 'A',
        company: '',
      });

    expect(res.status).toBe(400);
  });
  test('admin cannot create an internship with a past deadline', async () => {
  const res = await request(app)
    .post('/api/admin/internships')
    .set(adminHeader)
    .send({
      ...validInternship,
      deadline: '2020-01-01',
    });

  expect(res.status).toBe(400);

  const saved = await Internship.findOne({
    title: validInternship.title,
  });

  expect(saved).toBeNull();
});

  test('malformed internship ID is rejected', async () => {
    const res = await request(app)
      .delete('/api/admin/internships/invalid-id')
      .set(adminHeader);

    expect(res.status).toBe(400);
  });

  test('updating a nonexistent internship returns 404', async () => {
    const res = await request(app)
      .put('/api/admin/internships/507f1f77bcf86cd799439011')
      .set(adminHeader)
      .send({ title: 'Updated Internship' });

    expect(res.status).toBe(404);
  });
  test('deleting a nonexistent internship returns INTERNSHIP_NOT_FOUND', async () => {
  const res = await request(app)
    .delete('/api/admin/internships/507f1f77bcf86cd799439011')
    .set(adminHeader);

  expect(res.status).toBe(404);
  expect(res.body.error.code).toBe('INTERNSHIP_NOT_FOUND');
});
test('failed internship deletion rolls back application deletion', async () => {
  const { Application } = require('../src/models');

  const internship = await createInternship();
  const student = await createStudent();

  await Application.create({
    studentId: student._id,
    internshipId: internship._id,
  });

  const deleteSpy = jest
    .spyOn(Internship, 'findByIdAndDelete')
    .mockImplementationOnce(() => {
      throw new Error('Simulated database failure');
    });

  try {
    const res = await request(app)
      .delete(`/api/admin/internships/${internship._id}`)
      .set(adminHeader);

    expect(res.status).toBe(500);

    const savedInternship = await Internship.findById(internship._id);
    expect(savedInternship).not.toBeNull();

    const applicationCount = await Application.countDocuments({
      internshipId: internship._id,
    });

    expect(applicationCount).toBe(1);
  } finally {
    deleteSpy.mockRestore();
  }
});
test('admin creation logs the admin ID and internship ID', async () => {
  const logger = require('../src/utils/logger');

  const admin = await createAdmin();
  const header = authHeader(admin);

  const logSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});

  try {
    const res = await request(app)
      .post('/api/admin/internships')
      .set(header)
      .send(validInternship);

    expect(res.status).toBe(201);

    expect(logSpy).toHaveBeenCalledWith(
      'Admin internship created',
      expect.objectContaining({
        adminId: String(admin._id),
        internshipId: res.body.data.id,
      })
    );
  } finally {
    logSpy.mockRestore();
  }
});
test('admin update logs the admin ID and internship ID', async () => {
  const logger = require('../src/utils/logger');

  const internship = await createInternship();
  const admin = await createAdmin();
  const header = authHeader(admin);

  const logSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});

  try {
    const res = await request(app)
      .put(`/api/admin/internships/${internship._id}`)
      .set(header)
      .send({ title: 'Updated Internship Title' });

    expect(res.status).toBe(200);

    expect(logSpy).toHaveBeenCalledWith(
      'Admin internship updated',
      expect.objectContaining({
        adminId: String(admin._id),
        internshipId: String(internship._id),
      })
    );
  } finally {
    logSpy.mockRestore();
  }
});
test('admin deletion logs the admin ID and internship ID', async () => {
  const logger = require('../src/utils/logger');

  const internship = await createInternship();
  const admin = await createAdmin();
  const header = authHeader(admin);

  const logSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});

  try {
    const res = await request(app)
      .delete(`/api/admin/internships/${internship._id}`)
      .set(header);

    expect(res.status).toBe(200);

    expect(logSpy).toHaveBeenCalledWith(
      'Admin internship deleted',
      expect.objectContaining({
        adminId: String(admin._id),
        internshipId: String(internship._id),
      })
    );
  } finally {
    logSpy.mockRestore();
  }
});
});
