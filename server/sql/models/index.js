const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize.db');

// Defining models using an ORM to prove ORM concepts
const Department = sequelize.define('pg_department', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, { timestamps: false });

const Doctor = sequelize.define('pg_doctor', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { timestamps: false });

const Appointment = sequelize.define('pg_appointment', {
  patient_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  appointment_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'scheduled'
  }
}, { timestamps: false });

// Relationships (Primary Key / Foreign Key defined via ORM)
Department.hasMany(Doctor, { foreignKey: 'department_id' });
Doctor.belongsTo(Department, { foreignKey: 'department_id' });

Doctor.hasMany(Appointment, { foreignKey: 'doctor_id' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id' });

module.exports = {
  sequelize,
  Department,
  Doctor,
  Appointment
};
