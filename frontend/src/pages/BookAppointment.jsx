import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorAPI, appointmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiClock, FiArrowLeft, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './BookAppointment.css';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [type, setType] = useState('consultation');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchDoctor();
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate && doctorId) fetchSlots();
  }, [selectedDate, doctorId]);

  const fetchDoctor = async () => {
    try {
      const { data } = await doctorAPI.getById(doctorId);
      setDoctor(data.doctor);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load doctor information');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const { data } = await appointmentAPI.getAvailableSlots({ doctorId, date: selectedDate });
      setSlots(data.slots || []);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setSlots([]);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot) return toast.error('Please select a time slot');
    setBooking(true);
    try {
      await appointmentAPI.book({
        doctorId,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        doctorSpecialization: doctor.specialization,
        patientName: `${user.firstName} ${user.lastName}`,
        date: selectedDate,
        timeSlot: selectedSlot,
        type,
        reason,
        consultationFee: doctor.consultationFee
      });
      toast.success('Appointment booked successfully! 🎉');
      navigate('/appointments');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;
  if (!doctor) return <div className="empty-state"><h3>Doctor not found</h3></div>;

  const availableSlots = slots.filter(s => s.isAvailable);

  return (
    <div className="booking-page">
      <div className="container">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{marginBottom: '1.5rem'}}>
          <FiArrowLeft /> Back
        </button>

        <div className="booking-grid animate-fade-in">
          <div className="booking-main">
            <h1 className="section-title">Book Appointment</h1>
            <p className="section-subtitle">with Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}</p>

            {/* Date Selection */}
            <div className="booking-section card">
              <h2><FiCalendar /> Select Date</h2>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Time Slots */}
            <div className="booking-section card">
              <h2><FiClock /> Available Slots</h2>
              {availableSlots.length === 0 ? (
                <p className="no-slots">No available slots for this date. Try another date.</p>
              ) : (
                <div className="slots-grid">
                  {availableSlots.map((slot, i) => (
                    <button
                      key={i}
                      className={`slot-btn ${selectedSlot?.startTime === slot.startTime ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.startTime} - {slot.endTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Appointment Details */}
            <div className="booking-section card">
              <h2>Appointment Details</h2>
              <div className="form-group">
                <label>Type</label>
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="check-up">Check-up</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reason for Visit</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe your symptoms or reason for visit..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="booking-sidebar">
            <div className="summary-card glass">
              <h3>Booking Summary</h3>
              <div className="summary-item">
                <span className="summary-label">Doctor</span>
                <span>Dr. {doctor.firstName} {doctor.lastName}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Specialization</span>
                <span>{doctor.specialization}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Date</span>
                <span>{selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Time</span>
                <span>{selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : 'Not selected'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Type</span>
                <span style={{textTransform: 'capitalize'}}>{type}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-item summary-total">
                <span>Consultation Fee</span>
                <span className="summary-fee">₹{doctor.consultationFee}</span>
              </div>
              <button
                className="btn btn-accent btn-lg"
                style={{width: '100%', marginTop: '1rem'}}
                onClick={handleBooking}
                disabled={!selectedSlot || booking}
              >
                {booking ? <span className="spinner" style={{width: 20, height: 20}}></span> : <><FiCheck /> Confirm Booking</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
