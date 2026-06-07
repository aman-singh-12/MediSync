import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useToast } from "./ToastContext";
import { getDoctorAppointments, getMyAppointments } from "../services/appointment.service";
import api from "../services/api";
import styles from "./DashboardLayout.module.css";
import { getImageUrl } from "../utils/imageUrl";
import { 
  FiHome, 
  FiCalendar, 
  FiFileText, 
  FiCreditCard, 
  FiHeart, 
  FiSearch, 
  FiSettings, 
  FiLogOut,
  FiBell,
  FiHelpCircle,
  FiUsers,
  FiStar,
  FiClock,
  FiUser,
  FiMenu,
  FiX
} from 'react-icons/fi';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { addToast } = useToast();
  
  const currentPath = location.pathname;
  const role = user?.role || "patient";

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/api/notifications/my?limit=5');
        const notifs = res.data?.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.isRead).length);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    if (user && role !== 'admin') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [role, user]);

  const patientNav = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/find-doctors', label: 'Find Doctors', icon: <FiSearch /> },
    { path: '/appointment-history', label: 'Appointments', icon: <FiCalendar /> },
    { path: '/medical-records', label: 'Medical Records', icon: <FiFileText /> },
    { path: '/favorites', label: 'Favorites', icon: <FiHeart /> },
    { path: '/payments', label: 'Payments', icon: <FiCreditCard /> },
    { path: '/settings', label: 'Settings', icon: <FiSettings /> },
  ];

  const adminNav = [
    { path: '/dashboard', label: 'Admin Dashboard', icon: <FiHome /> },
    { path: '/admin/users', label: 'Manage Users', icon: <FiUsers /> },
    { path: '/admin/doctors', label: 'Verify Doctors', icon: <FiFileText /> },
    { path: '/payments', label: 'Transactions', icon: <FiCreditCard /> },
    { path: '/settings', label: 'System Settings', icon: <FiSettings /> },
  ];

  const doctorNav = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/doctor/appointments', label: 'Appointments', icon: <FiCalendar /> },
    { path: '/doctor/patients', label: 'My Patients', icon: <FiUsers /> },
    { path: '/doctor/availability', label: 'Availability', icon: <FiClock /> },
    { path: '/doctor/reviews', label: 'Patient Reviews', icon: <FiStar /> },
    { path: '/payments', label: 'Financials', icon: <FiCreditCard /> },
    { path: '/doctor/my-profile', label: 'My Profile', icon: <FiUser /> },
  ];

  const getNavItems = () => {
    switch (role) {
      case 'admin': return adminNav;
      case 'doctor': return doctorNav;
      case 'patient':
      default: return patientNav;
    }
  };

  const navItems = getNavItems();
  const displayName = user?.fullName || user?.name || "User";

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowSupport(false);
  };

  const handleSupportClick = () => {
    setShowSupport(!showSupport);
    setShowNotifications(false);
  };

  return (
    <div className={`${styles.layout} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
      {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />}
      
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarActive : ""}`}>
        <Link to="/dashboard" className={styles.brand}>
          <div className={styles.brandIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <div className={styles.brandInfo}>
            <div className={styles.brandName}>MediSync</div>
            <div className={styles.brandTag}>
              {role === "admin" ? "Admin Panel" : role === "doctor" ? "Doctor Portal" : "Patient Portal"}
            </div>
          </div>
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`${styles.navItem} ${currentPath.startsWith(item.path) ? styles.navItemActive : ""}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.logoutSection}>
          <button onClick={logout} className={styles.logoutBtn}>
            <FiLogOut />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topBar}>
          <button className={styles.menuToggle} onClick={() => setIsSidebarOpen(true)}>
            <FiMenu />
          </button>
          <div style={{ flex: 1 }}></div>
          
          <div className={styles.topBarActions}>
            <div className={styles.dropdownContainer}>
              <button className={styles.actionIconBtn} title="Notifications" onClick={handleNotificationClick}>
                <FiBell />
                {unreadCount > 0 && <div className={styles.notificationBadge}>{unreadCount}</div>}
              </button>
              {showNotifications && (
                <div className={styles.dropdownBox}>
                  <div className={styles.dropdownTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Clinical Alerts
                    {unreadCount > 0 && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await api.put('/api/notifications/mark-all-read');
                            setUnreadCount(0);
                            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            addToast('All notifications marked as read', 'success');
                          } catch (err) {
                            addToast("Failed to update notifications", "error");
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className={styles.dropdownContent} style={{ maxHeight: '300px', overflowY: 'auto', padding: '0' }}>
                    {notifications.length > 0 ? notifications.map(n => (
                      <div 
                        key={n._id} 
                        className={styles.notificationItem}
                        style={{ background: n.isRead ? 'transparent' : '#f0fdf4', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', cursor: 'pointer' }}
                        onClick={async () => {
                          try {
                            await api.put(`/api/notifications/${n._id}/read`);
                            const notifPath = role === 'doctor' ? '/doctor/notifications' : '/notifications';
                            navigate(notifPath);
                            setShowNotifications(false);
                          } catch (err) {
                            addToast("Failed to update notification", "error");
                          }
                        }}
                      >
                        <div className={styles.notifTitle} style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          {n.title}
                        </div>
                        <div className={styles.notifDesc} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{n.message}</div>
                        <div className={styles.notifStatus} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    )) : (
                      <div style={{ padding: '20px', textAlign: 'center' }}>No recent notifications.</div>
                    )}
                    <button 
                      onClick={() => { 
                        const notifPath = role === 'doctor' ? '/doctor/notifications' : '/notifications';
                        navigate(notifPath); 
                        setShowNotifications(false); 
                      }} 
                      style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontWeight: 700, padding: '12px', cursor: 'pointer', fontSize: '0.8rem', width: '100%', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.dropdownContainer}>
              <button className={styles.actionIconBtn} title="Support" onClick={handleSupportClick}>
                <FiHelpCircle />
              </button>
              {showSupport && (
                <div className={styles.dropdownBox}>
                  <div className={styles.dropdownTitle}>Help & Support Center</div>
                  <div className={styles.supportContent}>
                    <div className={styles.supportSection}>
                      <div className={styles.sectionLabel}>Quick Assistance</div>
                      <div className={styles.supportLink} onClick={() => { navigate('/settings'); setShowSupport(false); }}>
                        <FiSettings /> Account Settings
                      </div>
                    </div>
                    
                    <div className={styles.supportSection}>
                      <div className={styles.sectionLabel}>Contact Support</div>
                      <div className={styles.contactCard}>
                        <div className={styles.contactIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                          <FiBell />
                        </div>
                        <div className={styles.contactInfo}>
                          <div className={styles.contactTitle}>Email Support</div>
                          <div className={styles.contactValue}>medisyncg6@gmail.com</div>
                        </div>
                      </div>
                      <div className={styles.contactCard}>
                        <div className={styles.contactIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                          <FiUsers />
                        </div>
                        <div className={styles.contactInfo}>
                          <div className={styles.contactTitle}>Available Hours</div>
                          <div className={styles.contactValue}>24/7 Clinical Support</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.userProfile} onClick={() => navigate('/settings')}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userRole} style={{ marginLeft: '4px', opacity: 0.8 }}>• {role}</span>
              </div>
              <div className={styles.userAvatar}>
                {user?.profilePicture ? (
                  <img src={getImageUrl(user.profilePicture)} alt="Avatar" />
                ) : (
                  <img src={`https://ui-avatars.com/api/?name=${(user?.name || "User").replace(' ', '+')}&background=random`} alt="Avatar" />
                )}
              </div>
            </div>
          </div>
        </header>

        <div className={styles.contentWrapper}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
