// Toast Notification Context: global popup alert manager with auto-dismiss timer.
import React, { createContext, useContext, useState, useCallback } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // 1. Add toast notification with duration timer (default 3000ms)
  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  // 2. Remove toast by ID
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Alert Container Floating Elements */}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`${styles.toast} ${styles[toast.type]}`}
            onClick={() => removeToast(toast.id)}
          >
            <div className={styles.message}>{toast.message}</div>
            <button className={styles.closeBtn}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

