/**
 * Profile.jsx — Doctor "My Profile" page (read-only public view of their profile card).
 * Redirects to /doctor/profile for editing.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyDoctorProfile } from '../../services/doctor.service';
import { uploadProfilePicture } from '../../services/user.service';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../components/ToastContext';
import styles from './DoctorProfile.module.css';

const SERVER = 'http://localhost:5000';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyDoctorProfile();
        setProfile(data);
      } catch (err) {
        console.error(err);
        addToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formDataFile = new FormData();
    formDataFile.append('profilePicture', file);
    try {
      const data = await uploadProfilePicture(formDataFile);
      updateUser({ profilePicture: data.profilePicture });
      addToast('Profile picture updated successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to upload picture', 'error');
    }
  };

  const avatarSrc = user?.profilePicture
    ? `${SERVER}${user.profilePicture}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Doctor')}&background=1b6348&color=fff&size=128`;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px', color: 'var(--text-muted)' }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>My Profile</h1>
        <div className={styles.headerSubtitle}>Your public practitioner card — as seen by patients.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* ── Left: Avatar Card ── */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          {/* Hero banner */}
          <div style={{ height: '80px', background: 'linear-gradient(135deg, #1b6348, #16a34a)' }} />

          <div style={{ padding: '0 24px 28px', textAlign: 'center' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginTop: '-48px', marginBottom: '16px' }}>
              <img
                src={avatarSrc}
                alt="Avatar"
                style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
              />
              <label
                htmlFor="avatar-upload"
                style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'var(--brand-primary, #1b6348)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                title="Change profile picture"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800 }}>Dr. {user?.name}</h2>
            <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
              {profile?.specialization || 'General Practitioner'}
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</p>

            <div style={{ marginTop: '20px', padding: '12px', background: '#f0fdf4', borderRadius: '12px', fontSize: '0.8rem', color: '#15803d', fontWeight: 700 }}>
              ✓ Active Practitioner
            </div>

            <button
              onClick={() => navigate('/doctor/profile')}
              style={{ marginTop: '16px', width: '100%', padding: '12px', background: 'var(--brand-primary, #1b6348)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* ── Right: Info Grid ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Credentials */}
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '28px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Clinical Credentials
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Specialization', value: profile?.specialization },
                { label: 'Qualification', value: profile?.qualification },
                { label: 'Experience', value: profile?.experienceYears ? `${profile.experienceYears} Years` : null },
                { label: 'Hospital / Clinic', value: profile?.hospital },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.06em' }}>{label}</div>
                  <div style={{ fontWeight: 700, color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.95rem' }}>
                    {value || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '28px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Professional Biography
              </h3>
              <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{profile.bio}</p>
            </div>
          )}

          {/* Availability */}
          {profile?.availableSlots?.length > 0 && (
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '28px' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Available Slots
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {profile.availableSlots.map((slot, i) => (
                  <span key={i} style={{ background: '#dcf1e7', color: '#1b6348', padding: '8px 16px', borderRadius: '99px', fontSize: '0.82rem', fontWeight: 700 }}>
                    {slot.day}: {slot.startTime} – {slot.endTime}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
