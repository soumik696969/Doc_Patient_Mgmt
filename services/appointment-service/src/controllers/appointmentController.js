const Appointment = require('../models/Appointment');
const { publishMessage } = require('../config/rabbitmq');
const { logger } = require('../utils/logger');
const axios = require('axios');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// =============================================
// SAGA PATTERN: Book Appointment
// Steps: 1. Validate slot → 2. Create appointment → 3. Notify
// Compensation: Cancel appointment if downstream fails
// =============================================
exports.bookAppointment = async (req, res) => {
  const session = await Appointment.startSession();
  
  try {
    const patientId = req.headers['x-user-id'];
    const patientEmail = req.headers['x-user-email'] || '';
    const {
      doctorId, doctorName, doctorSpecialization, patientName,
      date, timeSlot, type, reason, consultationFee
    } = req.body;

    // SAGA Step 1: Check for conflicting appointments (Optimistic Locking)
    const conflicting = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      'timeSlot.startTime': timeSlot.startTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflicting) {
      return res.status(409).json({
        error: 'Time slot already booked',
        message: 'This time slot is no longer available. Please choose another slot.'
      });
    }

    // Check if patient already has appointment at same time
    const patientConflict = await Appointment.findOne({
      patientId,
      date: new Date(date),
      'timeSlot.startTime': timeSlot.startTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (patientConflict) {
      return res.status(409).json({
        error: 'You already have an appointment at this time'
      });
    }

    // SAGA Step 2: Create appointment with optimistic lock
    const appointment = new Appointment({
      patientId,
      patientName: patientName || 'Patient',
      patientEmail: patientEmail || '',
      doctorId,
      doctorName: doctorName || 'Doctor',
      doctorSpecialization: doctorSpecialization || '',
      date: new Date(date),
      timeSlot,
      type: type || 'consultation',
      reason: reason || '',
      consultationFee: consultationFee || 0,
      status: 'pending',
      version: 0
    });

    await appointment.save();

    // SAGA Step 3: Publish event for notification
    await publishMessage('notification_events', 'appointment.booked', {
      appointmentId: appointment._id,
      patientId,
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      doctorId,
      doctorName: appointment.doctorName,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      type: appointment.type
    });

    await publishMessage('appointment_events', 'appointment.created', {
      appointmentId: appointment._id,
      doctorId,
      patientId,
      date: appointment.date,
      timeSlot: appointment.timeSlot
    });

    logger.info(`Appointment booked: ${appointment._id}`);

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    // SAGA Compensation: Log and handle failure
    logger.error('Book appointment error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Appointment conflict detected',
        message: 'This slot was just booked by someone else. Please try another slot.'
      });
    }

    res.status(500).json({ error: 'Failed to book appointment' });
  }
};

// Get appointments for patient
exports.getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.headers['x-user-id'];
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { patientId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Appointment.countDocuments(filter)
    ]);

    res.json({
      appointments,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    logger.error('Get patient appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get appointments for doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, date, page = 1, limit = 10 } = req.query;

    const filter = { doctorId };
    if (status) filter.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .sort({ date: 1, 'timeSlot.startTime': 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Appointment.countDocuments(filter)
    ]);

    res.json({
      appointments,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    logger.error('Get doctor appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Update appointment status (with optimistic locking)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, version, notes, prescription, diagnosis, cancellationReason } = req.body;

    // Optimistic lock: only update if version matches
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, version: version || 0 },
      {
        status,
        ...(notes && { notes }),
        ...(prescription && { prescription }),
        ...(diagnosis && { diagnosis }),
        ...(cancellationReason && { cancellationReason }),
        $inc: { version: 1 }
      },
      { new: true }
    );

    if (!appointment) {
      const existing = await Appointment.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      return res.status(409).json({
        error: 'Conflict: Appointment was modified by another request',
        currentVersion: existing.version,
        message: 'Please refresh and try again.'
      });
    }

    // Publish status change event
    const eventType = status === 'cancelled' ? 'appointment.cancelled' :
                      status === 'confirmed' ? 'appointment.confirmed' :
                      status === 'completed' ? 'appointment.completed' :
                      'appointment.updated';

    await publishMessage('notification_events', eventType, {
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      status: appointment.status
    });

    res.json({ message: `Appointment ${status}`, appointment });
  } catch (error) {
    logger.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).lean();
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ appointment });
  } catch (error) {
    logger.error('Get appointment error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// Get available slots for a doctor on a specific date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId and date are required' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get booked slots
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    }).lean();

    const bookedSlots = bookedAppointments.map(a => a.timeSlot.startTime);

    // Generate all possible slots (30-minute intervals from 9:00 to 17:00)
    const allSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const endHour = min === 30 ? hour + 1 : hour;
        const endMin = min === 30 ? 0 : 30;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
        allSlots.push({ startTime, endTime, isAvailable: !bookedSlots.includes(startTime) });
      }
    }

    res.json({ slots: allSlots, date, doctorId });
  } catch (error) {
    logger.error('Get available slots error:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
};
