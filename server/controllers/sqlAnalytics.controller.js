// SQL Analytics controller: PostgreSQL relational queries and Sequelize ORM demonstrations.
const db = require('../config/pg.db');
const { sequelize, Department, Doctor, Appointment } = require('../sql/models');
const { Op } = require('sequelize');

// ================= INITIALIZE SQL SCHEMA =================
// Logic: Executes SQL schema DDL file and synchronizes Sequelize relational models with PostgreSQL
exports.initSchema = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // 1. Read raw schema SQL file
    const schemaSql = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');
    
    // 2. Execute raw SQL DDL queries in PostgreSQL
    await db.query(schemaSql);
    
    // 3. Synchronize Sequelize ORM models to create/update tables
    if (sequelize && process.env.PG_URI) {
      await sequelize.sync();
    }

    res.json({ message: 'PostgreSQL schema and Sequelize ORM initialized successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Database might not be configured.' });
  }
};

// ================= GET DOCTORS WITH DEPARTMENTS (SQL INNER JOIN) =================
// Logic: Demonstrates relational SQL INNER JOIN querying between Doctors and Departments using Sequelize ORM
exports.getDoctorsWithDepartments = async (req, res) => {
  try {
    if (!process.env.PG_URI) throw new Error('Database not configured');

    // 1. Execute ORM query with INNER JOIN (required: true)
    const doctors = await Doctor.findAll({
      include: [{
        model: Department,
        required: true // Forces INNER JOIN in PostgreSQL
      }],
      order: [['name', 'ASC']]
    });
    
    res.json({ data: doctors });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Failed to execute ORM JOIN query.' });
  }
};

// ================= GET APPOINTMENT STATS (AGGREGATION & GROUP BY) =================
// Logic: Demonstrates advanced SQL analytics (WHERE, GROUP BY, HAVING, ORDER BY) using Sequelize ORM
exports.getAppointmentStats = async (req, res) => {
  try {
    if (!process.env.PG_URI) throw new Error('Database not configured');

    // 1. Execute aggregation with COUNT, GROUP BY doctor name, HAVING filter, and DESC sort
    const stats = await Appointment.findAll({
      attributes: [
        [sequelize.col('pg_doctor.name'), 'doctor_name'],
        [sequelize.fn('COUNT', sequelize.col('pg_appointment.id')), 'total_appointments']
      ],
      include: [{
        model: Doctor,
        attributes: []
      }],
      where: {
        status: 'completed' // WHERE filter
      },
      group: ['pg_doctor.name'], // GROUP BY clause
      having: sequelize.where(
        sequelize.fn('COUNT', sequelize.col('pg_appointment.id')),
        { [Op.gt]: 0 } // HAVING count > 0 clause
      ),
      order: [
        [sequelize.literal('total_appointments'), 'DESC'] // ORDER BY clause
      ]
    });
    
    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Failed to execute ORM aggregation query.' });
  }
};

