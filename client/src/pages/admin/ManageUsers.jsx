import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import { FiTrash2, FiUser } from "react-icons/fi";
import { useToast } from "../../components/ToastContext";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/admin/users");
      setUsers(res.data?.data || res.data || []);
    } catch (err) {
      setError("Failed to load clinical user directory.");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user? This will also remove their medical/professional profile.")) return;
    
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      addToast("User deleted successfully.", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete user.", "error");
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users;
    
    if (activeTab !== "All") {
      result = result.filter((user) => {
        const role = (user.role || "").toLowerCase();
        if (activeTab === "Doctors") return role === "doctor";
        if (activeTab === "Admins") return role === "admin";
        if (activeTab === "Patients") return role === "patient";
        return true;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => 
        (u.name || "").toLowerCase().includes(term) || 
        (u.email || "").toLowerCase().includes(term)
      );
    }

    return result;
  }, [users, activeTab, searchTerm]);

  if (loading && users.length === 0) return <div>Retrieving user directory...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-1px', margin: 0 }}>User Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '4px 0 0' }}>Manage identities, roles, and platform access control.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '14px 24px',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              fontSize: '0.95rem',
              width: '320px',
              outline: 'none',
              background: 'white',
              boxShadow: 'var(--shadow-sm)',
              transition: 'var(--transition-all)'
            }}
          />
        </div>
      </header>

      <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
        {["All", "Doctors", "Patients", "Admins"].map((tab) => (
          <button
            key={tab}
            style={{ 
              padding: '10px 24px', 
              borderRadius: '12px', 
              border: 'none', 
              background: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition-fast)'
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '16px 24px', background: '#fef2f2', color: '#dc2626', borderRadius: '12px', border: '1px solid #fee2e2', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        {filteredUsers.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '24px', fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>User Identity</th>
                <th style={{ padding: '24px', fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Role</th>
                <th style={{ padding: '24px', fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Member Since</th>
                <th style={{ padding: '24px', fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition-fast)' }}>
                  <td style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ 
                        width: '48px', height: '48px', 
                        background: 'linear-gradient(135deg, var(--brand-primary), #10b981)', 
                        color: 'white', 
                        borderRadius: '16px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontWeight: 800, fontSize: '1.2rem',
                        boxShadow: '0 4px 12px rgba(48, 164, 108, 0.2)'
                      }}>
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.05rem' }}>{user.name || 'MediSync User'}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '24px' }}>
                    <span style={{ 
                      padding: '6px 14px', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '0.7rem', 
                      fontWeight: 900, 
                      background: user.role === 'admin' ? '#fef2f2' : user.role === 'doctor' ? '#f0f9ff' : '#f8fafc',
                      color: user.role === 'admin' ? '#ef4444' : user.role === 'doctor' ? '#0284c7' : 'var(--text-secondary)',
                      border: '1px solid',
                      borderColor: user.role === 'admin' ? '#fee2e2' : user.role === 'doctor' ? '#e0f2fe' : '#f1f5f9',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '24px', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
                    {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '24px', textAlign: 'right' }}>
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => deleteUser(user._id)}
                        style={{ 
                          background: '#fef2f2', 
                          border: '1px solid #fee2e2', 
                          color: '#ef4444', 
                          cursor: 'pointer', 
                          padding: '10px', 
                          borderRadius: '12px',
                          transition: 'var(--transition-all)'
                        }}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FiUser size={64} style={{ opacity: 0.1, marginBottom: '24px' }} />
            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>No clinical identities found in this category.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
