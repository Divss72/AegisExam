const express = require('express');
const router = express.Router();
const { Question, AuditLog } = require('../models');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

// Helper to sanitize question object according to user role
function sanitizeQuestion(q, role) {
  const plain = q.toJSON ? q.toJSON() : { ...q };

  // Parse JSON string fields safely
  try {
    if (plain.starterCode && typeof plain.starterCode === 'string') plain.starterCode = JSON.parse(plain.starterCode);
    if (plain.options && typeof plain.options === 'string') plain.options = JSON.parse(plain.options);
    if (plain.sampleTestCases && typeof plain.sampleTestCases === 'string') plain.sampleTestCases = JSON.parse(plain.sampleTestCases);
    if (plain.supportedLanguages && typeof plain.supportedLanguages === 'string') plain.supportedLanguages = JSON.parse(plain.supportedLanguages);
  } catch (err) {}

  // If user is a student, NEVER send private evaluation test cases or correct answers!
  if (role === 'student') {
    delete plain.correctAnswer;
    delete plain.privateTestCases;
  } else {
    try {
      if (plain.privateTestCases && typeof plain.privateTestCases === 'string') {
        plain.privateTestCases = JSON.parse(plain.privateTestCases);
      }
    } catch (err) {}
  }

  return plain;
}

// GET /api/questions (List questions with filtering)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { subject, type, difficulty, status, search } = req.query;
    const where = {};

    // Students can only see published questions
    if (req.user.role === 'student') {
      where.status = 'published';
    } else if (status) {
      where.status = status;
    }

    if (subject) where.subject = { [Op.like]: `%${subject}%` };
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { subject: { [Op.like]: `%${search}%` } },
        { problemStatement: { [Op.like]: `%${search}%` } }
      ];
    }

    const questions = await Question.findAll({
      where,
      order: [['updatedAt', 'DESC']]
    });

    const sanitized = questions.map(q => sanitizeQuestion(q, req.user.role));
    res.json({ questions: sanitized });
  } catch (err) {
    console.error('Fetch questions error:', err);
    res.status(500).json({ error: 'Failed to retrieve questions.' });
  }
});

// GET /api/questions/:id (Single question detail)
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    if (req.user.role === 'student' && question.status !== 'published') {
      return res.status(403).json({ error: 'Question not available.' });
    }

    res.json({ question: sanitizeQuestion(question, req.user.role) });
  } catch (err) {
    console.error('Fetch question error:', err);
    res.status(500).json({ error: 'Failed to retrieve question details.' });
  }
});

// POST /api/questions (Create question - Admin only)
router.post('/', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const {
      title,
      subject,
      module,
      type,
      difficulty,
      marks,
      negativeMarks,
      timeLimitMinutes,
      problemStatement,
      starterCode,
      inputFormat,
      outputFormat,
      constraints,
      options,
      correctAnswer,
      sampleTestCases,
      privateTestCases,
      supportedLanguages,
      status
    } = req.body;

    // Explicit Schema Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Question title is required.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject/Course module is required.' });
    }
    if (!problemStatement || !problemStatement.trim()) {
      return res.status(400).json({ error: 'Problem statement is required.' });
    }
    if (type === 'mcq') {
      if (!options || (Array.isArray(options) && options.length < 2)) {
        return res.status(400).json({ error: 'Multiple choice questions require at least 2 options.' });
      }
      if (!correctAnswer) {
        return res.status(400).json({ error: 'Correct answer must be specified for multiple choice questions.' });
      }
    }

    const newQuestion = await Question.create({
      title: title.trim(),
      subject: subject.trim(),
      module: module ? module.trim() : null,
      type: type || 'coding',
      difficulty: difficulty || 'medium',
      marks: parseFloat(marks) || 10,
      negativeMarks: parseFloat(negativeMarks) || 0,
      timeLimitMinutes: parseInt(timeLimitMinutes, 10) || 15,
      problemStatement: problemStatement.trim(),
      starterCode: typeof starterCode === 'object' ? JSON.stringify(starterCode) : (starterCode || '{}'),
      inputFormat: inputFormat || null,
      outputFormat: outputFormat || null,
      constraints: constraints || null,
      options: Array.isArray(options) ? JSON.stringify(options) : (options || '[]'),
      correctAnswer: correctAnswer || null,
      sampleTestCases: Array.isArray(sampleTestCases) ? JSON.stringify(sampleTestCases) : (sampleTestCases || '[]'),
      privateTestCases: Array.isArray(privateTestCases) ? JSON.stringify(privateTestCases) : (privateTestCases || '[]'),
      supportedLanguages: Array.isArray(supportedLanguages) ? JSON.stringify(supportedLanguages) : JSON.stringify(['javascript', 'python', 'cpp', 'java']),
      status: status || 'published',
      createdBy: req.user.id
    });

    // Record audit log
    await AuditLog.create({
      userId: req.user.id,
      role: req.user.role,
      action: 'CREATE_QUESTION',
      resourceType: 'Question',
      resourceId: `${newQuestion.id}`,
      details: `Created ${newQuestion.type} question: "${newQuestion.title}" for subject "${newQuestion.subject}".`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({
      message: 'Question created successfully.',
      question: sanitizeQuestion(newQuestion, req.user.role)
    });
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ error: 'Failed to create question.' });
  }
});

// PUT /api/questions/:id (Update question - Admin only)
router.put('/:id', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const {
      title,
      subject,
      module,
      type,
      difficulty,
      marks,
      negativeMarks,
      timeLimitMinutes,
      problemStatement,
      starterCode,
      inputFormat,
      outputFormat,
      constraints,
      options,
      correctAnswer,
      sampleTestCases,
      privateTestCases,
      supportedLanguages,
      status
    } = req.body;

    if (title) question.title = title.trim();
    if (subject) question.subject = subject.trim();
    if (module !== undefined) question.module = module;
    if (type) question.type = type;
    if (difficulty) question.difficulty = difficulty;
    if (marks !== undefined) question.marks = parseFloat(marks);
    if (negativeMarks !== undefined) question.negativeMarks = parseFloat(negativeMarks);
    if (timeLimitMinutes !== undefined) question.timeLimitMinutes = parseInt(timeLimitMinutes, 10);
    if (problemStatement) question.problemStatement = problemStatement.trim();
    if (starterCode !== undefined) {
      question.starterCode = typeof starterCode === 'object' ? JSON.stringify(starterCode) : starterCode;
    }
    if (inputFormat !== undefined) question.inputFormat = inputFormat;
    if (outputFormat !== undefined) question.outputFormat = outputFormat;
    if (constraints !== undefined) question.constraints = constraints;
    if (options !== undefined) {
      question.options = Array.isArray(options) ? JSON.stringify(options) : options;
    }
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
    if (sampleTestCases !== undefined) {
      question.sampleTestCases = Array.isArray(sampleTestCases) ? JSON.stringify(sampleTestCases) : sampleTestCases;
    }
    if (privateTestCases !== undefined) {
      question.privateTestCases = Array.isArray(privateTestCases) ? JSON.stringify(privateTestCases) : privateTestCases;
    }
    if (supportedLanguages !== undefined) {
      question.supportedLanguages = Array.isArray(supportedLanguages) ? JSON.stringify(supportedLanguages) : supportedLanguages;
    }
    if (status) question.status = status;
    question.version = (question.version || 1) + 1;

    await question.save();

    await AuditLog.create({
      userId: req.user.id,
      role: req.user.role,
      action: 'UPDATE_QUESTION',
      resourceType: 'Question',
      resourceId: `${question.id}`,
      details: `Updated question "${question.title}" (version ${question.version}).`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      message: 'Question updated successfully.',
      question: sanitizeQuestion(question, req.user.role)
    });
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({ error: 'Failed to update question.' });
  }
});

// POST /api/questions/:id/duplicate (Duplicate question - Admin only)
router.post('/:id/duplicate', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const original = await Question.findByPk(req.params.id);
    if (!original) {
      return res.status(404).json({ error: 'Original question not found.' });
    }

    const copy = await Question.create({
      title: `${original.title} (Copy)`,
      subject: original.subject,
      module: original.module,
      type: original.type,
      difficulty: original.difficulty,
      marks: original.marks,
      negativeMarks: original.negativeMarks,
      timeLimitMinutes: original.timeLimitMinutes,
      problemStatement: original.problemStatement,
      starterCode: original.starterCode,
      inputFormat: original.inputFormat,
      outputFormat: original.outputFormat,
      constraints: original.constraints,
      options: original.options,
      correctAnswer: original.correctAnswer,
      sampleTestCases: original.sampleTestCases,
      privateTestCases: original.privateTestCases,
      supportedLanguages: original.supportedLanguages,
      status: 'draft',
      version: 1,
      createdBy: req.user.id
    });

    await AuditLog.create({
      userId: req.user.id,
      role: req.user.role,
      action: 'DUPLICATE_QUESTION',
      resourceType: 'Question',
      resourceId: `${copy.id}`,
      details: `Duplicated question #${original.id} into new question #${copy.id} ("${copy.title}").`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({
      message: 'Question duplicated successfully as draft.',
      question: sanitizeQuestion(copy, req.user.role)
    });
  } catch (err) {
    console.error('Duplicate question error:', err);
    res.status(500).json({ error: 'Failed to duplicate question.' });
  }
});

// DELETE /api/questions/:id (Archive or Delete question - Admin only)
router.delete('/:id', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    // Set to archived instead of hard deleting to preserve exam history integrity
    question.status = 'archived';
    await question.save();

    await AuditLog.create({
      userId: req.user.id,
      role: req.user.role,
      action: 'ARCHIVE_QUESTION',
      resourceType: 'Question',
      resourceId: `${question.id}`,
      details: `Archived question #${question.id} ("${question.title}").`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ message: 'Question archived successfully.' });
  } catch (err) {
    console.error('Archive question error:', err);
    res.status(500).json({ error: 'Failed to archive question.' });
  }
});

module.exports = router;
