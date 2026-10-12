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
        validator: (arr) => Array.isArray(arr) && arr.length >= 2 && arr.length <= 6 && arr.every((o) => typeof o === 'string' && o.trim().length > 0),
        message: 'Options must contain 2–6 non-empty strings.',
      },
    },
    correctOption: {
      type: Number,
      required: true,
      min: 0,
      select: false,
      validate: {
        validator: function(val) {
          return !this.options || val < this.options.length;
        },
        message: 'correctOption must be a valid 0-based index within options.',
      },
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
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Question', questionSchema);

