/**
 * Internships API tests — S1-03 & S1-04: Internship listing and details.
 *
 * Test Plan IDs covered:
 *  TC-INT-01 — View internship listings (role visibility, pagination, 401 without token)
 *  TC-INT-02 — Search and filter (title, company, case-insensitive, category, location, regex safety, 400 on limit > 50, meta)
 *  TC-INT-03 — View internship details (full details, hasApplied toggle, malformed id 400, unknown id 404, closed 404 student/200 admin, 401 without token)
 */
const request = require('supertest');
const app = require('../src/app');
const { Internship, Application } = require('../src/models');
const { createStudent, createAdmin, authHeader, createInternship } = require('./helpers');

require('./setup');

describe('TC-INT-01 view internship listings', () => {
  let student;
  let admin;
  let studentHeader;
  let adminHeader;

  beforeEach(async () => {
    student = await createStudent();
    admin = await createAdmin();
    studentHeader = authHeader(student);
    adminHeader = authHeader(admin);
  });

  it('student sees open listings only', async () => {
    await createInternship({ title: 'Open Dev 1', status: 'open' });
    await createInternship({ title: 'Open Dev 2', status: 'open' });
    await createInternship({ title: 'Closed Dev', status: 'closed' });

    const res = await request(app)
      .get('/api/internships')
      .set(studentHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items.every((item) => item.status === 'open')).toBe(true);

    const first = res.body.data.items[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('company');
    expect(first).toHaveProperty('location');
    expect(first).toHaveProperty('category');
    expect(first).toHaveProperty('deadline');
    expect(first).toHaveProperty('status');
  });

  it('admin sees closed listings too', async () => {
    await createInternship({ title: 'Open Dev', status: 'open' });
    await createInternship({ title: 'Closed Dev', status: 'closed' });

    const res = await request(app)
      .get('/api/internships')
      .set(adminHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.items).toHaveLength(2);
    const statuses = res.body.data.items.map((i) => i.status);
    expect(statuses).toContain('open');
    expect(statuses).toContain('closed');
  });

  it('pagination totals and items count are correct', async () => {
    for (let i = 1; i <= 5; i++) {
      await createInternship({ title: `Internship ${i}`, status: 'open' });
    }

    const resPage1 = await request(app)
      .get('/api/internships?page=1&limit=2')
      .set(studentHeader);

    expect(resPage1.status).toBe(200);
    expect(resPage1.body.data.page).toBe(1);
    expect(resPage1.body.data.limit).toBe(2);
    expect(resPage1.body.data.total).toBe(5);
    expect(resPage1.body.data.items).toHaveLength(2);

    const resPage3 = await request(app)
      .get('/api/internships?page=3&limit=2')
      .set(studentHeader);

    expect(resPage3.status).toBe(200);
    expect(resPage3.body.data.page).toBe(3);
    expect(resPage3.body.data.total).toBe(5);
    expect(resPage3.body.data.items).toHaveLength(1);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/internships');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('TC-INT-02 search and filter', () => {
  let student;
  let admin;
  let studentHeader;

  beforeEach(async () => {
    student = await createStudent();
    admin = await createAdmin();
    studentHeader = authHeader(student);

    await createInternship({
      title: 'Frontend React Developer',
      company: 'Alpha Innovations',
      location: 'Bengaluru',
      category: 'Software Development',
      status: 'open',
    });

    await createInternship({
      title: 'Backend Node.js Engineer',
      company: 'Beta Systems',
      location: 'Hyderabad',
      category: 'Software Development',
      status: 'open',
    });

    await createInternship({
      title: 'Data Analyst Intern',
      company: 'Gamma Analytics',
      location: 'Bengaluru',
      category: 'Data Science',
      status: 'open',
    });

    await createInternship({
      title: 'Closed Data Engineer',
      company: 'Delta Labs',
      location: 'Pune',
      category: 'Data Science',
      status: 'closed',
    });
  });

  it('searches by title', async () => {
    const res = await request(app)
      .get('/api/internships?search=React')
      .set(studentHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].title).toBe('Frontend React Developer');
  });

  it('searches by company', async () => {
    const res = await request(app)
      .get('/api/internships?search=Beta')
      .set(studentHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].company).toBe('Beta Systems');
  });

  it('search is case-insensitive', async () => {
    const res = await request(app)
      .get('/api/internships?search=alpha')
      .set(studentHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].company).toBe('Alpha Innovations');
  });

  it('filters by category (exact match, case-insensitive)', async () => {
    const res = await request(app)
      .get('/api/internships?category=data science')
      .set(studentHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.category ? true : true).toBe(true);
    expect(res.body.data.items[0].category).toBe('Data Science');
    expect(res.body.data.items[0].title).toBe('Data Analyst Intern');
  });

  it('filters by location (partial match, case-insensitive)', async () => {
    const res = await request(app)
      .get('/api/internships?location=galuru')
      .set(studentHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.items.every((i) => i.location === 'Bengaluru')).toBe(true);
  });

  it('combines search, category, and location filters', async () => {
    const res = await request(app)
      .get('/api/internships?search=React&category=Software Development&location=Bengaluru')
      .set(studentHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.items[0].title).toBe('Frontend React Developer');
  });

  it('handles regex special characters safely like "c++"', async () => {
    const res = await request(app)
      .get('/api/internships?search=c%2B%2B')
      .set(studentHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
    expect(res.body.data.items).toEqual([]);
  });

  it('returns empty items array and total 0 when no match found', async () => {
    const res = await request(app)
      .get('/api/internships?search=nonexistentterm12345')
      .set(studentHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
    expect(res.body.data.items).toEqual([]);
  });

  it('returns 400 VALIDATION_ERROR when limit > 50', async () => {
    const res = await request(app)
      .get('/api/internships?limit=51')
      .set(studentHeader);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field === 'limit')).toBe(true);
  });

  it('returns 400 VALIDATION_ERROR on unknown query parameters', async () => {
    const res = await request(app)
      .get('/api/internships?unknownParam=value')
      .set(studentHeader);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('meta endpoint returns distinct sorted values from visible internships', async () => {
    const studentRes = await request(app)
      .get('/api/internships/meta')
      .set(studentHeader);

    expect(studentRes.status).toBe(200);
    expect(studentRes.body.success).toBe(true);
    const { categories: sCats, locations: sLocs } = studentRes.body.data;
    expect(sCats).toEqual(['Data Science', 'Software Development']);
    expect(sLocs).toEqual(['Bengaluru', 'Hyderabad']);

    const adminHeader = authHeader(admin);
    const adminRes = await request(app)
      .get('/api/internships/meta')
      .set(adminHeader);

    expect(adminRes.status).toBe(200);
    const { locations: aLocs } = adminRes.body.data;
    expect(aLocs).toEqual(['Bengaluru', 'Hyderabad', 'Pune']);
  });
});

describe('TC-INT-03 view internship details', () => {
  let student;
  let student2;
  let admin;
  let studentHeader;
  let student2Header;
  let adminHeader;

  beforeEach(async () => {
    student = await createStudent();
    student2 = await createStudent();
    admin = await createAdmin();
    studentHeader = authHeader(student);
    student2Header = authHeader(student2);
    adminHeader = authHeader(admin);
  });

  it('returns full details for an open internship', async () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);

    const internship = await createInternship({
      title: 'Full Stack Engineer Intern',
      company: 'Zenith Tech',
      location: 'Bengaluru',
      category: 'Software Development',
      description: 'Join our core platform engineering team to build scalable services.\nRequirements: React, Node.js.',
      deadline,
      status: 'open',
    });

    const res = await request(app)
      .get(`/api/internships/${internship._id}`)
      .set(studentHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      id: internship._id.toString(),
      title: 'Full Stack Engineer Intern',
      company: 'Zenith Tech',
      location: 'Bengaluru',
      category: 'Software Development',
      description: 'Join our core platform engineering team to build scalable services.\nRequirements: React, Node.js.',
      deadline: deadline.toISOString(),
      status: 'open',
      hasApplied: false,
      deadlinePassed: false,
    });
  });

  it('hasApplied is false then true after inserting an Application directly via the model', async () => {
    const internship = await createInternship({
      title: 'DevOps Intern',
      status: 'open',
    });

    // Initially hasApplied is false
    const resInitial = await request(app)
      .get(`/api/internships/${internship._id}`)
      .set(studentHeader);

    expect(resInitial.status).toBe(200);
    expect(resInitial.body.data.hasApplied).toBe(false);

    // Insert an application directly via Application model
    await Application.create({
      studentId: student._id,
      internshipId: internship._id,
    });

    // Now hasApplied is true for this student
    const resAfter = await request(app)
      .get(`/api/internships/${internship._id}`)
      .set(studentHeader);

    expect(resAfter.status).toBe(200);
    expect(resAfter.body.data.hasApplied).toBe(true);

    // Another student still sees hasApplied: false
    const resStudent2 = await request(app)
      .get(`/api/internships/${internship._id}`)
      .set(student2Header);

    expect(resStudent2.status).toBe(200);
    expect(resStudent2.body.data.hasApplied).toBe(false);
  });

  it('returns 400 INVALID_REQUEST for malformed id', async () => {
    const res = await request(app)
      .get('/api/internships/not-a-valid-object-id')
      .set(studentHeader);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 404 INTERNSHIP_NOT_FOUND for unknown id', async () => {
    const res = await request(app)
      .get('/api/internships/507f1f77bcf86cd799439011')
      .set(studentHeader);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INTERNSHIP_NOT_FOUND');
    expect(res.body.error.message).toBe('This internship is not available.');
  });

  it('closed internship returns 404 for student but 200 for admin', async () => {
    const closedInternship = await createInternship({
      title: 'Closed Security Role',
      status: 'closed',
    });

    // Student requesting closed internship → 404 INTERNSHIP_NOT_FOUND
    const studentRes = await request(app)
      .get(`/api/internships/${closedInternship._id}`)
      .set(studentHeader);

    expect(studentRes.status).toBe(404);
    expect(studentRes.body.success).toBe(false);
    expect(studentRes.body.error.code).toBe('INTERNSHIP_NOT_FOUND');

    // Admin requesting closed internship → 200 OK (hasApplied is always false for admin)
    const adminRes = await request(app)
      .get(`/api/internships/${closedInternship._id}`)
      .set(adminHeader);

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    expect(adminRes.body.data.id).toBe(closedInternship._id.toString());
    expect(adminRes.body.data.status).toBe('closed');
    expect(adminRes.body.data.hasApplied).toBe(false);
  });

  it('returns 401 without token', async () => {
    const internship = await createInternship();

    const res = await request(app).get(`/api/internships/${internship._id}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('deadlinePassed is true when the deadline has elapsed', async () => {
    const pastDeadline = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2); // 2 days ago
    const internship = await createInternship({
      title: 'Past Deadline Role',
      deadline: pastDeadline,
      status: 'open',
    });

    const res = await request(app)
      .get(`/api/internships/${internship._id}`)
      .set(studentHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.deadlinePassed).toBe(true);
  });
});
