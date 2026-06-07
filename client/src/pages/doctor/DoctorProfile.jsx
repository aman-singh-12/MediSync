import React, { useEffect, useState } from 'react';
import { getMyDoctorProfile, upsertDoctorProfile } from '../../services/doctor.service';
import { uploadProfilePicture } from '../../services/user.service';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../components/ToastContext';
import styles from './DoctorProfile.module.css';
import { getImageUrl } from '../../utils/imageUrl';

const DoctorProfile = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experienceYears: '0',
    specialization: '',
    qualification: '',
    hospital: '',
    bio: '',
    profilePicture: '',
    consultationFee: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyDoctorProfile();
        setProfile(data);
        if (data) {
          setFormData(prev => ({
            ...prev,
            name: data.user?.name || user?.name || '',
            email: data.user?.email || user?.email || '',
            bio: data.bio || prev.bio,
            specialization: data.specialization || prev.specialization,
            qualification: data.qualification || prev.qualification,
            experienceYears: data.experienceYears || prev.experienceYears,
            hospital: data.hospital || prev.hospital,
            profilePicture: data.user?.profilePicture || '',
            consultationFee: data.consultationFee || ''
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await upsertDoctorProfile({
        name: formData.name,
        bio: formData.bio,
        specialization: formData.specialization,
        qualification: formData.qualification,
        experienceYears: formData.experienceYears,
        hospital: formData.hospital,
        consultationFee: formData.consultationFee
      });
      // Sync name in global auth state so navbar updates immediately
      if (formData.name) updateUser({ name: formData.name });
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to update profile', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataFile = new FormData();
    formDataFile.append('profilePicture', file);

    try {
      const data = await uploadProfilePicture(formDataFile);
      setFormData(prev => ({ ...prev, profilePicture: data.profilePicture }));
      updateUser({ profilePicture: data.profilePicture });
      addToast('Profile picture updated', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to upload profile picture', 'error');
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Edit Professional Profile</h1>
        <div className={styles.headerSubtitle}>
          Manage your clinical information and digital presence.
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.formSection}>
          <div className={styles.profileAvatarGroup}>
            <img 
              src={formData.profilePicture ? getImageUrl(formData.profilePicture) : `https://ui-avatars.com/api/?name=${formData.name.replace(' ', '+')}&background=random`} 
              alt="Avatar" 
              className={styles.avatarImage} 
            />
            <label className={styles.editAvatarBtn}>
              <input type="file" onChange={handleFileUpload} style={{display: 'none'}} />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </label>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>FULL NAME</label>
              <input type="text" name="name" className={styles.formInput} value={formData.name} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>EMAIL ADDRESS</label>
              <input type="email" name="email" className={styles.formInput} value={formData.email} onChange={handleChange} disabled />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>PHONE NUMBER (Linked to User Profile)</label>
              <input type="text" name="phone" className={styles.formInput} value={formData.phone} onChange={handleChange} disabled />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>YEARS OF EXPERIENCE</label>
              <input type="number" name="experienceYears" className={styles.formInput} value={formData.experienceYears} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>CONSULTATION FEE (₹)</label>
              <input type="number" name="consultationFee" className={styles.formInput} value={formData.consultationFee} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>SPECIALIZATION</label>
              <input type="text" name="specialization" className={styles.formInput} placeholder="e.g. Cardiology" value={formData.specialization} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>QUALIFICATION</label>
            <input type="text" name="qualification" className={styles.formInput} placeholder="e.g. MD - Harvard Medical School" value={formData.qualification} onChange={handleChange} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>HOSPITAL / CLINIC NAME</label>
            <div style={{position: 'relative'}}>
              <div style={{position: 'absolute', left: '16px', top: '14px', color: 'var(--text-secondary)'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <input type="text" name="hospital" className={styles.formInput} style={{paddingLeft: '40px', width: '100%'}} value={formData.hospital} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>PROFESSIONAL BIOGRAPHY</label>
            <textarea name="bio" className={styles.formTextarea} value={formData.bio} onChange={handleChange}></textarea>
          </div>

          <button className={styles.saveBtn} onClick={handleSave}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            SAVE PROFESSIONAL PROFILE
          </button>
        </div>

        <div className={styles.previewSection}>
          <div className={styles.previewLabel}>LIVE PREVIEW</div>
          
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <div className={styles.previewStatus}>
                <div className={styles.statusDot}></div>
                ACTIVE PRACTITIONER
              </div>
            </div>
            <div className={styles.previewBody}>
              <img 
                src={formData.profilePicture ? getImageUrl(formData.profilePicture) : `https://ui-avatars.com/api/?name=${formData.name.replace(' ', '+')}&background=random`} 
                alt="Avatar" 
                className={styles.previewAvatar} 
              />
              <div className={styles.previewName}>{formData.name || 'Dr. Name'}</div>
              <div className={styles.previewSpec}>{formData.specialization || 'Specialization'} • {formData.experienceYears} Years Exp.</div>
              
              <div className={styles.previewTags}>
                  {formData.qualification && (
                    <div className={styles.previewTagItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                      {formData.qualification}
                    </div>
                  )}
                  {formData.hospital && (
                    <div className={styles.previewTagItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {formData.hospital}
                    </div>
                  )}
              </div>
            </div>
          </div>

          <div className={styles.profileStrength}>
            <div className={styles.strengthLabel}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Profile Strength: High
            </div>
            <div className={styles.strengthBar}>
              <div className={styles.strengthFill}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
