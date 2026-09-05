require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./modules/auth/authRoutes');
const storeRoutes = require('./modules/store/storeRoutes');
const serviceRoutes = require('./modules/services/serviceRoutes');
const queueRoutes = require('./modules/queue/queueRoutes');
const barberRoutes = require('./modules/barbers/barberRoutes');
const paymentsRoutes = require('./modules/payments/paymentsRoutes');
const statsRoutes = require('./modules/stats/statsRoutes');

const app = express();

// Keamanan dasar: sembunyikan identitas framework, batasi origin CORS
app.disable('x-powered-by');
app.use(helmet());

// Batasi ukuran body untuk mencegah payload DoS.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 10000,
  message: { success: false, message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 1000,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi nanti.' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/barbers', barberRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Barberflow API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ===== MODULE MOUNT — setiap fitur menambah satu baris di bawah ini =====
// (belum ada modul pada step scaffold ini)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Barberflow Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = { app };