const db = require('../config/pg.db');

// Execute SQL Schema Initialization
exports.initSchema = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');
    
    await db.query(schemaSql);
    res.json({ message: 'PostgreSQL schema initialized successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Database might not be configured.' });
  }
};

// DEMONSTRATE: SQL JOINs
exports.getDoctorsWithDepartments = async (req, res) => {
  try {
    // INNER JOIN to combine doctors with their department names
    const query = `
      SELECT d.id AS doctor_id, d.name AS doctor_name, dep.name AS department_name
      FROM pg_doctors d
      INNER JOIN pg_departments dep ON d.department_id = dep.id
      ORDER BY d.name ASC;
    `;
    const { rows } = await db.query(query);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Failed to execute JOIN query.' });
  }
};

// DEMONSTRATE: Filtering, Ordering, Grouping (SQL Postgres)
exports.getAppointmentStats = async (req, res) => {
  try {
    // Aggregate query showing WHERE, GROUP BY, HAVING, and ORDER BY
    const query = `
      SELECT 
        d.name AS doctor_name, 
        COUNT(a.id) AS total_appointments
      FROM pg_doctors d
      LEFT JOIN pg_appointments a ON d.id = a.doctor_id
      WHERE a.status = 'completed'  -- FILTERING
      GROUP BY d.name               -- GROUPING
      HAVING COUNT(a.id) > 0        -- FILTERING AGGREGATES
      ORDER BY total_appointments DESC; -- ORDERING
    `;
    const { rows } = await db.query(query);
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Failed to execute aggregation query.' });
  }
};
