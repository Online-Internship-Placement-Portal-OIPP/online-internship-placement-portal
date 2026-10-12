const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['TEST_COMPLETED', 'INTERNSHIP_APPLIED'],
      required: true,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

activitySchema.index({ studentId: 1, createdAt: -1 });

activitySchema.set('toJSON', {
  transform(doc, ret) {
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Activity', activitySchema);

