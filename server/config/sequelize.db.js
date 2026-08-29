const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.PG_URI) {
  sequelize = new Sequelize(process.env.PG_URI, {
    dialect: 'postgres',
    logging: false, // Set to console.log to see the raw SQL queries
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  console.warn('PG_URI is missing. Sequelize (ORM) will be disabled.');
  // Provide a dummy mock for tests without DB
  sequelize = {
    authenticate: () => Promise.resolve(),
    define: () => ({
      belongsTo: () => {},
      hasMany: () => {},
      sync: () => Promise.resolve()
    })
  };
}

module.exports = sequelize;
