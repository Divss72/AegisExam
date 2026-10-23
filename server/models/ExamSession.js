const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const ExamSession = sequelize.define('ExamSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sessionToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'submitted', 'flagged', 'terminated'),
    allowNull: false,
    defaultValue: 'in_progress'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  answers: {
    type: DataTypes.TEXT, // JSON map: { [questionId]: { code, answer, language, testResults } }
    allowNull: true,
    defaultValue: '{}'
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  candidateIp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  violationCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  currentQuestionIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  lastHeartbeat: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = ExamSession;
