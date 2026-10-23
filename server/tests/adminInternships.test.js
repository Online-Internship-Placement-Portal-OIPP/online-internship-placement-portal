
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

describe('S1-07 Admin Internship Management', () => {
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
});
