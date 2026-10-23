const { Application, Internship } = require('../../models');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const { recordActivity } = require('../progress/activity.service');

async function submitApplication(studentId, internshipId) {
  const internship = await Internship.findById(internshipId);
  if (!internship) {
    throw new AppError('INTERNSHIP_NOT_FOUND');
  }

  if (internship.status !== 'open' || internship.deadline <= new Date()) {
    throw new AppError('INVALID_APPLICATION', 'This internship is closed for applications.');
  }

  const duplicate = await Application.exists({ studentId, internshipId });
  if (duplicate) {
    throw new AppError('DUPLICATE_APPLICATION');
  }

  let application;
  try {
    application = await Application.create({ studentId, internshipId });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('DUPLICATE_APPLICATION');
    }
    throw error;
  }

  try {
    await recordActivity(studentId, 'INTERNSHIP_APPLIED', internshipId);
  } catch (error) {
    logger.warn('Unable to record internship application activity', {
      studentId,
      internshipId,
      message: error.message,
    });
  }

  return {
    applicationId: application._id.toString(),
    internshipId: application.internshipId.toString(),
    status: application.status,
    appliedAt: application.appliedAt,
  };
}

async function listApplications(studentId) {
  const applications = await Application.find({ studentId })
    .sort({ createdAt: -1 })
    .lean();

  const internshipIds = applications.map((application) => application.internshipId);
  const internships = await Internship.find({ _id: { $in: internshipIds } }).lean();
  const internshipById = new Map(internships.map((internship) => [String(internship._id), internship]));

  return applications.map((application) => {
    const internship = internshipById.get(String(application.internshipId));
    return {
      applicationId: String(application._id),
      internshipId: String(application.internshipId),
      internshipTitle: internship?.title || 'Internship removed',
      company: internship?.company || '—',
      location: internship?.location || '—',
      status: application.status,
      appliedAt: application.appliedAt,
    };
  });
}

module.exports = { submitApplication, listApplications };
