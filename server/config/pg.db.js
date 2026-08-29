const { Pool } = require('pg');

let pool = null;

const initPgPool = () => {
  if (process.env.PG_URI) {
    try {
      pool = new Pool({
        connectionString: process.env.PG_URI,
        ssl: {
          rejectUnauthorized: false
        }
      });
      console.log('PostgreSQL connection pool initialized.');
    } catch (err) {
      console.error('Error initializing PostgreSQL pool:', err.message);
    }
  } else {
    console.warn('PG_URI not found in environment. PostgreSQL features will be disabled.');
  }
};

initPgPool();

module.exports = {
  query: (text, params) => {
    if (!pool) {
      throw new Error('PostgreSQL is not configured. Please add PG_URI to your .env file.');
    }
    return pool.query(text, params);
  },
  getPool: () => pool
};
