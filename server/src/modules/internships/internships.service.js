/**
 * Internships Service (M2) — Read operations.
 *
 * FR-03, FR-04: Listing, searching, and filtering internships.
 * FR-05: View internship details by ID.
 * Write operations belong to M7 / S1-07 (internships.admin.service.js).
 */
const { Internship, Application } = require('../../models');
const AppError = require('../../utils/AppError');
const escapeRegex = require('../../utils/escapeRegex');

/**
 * List internships with search, filter, and pagination.
 *
 * @param {object} params
 * @param {string} [params.search]
 * @param {string} [params.category]
 * @param {string} [params.location]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} role - 'student' or 'admin'
 * @returns {Promise<{ items: Array, page: number, limit: number, total: number }>}
 */
async function listInternships({ search, category, location, page = 1, limit = 10 } = {}, role = 'student') {
  const filter = {};

  // Students see only open listings; admins see all (open and closed)
  if (role !== 'admin') {
    filter.status = 'open';
  }

  // Search by title or company (case-insensitive)
  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    const searchRegex = new RegExp(escaped, 'i');
    filter.$or = [{ title: searchRegex }, { company: searchRegex }];
  }

  // Category exact match (case-insensitive, anchored)
  if (category && category.trim()) {
    const escaped = escapeRegex(category.trim());
    filter.category = new RegExp(`^${escaped}$`, 'i');
  }

  // Location partial match (case-insensitive)
  if (location && location.trim()) {
    const escaped = escapeRegex(location.trim());
    filter.location = new RegExp(escaped, 'i');
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [total, docs] = await Promise.all([
    Internship.countDocuments(filter),
    Internship.find(filter)
      .sort({ deadline: 1, title: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  const items = docs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    company: doc.company,
    location: doc.location,
    category: doc.category,
    deadline: doc.deadline,
    status: doc.status,
  }));

  return {
    items,
    page: pageNum,
    limit: limitNum,
    total,
  };
}

/**
 * Get distinct categories and locations for filter dropdowns.
 *
 * @param {string} role - 'student' or 'admin'
 * @returns {Promise<{ categories: string[], locations: string[] }>}
 */
async function getMeta(role = 'student') {
  const filter = {};
  if (role !== 'admin') {
    filter.status = 'open';
  }

  const [categories, locations] = await Promise.all([
    Internship.distinct('category', filter),
    Internship.distinct('location', filter),
  ]);

  return {
    categories: categories.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    locations: locations.filter(Boolean).sort((a, b) => a.localeCompare(b)),
  };
}

/**
 * Get a single internship by its ID.
 *
 * FR-05 / SR-04 / SR-05:
 * - Unknown internship → 404 INTERNSHIP_NOT_FOUND
 * - Students requesting a closed internship → 404 INTERNSHIP_NOT_FOUND
 * - Admins can view both open and closed internships
 * - Students receive `hasApplied: true|false` based on existing applications
 * - Admins receive `hasApplied: false`
 * - Both receive `deadlinePassed: true|false` based on whether the deadline has elapsed
 *
 * @param {string} id - Internship ObjectId
 * @param {{ id?: string, role?: string }} user - Verified JWT user (req.user)
 * @returns {Promise<{ id: string, title: string, company: string, location: string, category: string, description: string, deadline: Date, status: string, hasApplied: boolean, deadlinePassed: boolean }>}
 */
async function getInternship(id, user) {
  const doc = await Internship.findById(id).lean();
  if (!doc) {
    throw new AppError('INTERNSHIP_NOT_FOUND');
  }

  const isStudent = user?.role !== 'admin';

  // Students requesting a closed internship get 404 INTERNSHIP_NOT_FOUND
  if (isStudent && doc.status === 'closed') {
    throw new AppError('INTERNSHIP_NOT_FOUND');
  }

  let hasApplied = false;
  if (isStudent && user?.id) {
    const existing = await Application.exists({
      studentId: user.id,
      internshipId: doc._id,
    });
    hasApplied = Boolean(existing);
  }

  const deadlinePassed = doc.deadline ? new Date(doc.deadline).getTime() < Date.now() : false;

  return {
    id: doc._id.toString(),
    title: doc.title,
    company: doc.company,
    location: doc.location,
    category: doc.category,
    description: doc.description,
    deadline: doc.deadline,
    status: doc.status,
    hasApplied,
    deadlinePassed,
  };
}

module.exports = {
  listInternships,
  getMeta,
  getInternship,
};
