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
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.correctOption;
    return ret;
  },
});

module.exports = mongoose.model('Activity', activitySchema);

