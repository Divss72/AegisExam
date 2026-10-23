const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Exam = sequelize.define('Exam', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 60
  },
  totalMarks: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 100
  },
  passingMarks: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 40
  },
  watermarkStrategy: {
    type: DataTypes.ENUM('canvas-bake', 'tiled-overlay', 'steganographic-dots', 'hold-to-reveal', 'spotlight-mask'),
    allowNull: false,
    defaultValue: 'canvas-bake'
  },
  watermarkOpacity: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.18
  },
  watermarkAngle: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -28
  },
  shuffleQuestions: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  allowCodeExecution: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  maxViolationsAllowed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'active', 'archived'),
    allowNull: false,
    defaultValue: 'active'
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Exam;
