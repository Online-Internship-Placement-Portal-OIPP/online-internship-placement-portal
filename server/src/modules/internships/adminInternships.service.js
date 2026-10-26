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
 * Check whether the active MongoDB deployment supports multi-document transactions.
 * Transactions require a replica set or sharded cluster.
 */
function supportsTransactions() {
  const topology = mongoose.connection?.client?.topology?.description;
  if (!topology) return false;
  return Boolean(topology.setName) || topology.type === 'ReplicaSetWithPrimary' || topology.type === 'Sharded';
}

/**
 * Check whether a database error indicates that transactions are unsupported.
 */
function isTransactionUnsupportedError(error) {
  if (!error) return false;
  const message = error.message || '';
  return (
    error.name === 'MongoServerError' &&
    (error.code === 20 ||
      error.codeName === 'IllegalOperation' ||
      /transaction numbers are only allowed on a replica set member or mongos/i.test(message) ||
      /does not support .*transactions/i.test(message))
  );
}

/**
 * Cascade-delete an internship and its associated applications.
 */
async function executeCascadeDelete(id, session = null) {
  const options = session ? { session } : {};

  const internship = await Internship.findById(id).session(session || null);
  if (!internship) {
    throw new AppError('INTERNSHIP_NOT_FOUND');
  }

  await Application.deleteMany({ internshipId: id }, options);
  await Internship.findByIdAndDelete(id, options);
}

/**
 * Delete an internship and its associated applications.
 *
 * If transactions are supported by the database deployment (replica set or mongos),
 * both operations run atomically inside a MongoDB transaction.
 * If transactions are unsupported (e.g. standalone local Community Server),
 * cascade deletion runs sequentially.
 */
async function deleteInternship(id, adminId) {
  if (supportsTransactions()) {
    let session;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        await executeCascadeDelete(id, session);
      });
    } catch (error) {
      if (isTransactionUnsupportedError(error)) {
        await executeCascadeDelete(id);
      } else {
        throw error;
      }
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  } else {
    await executeCascadeDelete(id);
  }

  logger.info('Admin internship deleted', {
    adminId,
    internshipId: String(id),
  });

  return { deleted: true, id };
}

module.exports = {
  createInternship,
  updateInternship,
  deleteInternship,
  supportsTransactions,
};