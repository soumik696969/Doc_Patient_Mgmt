const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Get available slots
router.get('/slots', appointmentController.getAvailableSlots);

// Book appointment
router.post('/', appointmentController.bookAppointment);

// Get patient's appointments
router.get('/patient', appointmentController.getPatientAppointments);

// Get doctor's appointments
router.get('/doctor/:doctorId', appointmentController.getDoctorAppointments);

// Get appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// Update appointment status
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

module.exports = router;
