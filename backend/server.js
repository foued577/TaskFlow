const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// 🔥 Render nécessite ceci
app.set('trust proxy', 1);

// 🛡️ Helmet – CSP désactivé (sinon API casse)
app.use(
helmet({
contentSecurityPolicy: false,
crossOriginEmbedderPolicy: false,
})
);

// 🗜️ Compression
app.use(compression());

// 🚦 Rate Limit
const limiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 100,
});
app.use('/api/', limiter);

// 🌐 CORS Render
const allowedOrigins = [
"https://task-manager-frontend-63bv.onrender.com",
"http://localhost:3000",
];

app.use((req, res, next) => {
const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
res.header("Access-Control-Allow-Origin", origin);
}
res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
res.header("Access-Control-Allow-Credentials", "true");
if (req.method === "OPTIONS") return res.sendStatus(204);
next();
});

// 📦 Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📝 Logs dev
if (process.env.NODE_ENV === "development") {
app.use(morgan("dev"));
}

// 📂 Static uploads
app.use('/uploads', express.static('uploads'));

// 🔗 MongoDB
mongoose.set('strictQuery', false);

const connectDB = async () => {
try {
await mongoose.connect(process.env.MONGODB_URI, {
retryWrites: true,
retryReads: true,
serverSelectionTimeoutMS: 30000,
});
console.log("✅ MongoDB Connected");
} catch (err) {
console.error("❌ MongoDB Error:", err.message);
console.log("⏳ Retrying in 5s...");
setTimeout(connectDB, 5000);
}
};
connectDB();

// 🩺 Health
app.get('/api/health', (req, res) => {
res.json({
status: "OK",
db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
timestamp: new Date().toISOString(),
});
});

// ⛔ Bloquer si MongoDB pas prêt
app.use('/api/', (req, res, next) => {
if (req.path === "/health") return next();
if (mongoose.connection.readyState !== 1) {
return res.status(503).json({
success: false,
message: "Database reconnecting… Try again in a few seconds",
retryAfter: 3,
});
}
next();
});

// 🛠 Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/history', require('./routes/history'));
app.use('/api/export', require('./routes/export'));

// ✅ AJOUT ICI
app.use("/api/useful-links", require("./routes/usefulLinks"));

// ❌ Global Error Handler
app.use((err, req, res, next) => {
console.error("🔥 SERVER ERROR:", err.message);
res.status(err.status || 500).json({
success: false,
message: err.message || "Internal Server Error",
});
});

// ❌ 404
app.use((req, res) =>
res.status(404).json({ success: false, message: "Route not found" })
);

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
console.log(`🚀 Server running on port ${PORT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
