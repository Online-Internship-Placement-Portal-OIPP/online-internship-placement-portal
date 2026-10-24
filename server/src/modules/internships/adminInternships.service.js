const mongoose = require('mongoose');

const Internship = require('../../models/Internship');
const Application = require('../../models/Application');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

/**
 * Create a new internship listing.
 */
async function createInternship(data, adminId) {
  const internship = await Internship.create(data);

  logger.info('Admin internship created', {
    adminId,
    internshipId: String(internship._id),
  });

  return internship;
}

/**
 * Update an existing internship listing.
 */
async function updateInternship(id, data, adminId) {
  const internship = await Internship.findByIdAndUpdate(
    id,
    { $set: data },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!internship) {
    throw new AppError('INTERNSHIP_NOT_FOUND');
  }

  logger.info('Admin internship updated', {
    adminId,
    internshipId: String(internship._id),
  });

  return internship;
}

/**
 * Delete an internship and its associated applications.
 *
 * Both operations run inside a MongoDB transaction.
 * If either operation fails, the transaction is rolled back.
 */
async function deleteInternship(id, adminId) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const internship = await Internship.findById(id).session(session);

      if (!internship) {
        throw new AppError('INTERNSHIP_NOT_FOUND');
      }

      await Application.deleteMany(
        { internshipId: id },
        { session }
      );

      await Internship.findByIdAndDelete(id, { session });
    });

    logger.info('Admin internship deleted', {
      adminId,
      internshipId: String(id),
    });

    return { deleted: true, id };
  } finally {
    await session.endSession();
  }
}

module.exports = {
  createInternship,
  updateInternship,
  deleteInternship,
};