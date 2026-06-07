import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/ToastContext';
import styles from './Notifications.module.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addToast } = useToast();

  const loadNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/notifications?page=${page}&limit=10`);
      setNotifications(res.data.notifications);
      setTotalPages(res.data.pages);
      setCurrentPage(res.data.page);
    } catch (err) {
      addToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      addToast('Failed to update notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      addToast('All notifications marked as read', 'success');
    } catch (err) {
      addToast('Failed to update notifications', 'error');
    }
  };

  const handlePageChange = (page) => {
    loadNotifications(page);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clinical Notifications</h1>
          <p className={styles.subtitle}>Stay updated with your latest appointment requests and system alerts.</p>
        </div>
        <button onClick={handleMarkAllRead} className={styles.markAllBtn}>Mark All as Read</button>
      </div>

      <div className={styles.listCard}>
        {loading ? (
          <div className={styles.loader}>Fetching latest updates...</div>
        ) : (
          <>
            <div className={styles.list}>
              {notifications.map(n => (
                <div key={n._id} className={`${styles.item} ${n.isRead ? '' : styles.unread}`}>
                  <div className={styles.dot}></div>
                  <div className={styles.content}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemTitle}>{n.title}</span>
                      <span className={styles.itemDate}>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className={styles.itemMessage}>{n.message}</p>
                    {!n.isRead && (
                      <button onClick={() => handleMarkAsRead(n._id)} className={styles.readBtn}>Mark as Read</button>
                    )}
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <div className={styles.empty}>No notifications found.</div>}
            </div>

            <div className={styles.footer}>
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
