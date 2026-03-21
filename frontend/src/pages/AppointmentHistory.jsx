import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI, doctorAPI } from '../services/api';
import { FiCalendar, FiClock, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './AppointmentHistory.css';

const AppointmentHistory = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      if (user.role === 'doctor') {
        const { data: docData } = await doctorAPI.getByUserId(user.id);
        setDoctorProfile(docData.doctor);
        if (docData.doctor) {
          const params = { limit: 50 };
          if (statusFilter) params.status = statusFilter;
          const { data } = await appointmentAPI.getDoctorAppointments(docData.doctor._id, params);
          setAppointments(data.appointments || []);
        }
      } else {
        const params = { limit: 50 };
        if (statusFilter) params.status = statusFilter;
        const { data } = await appointmentAPI.getPatientAppointments(params);
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (apptId, version) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentAPI.updateStatus(apptId, { status: 'cancelled', version, cancellationReason: 'Cancelled by user' });
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel');
    }
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-warning', confirmed: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger', 'in-progress': 'badge-primary', 'no-show': 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
  };

  return (
    <div className="history-page">
      <div className="container">
        <div className="history-header animate-fade-in">
          <h1 className="section-title">Appointment History</h1>
          <div className="filter-bar">
            <FiFilter />
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{width: 'auto', minWidth: 180}}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="page-loading"><div className="spinner"></div></div>
        ) : appointments.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">📋</div>
            <h3>No appointments found</h3>
            <p>Your appointment history will appear here</p>
          </div>
        ) : (
          <div className="history-list animate-fade-in">
            {appointments.map((appt) => (
              <div key={appt._id} className="history-item card">
                <div className="history-item-header">
                  <div className="history-avatar">
                    {user.role === 'doctor'
                      ? appt.patientName?.split(' ').map(n => n[0]).join('').slice(0, 2)
                      : appt.doctorName?.split(' ').map(n => n[0]).join('').slice(0, 2)
                    }
                  </div>
                  <div className="history-info">
                    <h3>{user.role === 'doctor' ? appt.patientName : `Dr. ${appt.doctorName}`}</h3>
                    <p className="history-type" style={{textTransform: 'capitalize'}}>
                      {appt.type} {appt.doctorSpecialization ? `• ${appt.doctorSpecialization}` : ''}
                    </p>
                  </div>
                  {getStatusBadge(appt.status)}
                </div>
                <div className="history-details">
                  <div className="history-detail">
                    <FiCalendar /> {new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="history-detail">
                    <FiClock /> {appt.timeSlot?.startTime} - {appt.timeSlot?.endTime}
                  </div>
                  {appt.reason && <div className="history-detail"><strong>Reason:</strong> {appt.reason}</div>}
                  {appt.diagnosis && <div className="history-detail"><strong>Diagnosis:</strong> {appt.diagnosis}</div>}
                  {appt.prescription && <div className="history-detail"><strong>Prescription:</strong> {appt.prescription}</div>}
                  {appt.notes && <div className="history-detail"><strong>Notes:</strong> {appt.notes}</div>}
                </div>
                <div className="history-item-footer">
                  <span className="history-fee">₹{appt.consultationFee || 0}</span>
                  {['pending', 'confirmed'].includes(appt.status) && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(appt._id, appt.version)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentHistory;
