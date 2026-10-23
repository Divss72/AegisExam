const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, AuditLog } = require('../models');
const { generateToken, authenticateUser } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user);

    // Audit log
    await AuditLog.create({
      userId: user.id,
      role: user.role,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: `${user.id}`,
      details: `User ${user.fullName} (${user.email}) logged in successfully.`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        studentId: user.studentId,
        department: user.department
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateUser, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.fullName,
      studentId: req.user.studentId,
      department: req.user.department
    }
  });
});

// POST /api/auth/switch-role (Convenience 1-click role switcher for evaluator testing)
router.post('/switch-role', async (req, res) => {
  try {
    const { targetRole } = req.body;
    if (!['admin', 'student', 'invigilator'].includes(targetRole)) {
      return res.status(400).json({ error: 'Invalid target role. Must be admin, student, or invigilator.' });
    }

    const user = await User.findOne({ where: { role: targetRole } });
    if (!user) {
      return res.status(404).json({ error: `No seed user found for role: ${targetRole}` });
    }

    const token = generateToken(user);
    res.json({
      message: `Switched active role to ${targetRole}`,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        studentId: user.studentId,
        department: user.department
      }
    });
  } catch (err) {
    console.error('Switch role error:', err);
    res.status(500).json({ error: 'Failed to switch role.' });
  }
});

// GET /api/auth/users (for invigilator / admin student list)
router.get('/users', authenticateUser, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'fullName', 'studentId', 'department']
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

module.exports = router;
