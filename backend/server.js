const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ✅ Pour Render : faire confiance au proxy HTTPS
app.set('trust proxy', 1);

// 🧠 Sécurité & performance
app.use(helmet());
app.use(compression());

// 🚦 Limiteur de requêtes (anti-spam)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par IP
});
app.use('/api/', limiter);

// 🌐 CORS — FIX Render frontend
const allowedOrigins = [
  'https://task-manager-frontend-63bv.onrender.com', // ton frontend Render
  'http://localhost:3000', // dev local
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 🧩 Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🧾 Logs en dev
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 📂 Dossier des fichiers statiques
app.use('/uploads', express.static('uploads'));

// 📡 Connexion MongoDB (avec auto-retry)
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 30000);
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 60000,
      family: 4,
    });
    console.log('✅ MongoDB Atlas Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// 🔌 Événements Mongoose
mongoose.connection.on('connected', () => console.log('✅ Mongoose connected to MongoDB'));
mongoose.connection.on('error', (err) => console.error('❌ Mongoose error:', err.message));
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected, retrying...');
  connectDB();
});
mongoose.connection.on('reconnected', () => console.log('✅ Mongoose reconnected'));

// Connexion initiale
connectDB();

// 🩺 Route de santé
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'OK', database: dbStatus, timestamp: new Date().toISOString() });
});

// 🔍 Middleware de vérification DB avant requêtes API
app.use('/api/', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Database is reconnecting...',
      retryAfter: 3,
    });
  }
  next();
});

// 🛠 Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/history', require('./routes/history'));
app.use('/api/export', require('./routes/export'));

// ❌ Middleware d’erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 🚫 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// 🚀 Démarrage serveur
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

// 🧹 Arrêt propre
const shutdown = async (signal) => {
  console.log(`\n⚠️ ${signal} reçu, fermeture du serveur...`);
  server.close(async () => {
    console.log('🔒 HTTP server closed');
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
