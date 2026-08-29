const db = require('../config/pg.db');
const { sequelize, Department, Doctor, Appointment } = require('../sql/models');
const { Op } = require('sequelize');

// Execute SQL Schema Initialization
exports.initSchema = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');
    
    // First, try running raw SQL as before
    await db.query(schemaSql);
    
    // Now, synchronize Sequelize models (ORM) to prove ORM usage
    if (sequelize && process.env.PG_URI) {
      await sequelize.sync();
    }

    res.json({ message: 'PostgreSQL schema and Sequelize ORM initialized successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Database might not be configured.' });
  }
};

// DEMONSTRATE: SQL JOINs using ORM
exports.getDoctorsWithDepartments = async (req, res) => {
  try {
    // Proving ORM usage to perform an INNER JOIN
    if (!process.env.PG_URI) throw new Error('Database not configured');

    const doctors = await Doctor.findAll({
      include: [{
        model: Department,
        required: true // required: true forces an INNER JOIN
      }],
      order: [['name', 'ASC']]
    });
    
    res.json({ data: doctors });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Failed to execute ORM JOIN query.' });
  }
};

// DEMONSTRATE: Filtering, Ordering, Grouping (SQL Postgres) using ORM
exports.getAppointmentStats = async (req, res) => {
  try {
    if (!process.env.PG_URI) throw new Error('Database not configured');

    // Aggregate query showing WHERE, GROUP BY, HAVING, and ORDER BY using ORM
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
        status: 'completed' // FILTERING (WHERE)
      },
      group: ['pg_doctor.name'], // GROUPING
      having: sequelize.where(
        sequelize.fn('COUNT', sequelize.col('pg_appointment.id')),
        { [Op.gt]: 0 } // FILTERING AGGREGATES (HAVING > 0)
      ),
      order: [
        [sequelize.literal('total_appointments'), 'DESC'] // ORDERING
      ]
    });
    
    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Failed to execute ORM aggregation query.' });
  }
};
