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
  // Provide a robust mock for tests and offline pedagogical demonstrations
  sequelize = {
    authenticate: () => Promise.resolve(),
    sync: () => Promise.resolve(),
    define: (modelName, attributes, options) => {
      const mockModel = {
        name: modelName,
        attributes,
        options,
        belongsTo: () => {},
        hasMany: () => {},
        hasOne: () => {},
        belongsToMany: () => {},
        sync: () => Promise.resolve(),
        findAll: () => Promise.resolve([]),
        findOne: () => Promise.resolve(null),
        create: (data) => Promise.resolve(data)
      };
      return mockModel;
    },
    col: (colName) => colName,
    fn: (fnName, ...args) => `${fnName}(${args.join(', ')})`,
    where: (fn, obj) => ({ fn, obj }),
    literal: (lit) => lit
  };
}

module.exports = sequelize;
