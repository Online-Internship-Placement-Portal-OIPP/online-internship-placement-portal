const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 120,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 180,
    },
  },
  { timestamps: true }
);

testSchema.set('toJSON', {
  transform(doc, ret) {
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Test', testSchema);

