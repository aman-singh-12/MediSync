import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiUsers, 
  FiActivity, 
  FiDollarSign, 
  FiCheckCircle,
  FiUserCheck,
  FiCalendar
} from 'react-icons/fi';
import api from '../../services/api';
import DashboardLayout from "../../components/DashboardLayout";
import Button from "../../components/Button";
import { useToast } from "../../components/ToastContext";
const formatCurrency = (value) => {
  return `₹${Number(value || 0).toFixed(2)}`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, doctorsRes, paymentsRes] = await Promise.all([
          api.get('/api/admin/dashboard'),
          api.get('/api/admin/doctors'),
          api.get('/api/admin/payments')
        ]);
        setStats(statsRes.data);
        setDoctors(doctorsRes.data?.data || doctorsRes.data || []);
        setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
        setError('Unable to load administration data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const summary = useMemo(() => {
    const paidTotal = payments
      .filter((item) => item?.status === "paid")
      .reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

    const refundTotal = payments
      .filter((item) => item?.status === "refunded")
      .reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

    const totalValue = paidTotal - refundTotal;

    return {
      totalValue
    };
  }, [payments]);

  const approveDoctor = async (id) => {
    try {
      await api.put(`/api/admin/doctors/${id}/approve`);
      setDoctors(doctors.map(doc => doc._id === id ? { ...doc, isApproved: true } : doc));
      addToast("Doctor approved successfully", "success");
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to approve doctor', "error");
    }
  };

  if (loading) return <div>Loading clinical administration...</div>;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <header>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Clinical Operations Center</h1>
          <p style={{ color: 'var(--text-muted)' }}>Oversee system health, revenue, and medical practitioners.</p>
        </header>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}><FiDollarSign size={24} /></div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>System Revenue</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatCurrency(summary.totalValue)}</div>
            </div>
          </div>
          <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', background: '#e0f2fe', color: '#0369a1', borderRadius: 'var(--radius-sm)' }}><FiUserCheck size={24} /></div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Doctors</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats?.stats?.totalDoctors || doctors.length}</div>
            </div>
          </div>
          <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', background: '#fef3c7', color: '#b45309', borderRadius: 'var(--radius-sm)' }}><FiCalendar size={24} /></div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Appointments</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats?.stats?.totalAppointments || 0}</div>
            </div>
          </div>
        </div>

        {/* Doctor Approval Table */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Practitioner Verification Queue</h2>
          </div>
          
          {doctors.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: '16px 24px' }}>Practitioner</th>
                  <th style={{ padding: '16px 24px' }}>Specialization</th>
                  <th style={{ padding: '16px 24px' }}>Status</th>
                  <th style={{ padding: '16px 24px' }}>Action</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.95rem' }}>
                {doctors.map(doc => (
                  <tr key={doc._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 700 }}>{doc.user?.name || 'Incomplete Profile'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.user?.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>{doc.specialization || 'N/A'}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800, background: doc.isApproved ? '#dcfce7' : '#fef3c7', color: doc.isApproved ? '#166534' : '#92400e' }}>
                        {doc.isApproved ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {!doc.isApproved && (
                        <Button 
                          onClick={() => approveDoctor(doc._id)}
                          style={{ height: '36px', padding: '0 16px', fontSize: '0.85rem' }}
                        >
                          Verify Practitioner
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FiActivity size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <div>No practitioners awaiting verification.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;