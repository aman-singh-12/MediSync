import React, { useEffect, useState } from 'react';
import { getDoctorAppointments, rescheduleAppointment } from '../../services/appointment.service';
import { useToast } from '../../components/ToastContext';
import Pagination from '../../components/Pagination';
import api from '../../services/api';
import styles from './DoctorAppointments.module.css';
import { getImageUrl } from '../../utils/imageUrl';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('upcoming'); // 'upcoming' or 'past'
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rescheduleModal, setRescheduleModal] = useState({ isOpen: false, appointmentId: null, date: '', time: '' });
  const [prescriptionModal, setPrescriptionModal] = useState({ isOpen: false, appointmentId: null, patientId: null, medications: [{ name: '', dosage: '', duration: '' }], advice: '' });
  const [recordsModal, setRecordsModal] = useState({ isOpen: false, patientId: null, patientName: '', records: [] });
  const { addToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const response = await getDoctorAppointments({ view, search, page: currentPage });
      setAppointments(response.appointments || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error(err);
      addToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [view, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    load();
  };

  const openRecords = async (patient) => {
    try {
      const response = await api.get(`/api/doctors/patients/${patient._id}/records`);
      setRecordsModal({ 
        isOpen: true, 
        patientId: patient._id, 
        patientName: patient.user?.name || 'Patient',
        records: response.data 
      });
    } catch (err) {
      addToast('Failed to load patient records', 'error');
    }
  };

  const openReschedule = (a) => {
    setRescheduleModal({ isOpen: true, appointmentId: a._id, date: a.date, time: a.time });
  };

  const handleRescheduleSubmit = async () => {
    try {
      await rescheduleAppointment(rescheduleModal.appointmentId, { 
        date: rescheduleModal.date, 
        time: rescheduleModal.time 
      });
      addToast('Appointment rescheduled successfully', 'success');
      await load();
      setRescheduleModal({ isOpen: false, appointmentId: null, date: '', time: '' });
    } catch (err) {
      console.error(err);
      addToast('Unable to reschedule', 'error');
    }
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      const { updateAppointmentStatus } = await import('../../services/appointment.service');
      await updateAppointmentStatus(appointmentId, status);
      addToast(`Appointment ${status} successfully`, 'success');
      await load();
    } catch (err) {
      addToast(`Failed to ${status} appointment`, 'error');
    }
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/prescriptions', {
        appointmentId: prescriptionModal.appointmentId,
        medications: prescriptionModal.medications,
        advice: prescriptionModal.advice
      });
      addToast('Prescription created and appointment completed', 'success');
      setPrescriptionModal({ isOpen: false, appointmentId: null, patientId: null, medications: [{ name: '', dosage: '', duration: '' }], advice: '' });
      await load();
    } catch (err) {
      addToast('Failed to create prescription', 'error');
    }
  };

  if (loading) return <div>Loading appointments...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerSubtitle}>APPOINTMENT MANAGEMENT</div>
        <div className={styles.headerRow}>
          <h1 className={styles.headerTitle}>Clinical Schedule</h1>
          <form className={styles.searchBox} onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Search by patient name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </form>
        </div>
      </div>

      <div className={styles.tabBar}>
        <button 
          className={`${styles.tabItem} ${view === 'upcoming' ? styles.tabActive : ''}`}
          onClick={() => { setView('upcoming'); setCurrentPage(1); }}
        >
          Upcoming & Today
        </button>
        <button 
          className={`${styles.tabItem} ${view === 'past' ? styles.tabActive : ''}`}
          onClick={() => { setView('past'); setCurrentPage(1); }}
        >
          Past History
        </button>
      </div>

      <div className={styles.mainGrid} style={{ display: 'block' }}>
        <div className={styles.calendarCard}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
              {view === 'upcoming' ? 'Active Appointments' : 'Appointment History'} ({total})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {appointments.map((a) => (
                <div key={a._id} className={styles.appointmentItem}>
                  <div className={styles.patientInfo}>
                    <img 
                      src={a.patient?.user?.profilePicture ? getImageUrl(a.patient.user.profilePicture) : `https://ui-avatars.com/api/?name=${(a.patient?.user?.name || 'P').replace(' ', '+')}&background=random`} 
                      alt={a.patient?.user?.name} 
                      className={styles.patientAvatar} 
                    />
                    <div>
                      <div className={styles.patientNameText}>{a.patient?.user?.name || 'Unknown Patient'}</div>
                      <div className={styles.appointmentMeta}>Date: {a.date} | Time: {a.time}</div>
                      {a.status === 'reschedule_requested' && (
                        <div style={{ marginTop: '8px', padding: '8px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #fdba74', fontSize: '0.85rem' }}>
                          <strong>Requested New Time:</strong><br/>
                          Date: {a.requestedDate} | Time: {a.requestedTime}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.actionsWrap}>
                    <span className={`${styles.statusBadge} ${a.status === 'booked' ? styles.statusBooked : a.status === 'reschedule_requested' ? styles.statusOther : styles.statusOther}`}>
                      {a.status === 'reschedule_requested' ? 'Reschedule Requested' : a.status}
                    </span>
                    
                    <div className={styles.buttonGroup}>
                      <button 
                        onClick={() => openRecords(a.patient)}
                        className={styles.secondaryBtn}
                      >
                        Records
                      </button>
                      
                      {a.status === 'reschedule_requested' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(a._id, 'rescheduled')} 
                            className={styles.successBtn}
                          >
                            Approve Reschedule
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(a._id, 'booked')} 
                            className={styles.dangerBtn}
                          >
                            Reject Reschedule
                          </button>
                        </>
                      )}

                      {a.status === 'booked' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(a._id, 'confirmed')} 
                            className={styles.successBtn}
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(a._id, 'cancelled')} 
                            className={styles.dangerBtn}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      <button onClick={() => openReschedule(a)} className={styles.outlineBtn}>
                        Reschedule
                      </button>
                      
                      {a.status === 'confirmed' && (
                        <button 
                          onClick={() => setPrescriptionModal({ isOpen: true, appointmentId: a._id, patientId: a.patient?._id, medications: [{ name: '', dosage: '', duration: '' }], advice: '' })}
                          className={styles.primaryBtn}
                        >
                          Prescribe
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && <div style={{ color: 'var(--text-secondary)', padding: '24px 0' }}>No appointments found.</div>}
            </div>
            
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(total / 10)} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </div>
      </div>

      {rescheduleModal.isOpen && (
        <div className={styles.rescheduleModal}>
          <div className={styles.modalContent}>
            <div className={styles.modalTitle}>Reschedule Appointment</div>
            <label className={styles.settingLabel}>NEW DATE</label>
            <input 
              type="date" 
              className={styles.modalInput} 
              value={rescheduleModal.date} 
              onChange={e => setRescheduleModal({...rescheduleModal, date: e.target.value})} 
            />
            <label className={styles.settingLabel}>NEW TIME</label>
            <input 
              type="time" 
              className={styles.modalInput} 
              value={rescheduleModal.time} 
              onChange={e => setRescheduleModal({...rescheduleModal, time: e.target.value})} 
            />
            <div className={styles.modalActions}>
              <button className={`${styles.modalBtn} ${styles.modalBtnCancel}`} onClick={() => setRescheduleModal({isOpen: false, appointmentId: null, date: '', time: ''})}>Cancel</button>
              <button className={`${styles.modalBtn} ${styles.modalBtnConfirm}`} onClick={handleRescheduleSubmit}>Confirm Reschedule</button>
            </div>
          </div>
        </div>
      )}

      {prescriptionModal.isOpen && (
        <div className={styles.rescheduleModal}>
          <div className={styles.modalContent} style={{ width: '600px' }}>
            <div className={styles.modalTitle}>Clinical Prescription</div>
            <form onSubmit={handlePrescriptionSubmit}>
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                {prescriptionModal.medications.map((m, idx) => (
                  <div key={idx} style={{ padding: '16px', background: '#f8faf9', borderRadius: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <input 
                        placeholder="Medicine Name" 
                        value={m.name} 
                        onChange={e => {
                          const newMeds = [...prescriptionModal.medications];
                          newMeds[idx].name = e.target.value;
                          setPrescriptionModal({...prescriptionModal, medications: newMeds});
                        }}
                        className={styles.modalInput}
                        required
                      />
                      <input 
                        placeholder="Dosage (e.g. 1-0-1)" 
                        value={m.dosage} 
                        onChange={e => {
                          const newMeds = [...prescriptionModal.medications];
                          newMeds[idx].dosage = e.target.value;
                          setPrescriptionModal({...prescriptionModal, medications: newMeds});
                        }}
                        className={styles.modalInput}
                        required
                      />
                      <input 
                        placeholder="Duration (e.g. 5 days)" 
                        value={m.duration} 
                        onChange={e => {
                          const newMeds = [...prescriptionModal.medications];
                          newMeds[idx].duration = e.target.value;
                          setPrescriptionModal({...prescriptionModal, medications: newMeds});
                        }}
                        className={styles.modalInput}
                        required
                      />
                    </div>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => setPrescriptionModal({...prescriptionModal, medications: [...prescriptionModal.medications, { name: '', dosage: '', duration: '' }]})}
                  style={{ background: 'none', border: '1px dashed var(--brand-primary)', color: 'var(--brand-primary)', width: '100%', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}
                >
                  + Add Another Medicine
                </button>
              </div>
              
              <label className={styles.settingLabel}>CLINICAL ADVICE</label>
              <textarea 
                className={styles.modalInput} 
                style={{ height: '80px', paddingTop: '12px' }}
                value={prescriptionModal.advice}
                onChange={e => setPrescriptionModal({...prescriptionModal, advice: e.target.value})}
                placeholder="Dietary advice, follow-up instructions, etc."
              />

              <div className={styles.modalActions}>
                <button type="button" className={`${styles.modalBtn} ${styles.modalBtnCancel}`} onClick={() => setPrescriptionModal({isOpen: false, appointmentId: null, patientId: null, medications: [{ name: '', dosage: '', duration: '' }], advice: ''})}>Discard</button>
                <button type="submit" className={`${styles.modalBtn} ${styles.modalBtnConfirm}`}>Complete & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recordsModal.isOpen && (
        <div className={styles.rescheduleModal}>
          <div className={styles.modalContent} style={{ width: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div className={styles.modalTitle}>Medical History: {recordsModal.patientName}</div>
              <button onClick={() => setRecordsModal({ isOpen: false, patientId: null, patientName: '', records: [] })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {recordsModal.records.length > 0 ? recordsModal.records.map((r) => (
                <div key={r._id} style={{ padding: '20px', border: '1px solid #f1f5f9', borderRadius: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{r.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Recorded on {new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {r.diagnosis && <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}><strong>Diagnosis:</strong> {r.diagnosis}</div>}
                  {r.notes && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{r.notes}</div>}
                  
                  {r.attachments?.length > 0 && (
                    <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                      {r.attachments.map((file, i) => (
                        <a 
                          key={i} 
                          href={getImageUrl(file)} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ background: '#f8fafc', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                          Clinical Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No historical medical records available for this patient.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
