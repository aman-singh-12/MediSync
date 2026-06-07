import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import styles from "./DoctorSearch.module.css";
import { getImageUrl } from "../../utils/imageUrl";
import Button from "../../components/Button";
import { FiSearch, FiMapPin, FiCalendar, FiDollarSign, FiHeart } from "react-icons/fi";
import { useToast } from "../../components/ToastContext";

const DoctorSearch = () => {
  const [doctors, setDoctors] = useState([]);
  const [savedDoctorIds, setSavedDoctorIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Filter States
  const [searchName, setSearchName] = useState("");
  const [specialization, setSpecialization] = useState("");

  useEffect(() => {
    fetchDoctors();
    fetchSavedDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/doctors');
      setDoctors(res.data || []);
    } catch (err) {
      setError("Failed to load medical registry.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedDoctors = async () => {
    try {
      const res = await api.get('/api/patients/saved-doctors');
      const ids = new Set((res.data || []).map(d => d._id));
      setSavedDoctorIds(ids);
    } catch (err) {
      console.error("Failed to fetch favorites");
    }
  };

  const toggleFavorite = async (doctorId) => {
    try {
      if (savedDoctorIds.has(doctorId)) {
        await api.delete(`/api/patients/saved-doctors/${doctorId}`);
        setSavedDoctorIds(prev => {
          const next = new Set(prev);
          next.delete(doctorId);
          return next;
        });
        addToast("Removed from favorites", "info");
      } else {
        await api.post(`/api/patients/saved-doctors/${doctorId}`);
        setSavedDoctorIds(prev => {
          const next = new Set(prev);
          next.add(doctorId);
          return next;
        });
        addToast("Added to favorites", "success");
      }
    } catch (err) {
      addToast("Failed to update favorites", "error");
    }
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const name = doc.user?.name || doc.name || "";
      const matchName = name.toLowerCase().includes(searchName.toLowerCase()) || !searchName;
      const matchSpec = doc.specialization?.toLowerCase().includes(specialization.toLowerCase()) || !specialization;
      return matchName && matchSpec;
    });
  }, [doctors, searchName, specialization]);

  const handleBook = (doctorId) => {
    navigate('/book-appointment', { state: { doctorId } });
  };

  return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>Find Your Specialist</h1>
          <p className={styles.headerSubtitle}>Book appointments with the best practitioners in the network.</p>
        </header>

        <section className={styles.searchSection}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Search by Name</label>
            <div style={{ position: 'relative' }}>
              <FiSearch style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className={styles.input}
                style={{ paddingLeft: '48px', width: '100%' }}
                placeholder="Dr. Rahul"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Specialization</label>
            <input
              type="text"
              className={styles.input}
              placeholder="General Physician"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            />
          </div>
        </section>

        {loading ? (
          <div className={styles.noResults}><h3>Accessing directory...</h3></div>
        ) : filteredDoctors.length > 0 ? (
          <div className={styles.resultsGrid}>
            {filteredDoctors.map((doc) => (
              <div key={doc._id} className={styles.doctorCard}>
                <button 
                  onClick={() => toggleFavorite(doc._id)}
                  style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: savedDoctorIds.has(doc._id) ? '#ef4444' : '#cbd5e1' }}
                >
                  <FiHeart size={24} style={{ fill: savedDoctorIds.has(doc._id) ? '#ef4444' : 'none' }} />
                </button>
                
                <div className={styles.doctorHeader}>
                  <div className={styles.avatar}>
                    {doc.user?.profilePicture ? (
                      <img 
                        src={getImageUrl(doc.user.profilePicture)} 
                        alt={doc.user?.name} 
                        style={{ width: '100%', height: '100%', borderRadius: '20px', objectFit: 'cover' }}
                      />
                    ) : (
                      (doc.user?.name || doc.name || 'D').charAt(0)
                    )}
                  </div>
                  <div className={styles.doctorInfo}>
                    <h3>{doc.user?.name || doc.name}</h3>
                    <p>{doc.specialization}</p>
                  </div>
                </div>

                <div className={styles.doctorDetails}>
                  <div className={styles.detailItem}>
                    <FiMapPin /> {doc.hospital || "Clinical Facility"}
                  </div>
                  <div className={styles.detailItem}>
                    {doc.consultationFee ? `₹${doc.consultationFee}` : "Standard Consultation"}
                  </div>
                </div>

                <Button className={styles.bookButton} onClick={() => handleBook(doc._id)}>Book Appointment</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noResults}>
            <h3>No practitioners found matching your criteria.</h3>
          </div>
        )}
      </div>
  );
};

export default DoctorSearch;
