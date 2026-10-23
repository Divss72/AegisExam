const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let sequelize;

if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER) {
  // Production MySQL Configuration
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  // Zero-configuration SQLite fallback for local development & demonstration
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(dataDir, 'aegisexam.sqlite'),
    logging: false
  });
}

module.exports = { sequelize };
