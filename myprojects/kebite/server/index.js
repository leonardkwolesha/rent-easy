require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : [];

const isDev = process.env.NODE_ENV !== 'production';
const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?$/;

function corsOriginCheck(origin, callback) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  if (isDev && LOCALHOST_RE.test(origin)) return callback(null, true);
  callback(new Error(`CORS: origin ${origin} not allowed`));
}

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOriginCheck, credentials: true },
});

app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use(cors({ origin: corsOriginCheck, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

let dbReady = false;
app.get('/api/health', (_req, res) =>
  res.json({ db: dbReady ? 'connected' : 'disconnected' })
);
app.get('/api/db-status', (_req, res) =>
  res.json({ dbReady, message: dbReady ? 'connected' : 'disconnected' })
);
app.use('/api', (_req, res, next) => {
  if (dbReady) return next();
  res.status(503).json({ message: 'Database is unavailable. Please try again shortly.' });
});

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/payments',    require('./routes/payments'));
app.use('/api/promotions',  require('./routes/promotions'));
app.use('/api/reviews',     require('./routes/reviews'));
app.use('/api/support',     require('./routes/support'));
app.use('/api/chat',        require('./routes/chat'));
app.use('/api/ai',          require('./routes/ai'));
app.use('/api/restaurant',  require('./routes/restaurantPartner'));
app.use('/api/rider',       require('./routes/riders'));
app.use('/api/admin',       require('./routes/admin'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Each client joins their personal room and role room on connect
  socket.on('join', ({ userId, role } = {}) => {
    if (userId) socket.join(`user:${userId}`);
    if (role)   socket.join(`role:${role}`);
    console.log(`[socket] ${role || '?'} ${userId || '?'} joined`);
  });

  // Join the order-specific room for targeted status/location updates
  socket.on('join:order', ({ orderId } = {}) => {
    if (orderId) socket.join(`order:${orderId}`);
  });

  // Relay rider GPS to everyone tracking this order (customer tracking screen)
  socket.on('rider:locationUpdate', ({ orderId, lat, lng } = {}) => {
    if (orderId) {
      socket.to(`order:${orderId}`).emit('rider:locationUpdate', { orderId, lat, lng });
    }
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

async function seedAdmin() {
  try {
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = new User({
        name: 'Kebite Admin',
        email: 'admin@kebite.co.tz',
        role: 'admin',
        isApproved: true,
        isVerified: true,
        phone: '+255700000000',
      });
    }
    // Always reset to known credentials so a stale/broken hash never blocks login.
    admin.password = 'Admin@Kebite2026';
    admin.isApproved = true;
    await admin.save(); // pre-save hook re-hashes the password via bcrypt
    console.log('✅ Admin ready — email: admin@kebite.co.tz  password: Admin@Kebite2026');
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
}

const PORT = process.env.PORT || 5000;

const mongoose = require('mongoose');

mongoose.connection.on('disconnected', () => {
  if (dbReady) {
    dbReady = false;
    console.warn('MongoDB disconnected — restarting retry loop');
    tryConnectDB();
  }
});
mongoose.connection.on('reconnected', () => {
  dbReady = true;
  console.log('MongoDB reconnected');
});

async function tryConnectDB(attempt = 1) {
  try {
    await connectDB();
    dbReady = true;
    console.log(`✅ MongoDB connected (attempt ${attempt})`);
    await seedAdmin();
  } catch (err) {
    dbReady = false;
    const delay = Math.min(60000, 5000 * Math.pow(2, attempt - 1));
    console.error(`DB connection failed (attempt ${attempt}): ${err.message}`);
    console.error(`Retrying in ${delay / 1000}s (exponential backoff, capped at 60s)…`);
    setTimeout(() => tryConnectDB(attempt + 1), delay);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason?.message || reason);
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Stop the other process or set PORT in server/.env to a free port.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
tryConnectDB();

function shutdown(signal) {
  console.log(`\n${signal} received — closing server`);
  httpServer.close(() => {
    io.close();
    mongoose.connection.close(false).finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 5000).unref();
}
['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));
