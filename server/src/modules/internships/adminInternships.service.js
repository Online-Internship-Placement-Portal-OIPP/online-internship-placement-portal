
const Internship = require('../../models/Internship');
const AppError = require('../../utils/AppError');

/**
 * Create a new internship listing.
 */
async function createInternship(data) {
  return Internship.create(data);
}

/**
 * Update an existing internship listing.
 */
async function updateInternship(id, data) {
  const internship = await Internship.findByIdAndUpdate(
    id,
    { $set: data },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!internship) {
    throw new AppError('NOT_FOUND');
  }

  return internship;
}

/**
 * Delete an existing internship listing.
 */
async function deleteInternship(id) {
  const internship = await Internship.findByIdAndDelete(id);

  if (!internship) {
    throw new AppError('NOT_FOUND');
  }

  return internship;
}

module.exports = {
  createInternship,
  updateInternship,
  deleteInternship,
};
