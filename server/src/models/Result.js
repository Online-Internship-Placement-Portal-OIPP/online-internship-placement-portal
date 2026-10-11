const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    score: {
      type: Number,
    },
    totalMarks: {
      type: Number,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    categoryScores: [
      {
        category: { type: String },
        score: { type: Number },
        total: { type: Number },
        _id: false,
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

resultSchema.index({ studentId: 1, submittedAt: -1 });

resultSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.correctOption;
    return ret;
  },
});

module.exports = mongoose.model('Result', resultSchema);

