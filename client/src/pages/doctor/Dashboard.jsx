import React, { useState, useEffect } from 'react';
import { getMyDoctorStats, getMyDoctorProfile } from '../../services/doctor.service';
import { getDoctorAppointments } from '../../services/appointment.service';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../components/ToastContext';
import Pagination from '../../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUrl';
import styles from './Dashboard.module.css';

const StatCard = ({ title, value, badgeText, badgeClass, icon, onClick }) => (
  <div className={`${styles.statCard} ${onClick ? styles.clickable : ''}`} onClick={onClick}>
    <div className={styles.statHeader}>
      <div className={styles.statIconWrap}>
        {icon}
      </div>
      <div className={`${styles.statBadge} ${styles[badgeClass]}`}>
        {badgeText}
      </div>
    </div>
    <div className={styles.statTitle}>{title}</div>
    <div className={styles.statValue}>{value}</div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ todaysAppointments: 0, totalPatients: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, statsData, apptData] = await Promise.all([
          getMyDoctorProfile(),
          getMyDoctorStats(),
          getDoctorAppointments()
        ]);
        setProfile(profileData);
        setStats(statsData);
        setAppointments(apptData.appointments || apptData || []);
      } catch (err) {
        console.error('Failed to load doctor dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Analyzing clinical schedule...</div>;

  if (profile && !profile.isApproved) {
    return (
      <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: '#fff7ed', color: '#ea580c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--bg-dark)', marginBottom: '12px' }}>Verification Pending</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '1.1rem', lineHeight: '1.6' }}>
          Your profile is currently being reviewed by our administration team. You will gain full access to the clinical dashboard once your credentials are verified.
        </p>
        <div style={{ marginTop: '32px', padding: '12px 24px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Typical verification time: 24-48 hours
        </div>
      </div>
    );
  }

  return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Clinical Overview</h1>
          <div className={styles.headerSubtitle}>
            Welcome back, Dr. {user?.name}. You have {stats.todaysAppointments || 0} scheduled sessions today.
          </div>
        </div>

        <div className={styles.statsGrid}>
          <StatCard 
            title="Today's Sessions" 
            value={stats.todaysAppointments || '0'} 
            badgeText="LIVE" 
            badgeClass="badgeNew"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>}
            onClick={() => navigate('/doctor/appointments')}
          />
          <StatCard 
            title="Total Patients" 
            value={stats.totalPatients || '0'} 
            badgeText="PORTFOLIO" 
            badgeClass="badgeTotal"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
            onClick={() => navigate('/doctor/patients')}
          />
          <StatCard 
            title="Total Earnings" 
            value={`₹${stats.totalEarnings || '0'}`} 
            badgeText="GROSS" 
            badgeClass="badgeMonthly"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
            onClick={() => navigate('/payments')}
          />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>Today's Schedule</div>
              <a href="/doctor/appointments" className={styles.chartLink}>View Full Queue</a>
            </div>
            <div className={styles.scheduleList}>
              {(() => {
                const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
                const todaysApps = appointments.filter(a => a.date === todayStr && a.status !== 'cancelled');
                return todaysApps.length > 0 ? todaysApps.slice(0, 10).map((item, idx) => (
                <div key={idx} className={styles.scheduleCard}>
                  <div className={styles.scheduleCardTop}>
                    <div className={styles.scheduleCardTime}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {item.time}
                    </div>
                    <div className={`${styles.statusPill} ${styles['status' + item.status.charAt(0).toUpperCase() + item.status.slice(1)]}`}>
                      {item.status}
                    </div>
                  </div>
                  
                  <div className={styles.scheduleCardUser}>
                    <div className={styles.scheduleCardAvatar}>
                      {item.patient?.user?.profilePicture ? (
                        <img src={getImageUrl(item.patient.user.profilePicture)} alt="" />
                      ) : (
                        (item.patient?.user?.name || 'P').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className={styles.scheduleCardInfo}>
                      <div className={styles.scheduleCardName}>{item.patient?.user?.name || 'Unknown Patient'}</div>
                      <div className={styles.scheduleCardReason}>{item.reason || 'General Checkup'}</div>
                    </div>
                  </div>

                  <div className={styles.scheduleCardActions}>
                    <button 
                      className={styles.scheduleActionBtn}
                      onClick={() => navigate('/doctor/appointments')}
                    >
                      Manage
                    </button>
                    {item.status === 'booked' && (
                      <button 
                        className={styles.scheduleActionBtnPrimary}
                        onClick={() => navigate('/doctor/appointments')}
                      >
                        Launch
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No sessions scheduled for today.</div>
              )
              })()}
            </div>
          </div>
        </div>

        <div className={styles.recentPatientsCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Patient Portfolio</div>
          </div>
          
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Last Interaction</th>
                <th>Clinical Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? (
                // Unique patients from appointments
                (() => {
                  const uniquePatients = Array.from(new Set(appointments.filter(a => a.patient).map(a => a.patient._id)))
                    .map(id => appointments.find(a => a.patient && a.patient._id === id));
                  
                  const paginatedPatients = uniquePatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                  
                  return paginatedPatients.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <div className={styles.patientCell}>
                          <div className={styles.patientAvatar} style={{ background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            {a.patient?.user?.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <div className={styles.patientName}>{a.patient?.user?.name}</div>
                            <div className={styles.patientId}>{a.patient?.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{color: 'var(--text-muted)'}}>{a.date}</td>
                      <td>
                        <div className={styles.statusIndicator}>
                          <div className={`${styles.statusDot} ${styles.dotStable}`}></div>
                          ACTIVE
                        </div>
                      </td>
                    </tr>
                  ));
                })()
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No patient records available in current portfolio.</td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination 
            currentPage={currentPage} 
            totalPages={Math.ceil(Array.from(new Set(appointments.filter(a => a.patient).map(a => a.patient._id))).length / itemsPerPage)} 
            onPageChange={setCurrentPage} 
          />
        </div>
      </div>
    );
};

export default Dashboard;
