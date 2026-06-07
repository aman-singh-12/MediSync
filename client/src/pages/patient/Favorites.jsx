import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import { FiHeart, FiUser, FiMapPin, FiStar } from 'react-icons/fi';
import Button from '../../components/Button';
import { useToast } from '../../components/ToastContext';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/patients/saved-doctors');
      setFavorites(res.data || []);
    } catch (err) {
      console.error("Failed to load favorites.");
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id) => {
    try {
      await api.delete(`/api/patients/saved-doctors/${id}`);
      setFavorites(favorites.filter(doc => doc._id !== id));
      addToast("Removed from favorites successfully", "success");
    } catch (err) {
      addToast("Failed to remove from favorites.", "error");
    }
  };

  const handleBook = (doctorId) => {
    navigate('/book-appointment', { state: { doctorId } });
  };

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <header>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Favorite Practitioners</h1>
          <p style={{ color: 'var(--text-muted)' }}>Quick access to your preferred medical professionals.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Loading your medical team...</div>
          ) : favorites.length > 0 ? (
            favorites.map((doctor) => (
              <div key={doctor._id} style={{ 
                background: 'white', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-color)', 
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    background: 'var(--primary-light)', 
                    color: 'var(--primary)', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 800
                  }}>
                    {doctor.user?.name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 800 }}>{doctor.user?.name || ''}</h3>
                    <p style={{ margin: '2px 0 0', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>{doctor.specialization}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiMapPin size={14} /> {doctor.hospital || 'Private Clinic'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiStar size={14} style={{ color: '#f59e0b', fill: '#f59e0b' }} /> 4.9 (120+)
                  </span>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                  <Button style={{ flex: 1 }} onClick={() => handleBook(doctor._id)}>Book Visit</Button>
                  <button 
                    onClick={() => removeFavorite(doctor._id)}
                    style={{ 
                      padding: '0 12px', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid #fee2e2', 
                      background: 'white', 
                      color: '#ef4444',
                      cursor: 'pointer'
                    }}
                  >
                    <FiHeart style={{ fill: '#ef4444' }} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              gridColumn: '1/-1', 
              padding: '80px', 
              textAlign: 'center', 
              color: 'var(--text-muted)',
              border: '1px dotted var(--border-color)',
              borderRadius: 'var(--radius-md)'
            }}>
              <FiHeart size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
              <p>You haven't saved any practitioners yet.</p>
            </div>
          )}
        </div>
      </div>
  );
};

export default Favorites;
