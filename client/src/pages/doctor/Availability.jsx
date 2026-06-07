import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../components/ToastContext';
import styles from './Availability.module.css';

const Availability = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ day: 'Monday', startTime: '09:00', endTime: '10:00' });
  const { addToast } = useToast();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const loadSlots = async () => {
    try {
      const res = await api.get('/api/doctors/profile/me');
      setSlots(res.data.availableSlots || []);
    } catch (err) {
      addToast('Failed to load slots', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/doctors/availability/slots', newSlot);
      setSlots(res.data);
      addToast('Slot added successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add slot', 'error');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const res = await api.delete(`/api/doctors/availability/slots/${slotId}`);
      setSlots(res.data);
      addToast('Slot removed', 'success');
    } catch (err) {
      addToast('Failed to remove slot', 'error');
    }
  };

  if (loading) return <div className={styles.loader}>Loading availability...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manage Availability</h1>
        <p className={styles.subtitle}>Define your weekly working hours and time slots.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.formCard}>
          <h2 className={styles.cardTitle}>Add New Slot</h2>
          <form onSubmit={handleAddSlot} className={styles.form}>
            <div className={styles.field}>
              <label>Day of Week</label>
              <select 
                value={newSlot.day} 
                onChange={e => setNewSlot({...newSlot, day: e.target.value})}
                className={styles.select}
              >
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Start Time</label>
                <input 
                  type="time" 
                  value={newSlot.startTime} 
                  onChange={e => setNewSlot({...newSlot, startTime: e.target.value})}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label>End Time</label>
                <input 
                  type="time" 
                  value={newSlot.endTime} 
                  onChange={e => setNewSlot({...newSlot, endTime: e.target.value})}
                  className={styles.input}
                />
              </div>
            </div>
            <button type="submit" className={styles.submitBtn}>Add Availability Slot</button>
          </form>
        </div>

        <div className={styles.slotsCard}>
          <h2 className={styles.cardTitle}>Current Schedule</h2>
          <div className={styles.slotsList}>
            {days.map(day => {
              const daySlots = slots.filter(s => s.day === day);
              if (daySlots.length === 0) return null;
              return (
                <div key={day} className={styles.dayGroup}>
                  <h3 className={styles.dayName}>{day}</h3>
                  <div className={styles.tags}>
                    {daySlots.map(slot => (
                      <div key={slot._id} className={styles.slotTag}>
                        <span>{slot.startTime} - {slot.endTime}</span>
                        <button onClick={() => handleDeleteSlot(slot._id)} className={styles.deleteTag}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {slots.length === 0 && <p className={styles.empty}>No slots defined. Add your first slot to start receiving appointments.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Availability;
