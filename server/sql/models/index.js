const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize.db');

// ==========================================
// SEQUELIZE ORM MODELS (RELATIONAL SCHEMA)
// ==========================================

// 1. Department Model
const Department = sequelize.define('pg_department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  building_location: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Main Campus'
  }
}, { tableName: 'pg_departments', timestamps: false });

// 2. Doctor Model
const Doctor = sequelize.define('pg_doctor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  supervisor_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  consultation_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 100.00
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, { tableName: 'pg_doctors', timestamps: false });

// 3. Patient Model
const Patient = sequelize.define('pg_patient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  blood_group: {
    type: DataTypes.STRING,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, { tableName: 'pg_patients', timestamps: false });

// 4. Appointment Model
const Appointment = sequelize.define('pg_appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  appointment_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'scheduled'
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'General Consultation'
  }
}, { tableName: 'pg_appointments', timestamps: false });

// 5. Prescription Model
const Prescription = sequelize.define('pg_prescription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appointment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  medication_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dosage: {
    type: DataTypes.STRING,
    allowNull: false
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, { tableName: 'pg_prescriptions', timestamps: false });

// ==========================================
// RELATIONSHIPS & FOREIGN KEY DEFINITIONS
// ==========================================

// 1-to-Many: Department <-> Doctor (ON DELETE SET NULL)
Department.hasMany(Doctor, { foreignKey: 'department_id', as: 'doctors' });
Doctor.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Self-Referencing (SELF JOIN): Doctor <-> Supervisor Doctor
Doctor.belongsTo(Doctor, { foreignKey: 'supervisor_id', as: 'supervisor' });
Doctor.hasMany(Doctor, { foreignKey: 'supervisor_id', as: 'subordinates' });

// 1-to-Many: Doctor <-> Appointment (ON DELETE CASCADE)
Doctor.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

// 1-to-Many: Patient <-> Appointment (ON DELETE CASCADE)
Patient.hasMany(Appointment, { foreignKey: 'patient_id', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// 1-to-1: Appointment <-> Prescription (ON DELETE CASCADE)
Appointment.hasOne(Prescription, { foreignKey: 'appointment_id', as: 'prescription' });
Prescription.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

module.exports = {
  sequelize,
  Department,
  Doctor,
  Patient,
  Appointment,
  Prescription
};
