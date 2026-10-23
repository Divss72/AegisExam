const { sequelize } = require('../db');
const User = require('./User');
const Question = require('./Question');
const Exam = require('./Exam');
const ExamQuestion = require('./ExamQuestion');
const ExamSession = require('./ExamSession');
const ViolationLog = require('./ViolationLog');
const AuditLog = require('./AuditLog');

// Define Associations
Exam.belongsToMany(Question, { through: ExamQuestion, foreignKey: 'examId', as: 'questions' });
Question.belongsToMany(Exam, { through: ExamQuestion, foreignKey: 'questionId', as: 'exams' });

Exam.hasMany(ExamQuestion, { foreignKey: 'examId', as: 'examQuestions' });
ExamQuestion.belongsTo(Exam, { foreignKey: 'examId' });
ExamQuestion.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

Exam.hasMany(ExamSession, { foreignKey: 'examId', as: 'sessions' });
ExamSession.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

User.hasMany(ExamSession, { foreignKey: 'userId', as: 'sessions' });
ExamSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ExamSession.hasMany(ViolationLog, { foreignKey: 'sessionId', as: 'violations' });
ViolationLog.belongsTo(ExamSession, { foreignKey: 'sessionId', as: 'session' });

User.hasMany(ViolationLog, { foreignKey: 'userId', as: 'violations' });
ViolationLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Question,
  Exam,
  ExamQuestion,
  ExamSession,
  ViolationLog,
  AuditLog
};
