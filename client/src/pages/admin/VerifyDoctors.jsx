import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiActivity, FiXCircle } from 'react-icons/fi';
import api from '../../services/api';
import DashboardLayout from "../../components/DashboardLayout";
import Button from "../../components/Button";

const VerifyDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/doctors');
      setDoctors(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    } finally {
      setLoading(false);
    }
  };

  const approveDoctor = async (id) => {
    try {
      await api.put(`/api/admin/doctors/${id}/approve`);
      setDoctors(doctors.map(doc => doc._id === id ? { ...doc, isApproved: true } : doc));
      setAlert({ type: 'success', message: 'Practitioner verified successfully.' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to verify practitioner.' });
    }
  };

  const rejectDoctor = async (id) => {
    try {
      await api.put(`/api/admin/doctors/${id}/reject`);
      setDoctors(doctors.map(doc => doc._id === id ? { ...doc, isApproved: false } : doc));
      setAlert({ type: 'success', message: 'Practitioner verification revoked.' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to revoke verification.' });
    }
  };

  const filteredDoctors = React.useMemo(() => {
    if (!searchTerm.trim()) return doctors;
    const term = searchTerm.toLowerCase();
    return doctors.filter(doc => 
      (doc.user?.name || "").toLowerCase().includes(term) ||
      (doc.user?.email || "").toLowerCase().includes(term) ||
      (doc.specialization || "").toLowerCase().includes(term)
    );
  }, [doctors, searchTerm]);

  if (loading && doctors.length === 0) return <div>Accessing medical registry...</div>;

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Practitioner Verification</h1>
            <p style={{ color: 'var(--text-muted)' }}>Review and approve medical professionals for clinical practice on MediSync.</p>
          </div>
          <input 
            type="text" 
            placeholder="Search practitioners..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.9rem',
              width: '300px',
              outline: 'none'
            }}
          />
        </header>

        {alert && (
          <div style={{ 
            padding: '16px', 
            borderRadius: 'var(--radius-md)', 
            background: alert.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: alert.type === 'success' ? '#16a34a' : '#ef4444',
            border: `1px solid ${alert.type === 'success' ? '#dcfce7' : '#fee2e2'}`,
            fontWeight: 600
          }}>
            {alert.message}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          {doctors.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '16px 24px' }}>Practitioner</th>
                  <th style={{ padding: '16px 24px' }}>Specialization</th>
                  <th style={{ padding: '16px 24px' }}>Status</th>
                  <th style={{ padding: '16px 24px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map(doc => (
                  <tr key={doc._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                          {doc.user?.name?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{doc.user?.name || 'Dr. Unknown'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>{doc.specialization || 'General Practice'}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: 'var(--radius-full)', 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        background: doc.isApproved ? '#dcfce7' : '#fef3c7', 
                        color: doc.isApproved ? '#166534' : '#92400e' 
                      }}>
                        {doc.isApproved ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!doc.isApproved ? (
                          <Button onClick={() => approveDoctor(doc._id)} style={{ height: '32px', padding: '0 12px', fontSize: '0.75rem' }}>
                            <FiCheckCircle style={{marginRight: '4px'}} /> Verify
                          </Button>
                        ) : (
                          <button 
                            onClick={() => rejectDoctor(doc._id)}
                            style={{ 
                              background: 'transparent', 
                              border: '1px solid #fee2e2', 
                              color: '#ef4444', 
                              padding: '6px 12px', 
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <FiXCircle style={{marginRight: '4px', verticalAlign: 'middle'}} /> Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FiActivity size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
              <div>No practitioners found in the registry.</div>
            </div>
          )}
        </div>
      </div>
  );
};

export default VerifyDoctors;
