const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "17:00"
  isAvailable: { type: Boolean, default: true }
});

const doctorSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: {
    type: Number,
    default: 0,
    min: 0
  },
  consultationFee: {
    type: Number,
    required: true,
    min: 0
  },
  bio: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  schedule: [scheduleSchema],
  hospital: {
    name: String,
    address: String,
    city: String,
    state: String
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Text search index
doctorSchema.index({ firstName: 'text', lastName: 'text', specialization: 'text' });

// Optimistic locking - increment version on save
doctorSchema.pre('save', function(next) {
  this.version += 1;
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);
