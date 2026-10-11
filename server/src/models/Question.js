const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 1000,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 6 && arr.every((o) => o.length > 0),
        message: 'Options must contain 2–6 non-empty strings.',
      },
    },
    correctOption: {
      type: Number,
      required: true,
      select: false,
    },
    category: {
      type: String,
      required: true,
    },
    marks: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
  },
  { timestamps: true }
);

questionSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.correctOption;
    return ret;
  },
});

module.exports = mongoose.model('Question', questionSchema);

