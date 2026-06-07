import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/ToastContext';
import styles from './Patients.module.css';
import { getImageUrl } from '../../utils/imageUrl';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  const loadPatients = async (page = 1, query = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/api/doctors/patients/me?page=${page}&limit=10&search=${query}`);
      setPatients(res.data.patients);
      setTotalPages(res.data.pages);
      setCurrentPage(res.data.page);
    } catch (err) {
      addToast('Failed to load patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadPatients(1, search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handlePageChange = (page) => {
    loadPatients(page, search);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <h1 className={styles.title}>Patient Portfolio</h1>
          <p className={styles.subtitle}>Comprehensive list of patients under your clinical care.</p>
        </div>
        <div className={styles.searchWrap}>
          <input 
            type="text" 
            placeholder="Search by patient name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.loader}>Loading patient data...</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Patient Info</th>
                  <th>Clinical ID</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div className={styles.patientCell}>
                        <div className={styles.avatar}>
                          {p.user?.profilePicture ? (
                            <img src={getImageUrl(p.user.profilePicture)} alt="" />
                          ) : (
                            p.user?.name?.charAt(0) || 'P'
                          )}
                        </div>
                        <div>
                          <div className={styles.name}>{p.user?.name}</div>
                          <div className={styles.email}>{p.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.id}>#{p._id.slice(-6).toUpperCase()}</td>
                    <td>{p.gender || 'Not specified'}</td>
                    <td><span className={styles.blood}>{p.bloodGroup || 'N/A'}</span></td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan="4" className={styles.empty}>No patients found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
            
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

export default Patients;
