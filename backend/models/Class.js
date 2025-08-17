const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    minlength: [2, 'Class name must be at least 2 characters long']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  teacher: {
    type: String,
    required: [true, 'Teacher name is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
classSchema.index({ name: 1, subject: 1 });

module.exports = mongoose.model('Class', classSchema);
