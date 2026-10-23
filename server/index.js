const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const { sequelize, User } = require('./models');
const { seedDatabase } = require('./seed');

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const examRoutes = require('./routes/exams');
const codeExecutionRoutes = require('./routes/codeExecution');
const telemetryRoutes = require('./routes/telemetry');
const forensicsRoutes = require('./routes/forensics');
const auditLogRoutes = require('./routes/auditLogs');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach socket.io to express app for route access
app.set('socketio', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static frontend assets from workspace root
app.use(express.static(path.join(__dirname, '..')));

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/execute', codeExecutionRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/forensics', forensicsRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    platform: 'AegisExam Sentinel',
    version: '2.0.0-PROD',
    defenseShield: 'ARMED',
    timestamp: new Date().toISOString()
  });
});

// Real-Time Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Invigilator joins monitoring room
  socket.on('join:invigilators', () => {
    socket.join('invigilators');
    console.log(`[Socket.io] Socket ${socket.id} joined 'invigilators' monitoring stream.`);
  });

  // Student joins personal session room
  socket.on('join:session', (sessionId) => {
    socket.join(`session_${sessionId}`);
    console.log(`[Socket.io] Socket ${socket.id} joined exam session room: session_${sessionId}`);
  });

  // Candidate heartbeat
  socket.on('candidate:heartbeat', (data) => {
    io.to('invigilators').emit('proctor:heartbeat', {
      socketId: socket.id,
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Forward instant violation event to invigilators
  socket.on('candidate:violation', (violationData) => {
    io.to('invigilators').emit('proctor:violation', {
      socketId: socket.id,
      ...violationData,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Fallback for HTML5 client-side navigation
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[Database] Connection verified successfully.');

    // Auto-seed if database is new or empty
    const userCount = await User.count().catch(() => 0);
    if (userCount === 0) {
      console.log('[Database] No records found. Running initial seed...');
      await seedDatabase();
    } else {
      console.log(`[Database] Database ready with ${userCount} registered users.`);
    }

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🛡️  AEGISEXAM SENTINEL • SECURE EXAMINATION PLATFORM`);
      console.log(`🌐 Server running at: http://localhost:${PORT}`);
      console.log(`🔑 Admin:       admin@aegisexam.io   / admin123`);
      console.log(`🎓 Student:     student@aegisexam.io / student123`);
      console.log(`👁️  Invigilator: proctor@aegisexam.io / proctor123`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
}

startServer();
