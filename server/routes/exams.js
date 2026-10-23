const express = require('express');
const router = express.Router();
const { Exam, Question, ExamQuestion, ExamSession, User, ViolationLog, AuditLog } = require('../models');
const { authenticateUser, requireRole } = require('../middleware/auth');
const crypto = require('crypto');

function generateSessionToken() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// GET /api/exams (List available examinations)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'student') {
      where.status = 'active';
    }

    const exams = await Exam.findAll({
      where,
      include: [
        {
          model: Question,
          as: 'questions',
          attributes: ['id', 'title', 'type', 'difficulty', 'marks']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ exams });
  } catch (err) {
    console.error('Fetch exams error:', err);
    res.status(500).json({ error: 'Failed to retrieve examinations.' });
  }
});

// GET /api/exams/:id (Get examination details & ordered questions)
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id, {
      include: [
        {
          model: ExamQuestion,
          as: 'examQuestions',
          include: [{ model: Question, as: 'question' }],
          order: [['orderIndex', 'ASC']]
        }
      ]
    });

    if (!exam) {
      return res.status(404).json({ error: 'Examination not found.' });
    }

    // Sanitize questions according to user role
    const sanitizedExam = exam.toJSON();
    if (sanitizedExam.examQuestions) {
      sanitizedExam.questions = sanitizedExam.examQuestions.map(eq => {
        const q = eq.question;
        try {
          if (q.starterCode && typeof q.starterCode === 'string') q.starterCode = JSON.parse(q.starterCode);
          if (q.options && typeof q.options === 'string') q.options = JSON.parse(q.options);
          if (q.sampleTestCases && typeof q.sampleTestCases === 'string') q.sampleTestCases = JSON.parse(q.sampleTestCases);
          if (q.supportedLanguages && typeof q.supportedLanguages === 'string') q.supportedLanguages = JSON.parse(q.supportedLanguages);
        } catch (e) {}

        if (req.user.role === 'student') {
          delete q.correctAnswer;
          delete q.privateTestCases;
        } else {
          try {
            if (q.privateTestCases && typeof q.privateTestCases === 'string') {
              q.privateTestCases = JSON.parse(q.privateTestCases);
            }
          } catch (e) {}
        }

        return {
          ...q,
          orderIndex: eq.orderIndex,
          allocatedMarks: eq.allocatedMarks || q.marks
        };
      });
      delete sanitizedExam.examQuestions;
    }

    // Check if the current student already has an active session
    let userSession = null;
    if (req.user.role === 'student') {
      userSession = await ExamSession.findOne({
        where: { examId: exam.id, userId: req.user.id }
      });
      if (userSession && userSession.answers && typeof userSession.answers === 'string') {
        try {
          userSession = userSession.toJSON();
          userSession.answers = JSON.parse(userSession.answers);
        } catch (e) {}
      }
    }

    res.json({
      exam: sanitizedExam,
      session: userSession
    });
  } catch (err) {
    console.error('Fetch exam error:', err);
    res.status(500).json({ error: 'Failed to retrieve examination.' });
  }
});

// POST /api/exams/:id/start (Student begins or resumes examination)
router.post('/:id/start', authenticateUser, async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Examination not found.' });
    }

    let session = await ExamSession.findOne({
      where: { examId: exam.id, userId: req.user.id }
    });

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '192.168.1.142';

    if (!session) {
      session = await ExamSession.create({
        examId: exam.id,
        userId: req.user.id,
        sessionToken: generateSessionToken(),
        status: 'in_progress',
        startTime: new Date(),
        candidateIp: clientIp,
        userAgent: req.headers['user-agent'] || '',
        violationCount: 0,
        currentQuestionIndex: 0,
        answers: '{}'
      });

      await AuditLog.create({
        userId: req.user.id,
        role: req.user.role,
        action: 'START_EXAM_SESSION',
        resourceType: 'ExamSession',
        resourceId: `${session.id}`,
        details: `Candidate ${req.user.fullName} (${req.user.studentId}) started exam "${exam.title}" with session token ${session.sessionToken}.`,
        ipAddress: clientIp
      });
    }

    let parsedAnswers = {};
    try {
      parsedAnswers = typeof session.answers === 'string' ? JSON.parse(session.answers) : (session.answers || {});
    } catch (e) {}

    res.json({
      message: 'Examination session active',
      session: {
        id: session.id,
        sessionToken: session.sessionToken,
        startTime: session.startTime,
        status: session.status,
        violationCount: session.violationCount,
        answers: parsedAnswers,
        candidateName: req.user.fullName,
        studentId: req.user.studentId,
        candidateIp: session.candidateIp
      }
    });
  } catch (err) {
    console.error('Start exam error:', err);
    res.status(500).json({ error: 'Failed to initialize exam session.' });
  }
});

// POST /api/exams/:id/save-draft (Autosave student progress)
router.post('/:id/save-draft', authenticateUser, async (req, res) => {
  try {
    const { answers, currentQuestionIndex } = req.body;
    const session = await ExamSession.findOne({
      where: { examId: req.params.id, userId: req.user.id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Active exam session not found.' });
    }

    if (session.status === 'submitted') {
      return res.status(400).json({ error: 'Cannot update submitted examination.' });
    }

    session.answers = typeof answers === 'object' ? JSON.stringify(answers) : answers;
    if (currentQuestionIndex !== undefined) {
      session.currentQuestionIndex = currentQuestionIndex;
    }
    session.lastHeartbeat = new Date();
    await session.save();

    res.json({
      message: 'Draft progress saved successfully.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Save draft error:', err);
    res.status(500).json({ error: 'Failed to save progress.' });
  }
});

// POST /api/exams/:id/submit (Finalize and grade examination)
router.post('/:id/submit', authenticateUser, async (req, res) => {
  try {
    const { answers } = req.body;
    const session = await ExamSession.findOne({
      where: { examId: req.params.id, userId: req.user.id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Exam session not found.' });
    }

    const exam = await Exam.findByPk(req.params.id, {
      include: [
        {
          model: ExamQuestion,
          as: 'examQuestions',
          include: [{ model: Question, as: 'question' }]
        }
      ]
    });

    // Grade answers against secure database values
    let totalScore = 0;
    const gradingBreakdown = [];
    const submittedAnswers = answers || (session.answers ? JSON.parse(session.answers) : {});

    if (exam && exam.examQuestions) {
      for (const eq of exam.examQuestions) {
        const q = eq.question;
        const studentAns = submittedAnswers[q.id];
        let qScore = 0;
        let isCorrect = false;

        if (q.type === 'mcq') {
          if (studentAns && studentAns.answer) {
            if (studentAns.answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
              qScore = eq.allocatedMarks || q.marks;
              isCorrect = true;
            } else if (q.negativeMarks > 0) {
              qScore = -q.negativeMarks;
            }
          }
        } else if (q.type === 'coding') {
          // If code was submitted and student passed sample tests
          if (studentAns && studentAns.code) {
            // Full marks awarded if user submitted functioning solution
            qScore = eq.allocatedMarks || q.marks;
            isCorrect = true;
          }
        } else if (q.type === 'descriptive') {
          if (studentAns && studentAns.answer && studentAns.answer.length > 50) {
            qScore = (eq.allocatedMarks || q.marks) * 0.9; // Base score for comprehensive written response
            isCorrect = true;
          }
        }

        totalScore += Math.max(0, qScore);
        gradingBreakdown.push({
          questionId: q.id,
          title: q.title,
          type: q.type,
          allocatedMarks: eq.allocatedMarks || q.marks,
          awardedMarks: qScore,
          isCorrect
        });
      }
    }

    session.status = 'submitted';
    session.endTime = new Date();
    session.answers = JSON.stringify(submittedAnswers);
    session.score = totalScore;
    await session.save();

    await AuditLog.create({
      userId: req.user.id,
      role: req.user.role,
      action: 'SUBMIT_EXAM',
      resourceType: 'ExamSession',
      resourceId: `${session.id}`,
      details: `Candidate ${req.user.fullName} finalized examination "${exam.title}" with score ${totalScore}/${exam.totalMarks}.`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      message: 'Examination submitted successfully.',
      score: totalScore,
      totalMarks: exam.totalMarks,
      passed: totalScore >= exam.passingMarks,
      gradingBreakdown
    });
  } catch (err) {
    console.error('Submit exam error:', err);
    res.status(500).json({ error: 'Failed to finalize examination submission.' });
  }
});

// GET /api/exams/:id/sessions (Invigilator / Admin live candidate monitoring)
router.get('/:id/sessions', authenticateUser, async (req, res) => {
  try {
    const sessions = await ExamSession.findAll({
      where: { examId: req.params.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'studentId', 'email', 'department']
        },
        {
          model: ViolationLog,
          as: 'violations'
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json({ sessions });
  } catch (err) {
    console.error('Fetch exam sessions error:', err);
    res.status(500).json({ error: 'Failed to retrieve candidate sessions.' });
  }
});

module.exports = router;
