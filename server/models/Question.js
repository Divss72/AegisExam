const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Question = sequelize.define('Question', {
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
  module: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('coding', 'mcq', 'descriptive'),
    allowNull: false,
    defaultValue: 'coding'
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    allowNull: false,
    defaultValue: 'medium'
  },
  marks: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 10
  },
  negativeMarks: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  timeLimitMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 15
  },
  problemStatement: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  starterCode: {
    type: DataTypes.TEXT, // JSON map: { javascript: '...', python: '...', cpp: '...', java: '...' }
    allowNull: true
  },
  inputFormat: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  outputFormat: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  constraints: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  options: {
    type: DataTypes.TEXT, // JSON array for MCQ options: ["Option A", "Option B", ...]
    allowNull: true
  },
  correctAnswer: {
    type: DataTypes.TEXT, // Stored securely! Stripped from student responses
    allowNull: true
  },
  sampleTestCases: {
    type: DataTypes.TEXT, // JSON array: [{ input: '...', expectedOutput: '...', explanation: '...' }]
    allowNull: true
  },
  privateTestCases: {
    type: DataTypes.TEXT, // JSON array: [{ input: '...', expectedOutput: '...' }] - NEVER sent to student before submission
    allowNull: true
  },
  supportedLanguages: {
    type: DataTypes.TEXT, // JSON array: ["javascript", "python", "cpp", "java"]
    allowNull: true,
    defaultValue: JSON.stringify(['javascript', 'python', 'cpp', 'java'])
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived', 'scheduled'),
    allowNull: false,
    defaultValue: 'published'
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Question;
