const express = require('express');
const router = express.Router();
const { ViolationLog, ExamSession, User, Exam } = require('../models');
const { authenticateUser, requireRole } = require('../middleware/auth');

// POST /api/telemetry/violation (Client reports violation event)
router.post('/violation', authenticateUser, async (req, res) => {
  try {
    const {
      examId,
      sessionId,
      violationType,
      severity = 'warning',
      details
    } = req.body;

    let candidateName = req.user.fullName;
    let studentId = req.user.studentId;

    let session = null;
    if (sessionId) {
      session = await ExamSession.findByPk(sessionId);
    } else if (examId) {
      session = await ExamSession.findOne({
        where: { examId, userId: req.user.id }
      });
    }

    if (session) {
      session.violationCount = (session.violationCount || 0) + 1;
      await session.save();
    }

    const violation = await ViolationLog.create({
      sessionId: session ? session.id : null,
      examId: examId || (session ? session.examId : null),
      userId: req.user.id,
      candidateName,
      studentId,
      violationType: violationType || 'General Security Violation',
      severity,
      details: details || 'Client security watchdog triggered.',
      timestamp: new Date()
    });

    // Real-time broadcast to connected invigilators via Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.to('invigilators').emit('proctor:violation', {
        id: violation.id,
        candidateName,
        studentId,
        violationType: violation.violationType,
        severity: violation.severity,
        details: violation.details,
        timestamp: violation.timestamp,
        totalViolations: session ? session.violationCount : 1,
        sessionId: session ? session.id : null
      });
    }

    res.status(201).json({
      message: 'Violation recorded',
      violationId: violation.id,
      totalViolations: session ? session.violationCount : 1
    });
  } catch (err) {
    console.error('Record violation error:', err);
    res.status(500).json({ error: 'Failed to record security violation.' });
  }
});

// GET /api/telemetry/violations (Invigilator / Admin live list)
router.get('/violations', authenticateUser, async (req, res) => {
  try {
    const { severity, limit = 50 } = req.query;
    const where = {};
    if (severity) where.severity = severity;

    const violations = await ViolationLog.findAll({
      where,
      limit: parseInt(limit, 10),
      order: [['timestamp', 'DESC']]
    });

    res.json({ violations });
  } catch (err) {
    console.error('Fetch violations error:', err);
    res.status(500).json({ error: 'Failed to fetch telemetry events.' });
  }
});

// POST /api/telemetry/action (Invigilator sends warning or action)
router.post('/action', authenticateUser, requireRole('admin', 'invigilator'), async (req, res) => {
  try {
    const { sessionId, userId, actionType, message } = req.body;

    const io = req.app.get('socketio');
    if (io) {
      if (sessionId) {
        io.to(`session_${sessionId}`).emit('proctor:action', {
          actionType: actionType || 'warning',
          message: message || 'Proctor security notice received.',
          issuedBy: req.user.fullName,
          timestamp: new Date().toISOString()
        });
      } else {
        io.emit('proctor:action', {
          actionType: actionType || 'warning',
          message: message || 'General proctor security alert.',
          issuedBy: req.user.fullName,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({ message: 'Action successfully dispatched to candidate session.' });
  } catch (err) {
    console.error('Action dispatch error:', err);
    res.status(500).json({ error: 'Failed to dispatch invigilator action.' });
  }
});

module.exports = router;
