const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// MongoDB Connection with enhanced auto-reconnect for Atlas
mongoose.set('bufferCommands', false);    // Don't buffer commands if connection is lost
mongoose.set('bufferTimeoutMS', 30000);   // 30s timeout for Atlas
mongoose.set('strictQuery', false);       // Prepare for Mongoose 7

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // Timeouts optimisés pour MongoDB Atlas
      serverSelectionTimeoutMS: 30000,  // 30s pour Atlas
      connectTimeoutMS: 30000,           // 30s timeout initial
      
      // Heartbeat et retry
      heartbeatFrequencyMS: 10000,       // Check toutes les 10s (plus stable pour Atlas)
      retryWrites: true,
      retryReads: true,
      
      // Pool de connexions (keepAlive est géré automatiquement dans Mongoose 8+)
      maxPoolSize: 10,
      minPoolSize: 5,                    // 5 connexions minimum toujours actives
      maxIdleTimeMS: 60000,              // Fermer les connexions inactives après 1 min
      
      // Autres
      family: 4
    });
    console.log('✅ MongoDB Atlas Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
  // Don't exit, let the reconnection logic handle it
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
  console.log('🔄 Attempting immediate reconnection...');
  // Try to reconnect immediately
  connectDB();
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Mongoose reconnected to MongoDB');
});

// Initial connection
connectDB();

// Middleware to check DB connection before processing requests
app.use('/api/', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ Request received but MongoDB not connected, returning 503');
    return res.status(503).json({ 
      success: false, 
      message: 'Service temporarily unavailable. Database is reconnecting...',
      retryAfter: 3
    });
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/history', require('./routes/history'));
app.use('/api/export', require('./routes/export'));

// Health check with MongoDB status
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️ SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('🔒 HTTP server closed');
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('🔒 HTTP server closed');
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;
