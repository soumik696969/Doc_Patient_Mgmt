const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    index: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    required: true
  },
  doctorId: {
    type: String,
    required: true,
    index: true
  },
  doctorName: {
    type: String,
    required: true
  },
  doctorSpecialization: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  timeSlot: {
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }     // "09:30"
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'check-up', 'emergency'],
    default: 'consultation'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending',
    index: true
  },
  reason: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  prescription: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    default: ''
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  // Optimistic locking version field
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to prevent double booking
appointmentSchema.index(
  { doctorId: 1, date: 1, 'timeSlot.startTime': 1, status: 1 },
  { unique: false }
);

// Optimistic locking middleware
appointmentSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
