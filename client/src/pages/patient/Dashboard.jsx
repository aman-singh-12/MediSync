import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getPatientDashboard } from '../../services/patient.service';
import Button from '../../components/Button';
import styles from './Dashboard.module.css';
import { 
  FiCalendar, 
  FiFileText, 
  FiCreditCard, 
  FiClock, 
  FiPlusCircle,
  FiDownload
} from 'react-icons/fi';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dashboardData = await getPatientDashboard();
        setData(dashboardData);
      } catch (err) {
        setError('Failed to load clinical dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className={styles.loader}>Analyzing medical records...</div>;

  const statCards = [
    { title: 'Total Visits', value: data?.appointmentStats?.total || 0, icon: <FiCalendar />, type: 'default' },
    { title: 'Upcoming', value: data?.appointmentStats?.upcoming || 0, icon: <FiClock />, type: 'default' },
    { title: 'Records', value: data?.recordsCount || 0, icon: <FiFileText />, type: 'default' },
    { title: 'Health Spent', value: `₹${data?.totalSpent || 0}`, icon: <FiCreditCard />, type: 'gold' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Medical Dashboard</h1>
          <p className={styles.headerSubtitle}>Overview of your recent clinical activities and health records.</p>
        </div>
        <Button onClick={() => navigate('/find-doctors')} className={styles.newAppointmentBtn}>
          <FiPlusCircle /> New Appointment
        </Button>
      </header>

      {error && <div className={styles.errorAlert}>{error}</div>}

      <div className={styles.statsGrid}>
        {statCards.map((stat, idx) => (
          <div key={idx} className={`${styles.statCard} ${stat.type === 'gold' ? styles.statCardGold : ''}`}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.title}</div>
          </div>
        ))}
      </div>

      <div className={styles.dashboardContent}>
        {/* Today's Schedule */}
        {data?.todayAppointments?.length > 0 && (
          <div className={styles.todayCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Today's Schedule</h2>
              <span className={styles.todayBadge}>Active</span>
            </div>
            <div className={styles.timeline}>
              {data.todayAppointments.map((app) => (
                <div key={app._id} className={styles.timelineItem}>
                  <div className={styles.timeLabel}>{app.time}</div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineMain}>
                      <div className={styles.docInfo}>
                        <span className={styles.docName}>{app.doctor?.user?.name || 'Doctor'}</span>
                        <span className={styles.docSpec}>{app.doctor?.specialization || 'General Consultation'}</span>
                      </div>
                      <span className={`${styles.statusPill} ${styles[app.status]}`}>{app.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Appointments */}
        <div className={styles.upcomingCard}>
          <div className={styles.upcomingHeader}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Recent Appointments</h2>
            <Link to="/appointment-history" style={{ fontSize: '0.9rem', color: 'var(--brand-primary)', fontWeight: 800 }}>View All</Link>
          </div>
          <div className={styles.upcomingList}>
            {data?.recentAppointments?.length > 0 ? (
              data.recentAppointments.map((app) => (
                <div key={app._id} className={styles.upcomingItem}>
                  <div style={{ 
                    width: '48px', height: '48px', 
                    background: 'var(--brand-light)', 
                    color: 'var(--brand-primary)', 
                    borderRadius: '12px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 900, fontSize: '1.1rem' 
                  }}>
                    {app.doctor?.user?.name?.charAt(0) || 'D'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{app.doctor?.user?.name || 'Practitioner'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{app.date} • {app.time}</div>
                  </div>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: 900, 
                    padding: '4px 10px', 
                    borderRadius: 'var(--radius-full)', 
                    background: app.status === 'confirmed' ? '#ecfdf5' : '#f1f5f9',
                    color: app.status === 'confirmed' ? '#059669' : '#64748b',
                    textTransform: 'uppercase'
                  }}>{app.status}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent appointments.</div>
            )}
          </div>
        </div>

        {/* Medical Records */}
        <div className={styles.upcomingCard}>
          <div className={styles.upcomingHeader}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Medical Records</h2>
            <Link to="/medical-records" style={{ fontSize: '0.9rem', color: 'var(--brand-primary)', fontWeight: 800 }}>Manage</Link>
          </div>
          <div className={styles.upcomingList}>
            {data?.recentRecords?.length > 0 ? (
              data.recentRecords.map((record) => (
                <div key={record._id} className={styles.upcomingItem}>
                  <div style={{ width: '48px', height: '48px', background: '#f8fafc', color: 'var(--text-muted)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiFileText size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{record.title || 'Clinical Record'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(record.createdAt).toLocaleDateString()}</div>
                  </div>
                  <FiDownload 
                    style={{ cursor: 'pointer', color: 'var(--brand-primary)', fontSize: '1.2rem' }} 
                    onClick={() => {
                      const url = record.fileUrl || record.attachments?.[0];
                      if (!url) return;
                      const finalUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
                      window.open(finalUrl, '_blank');
                    }}
                  />
                </div>
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No records yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
