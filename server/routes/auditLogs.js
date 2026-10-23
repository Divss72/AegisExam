const express = require('express');
const router = express.Router();
const { AuditLog, User } = require('../models');
const { authenticateUser, requireRole } = require('../middleware/auth');

// GET /api/audit-logs (Admin only audit trail)
router.get('/', authenticateUser, requireRole('admin'), async (req, res) => {
  try {
    const { limit = 50, action } = req.query;
    const where = {};
    if (action) where.action = action;

    const logs = await AuditLog.findAll({
      where,
      limit: parseInt(limit, 10),
      order: [['timestamp', 'DESC']]
    });

    res.json({ logs });
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve audit trail.' });
  }
});

module.exports = router;
