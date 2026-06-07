import React from 'react';
import useAuth from '../hooks/useAuth';
import PatientDashboard from '../pages/patient/Dashboard';
import AdminDashboard from '../pages/admin/Dashboard';
import DoctorDashboard from '../pages/doctor/Dashboard';

const RoleBasedDashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'patient':
    default:
      return <PatientDashboard />;
  }
};

export default RoleBasedDashboard;
