const jwt = require('jsonwebtoken');
const User = require('../models/User');
// ===============================
// PROTECT MIDDLEWARE
// ===============================
exports.protect = async (req, res, next) => {
 let token;
 // Check for token in Authorization header
 if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
   token = req.headers.authorization.split(' ')[1];
 }
 if (!token) {
   return res.status(401).json({
     success: false,
     message: 'Not authorized to access this route'
   });
 }
 try {
   // Verify token
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   // Get user from token
   const user = await User.findById(decoded.id).select('-password');
   if (!user || !user.isActive) {
     return res.status(401).json({
       success: false,
       message: 'User not found or inactive'
     });
   }
   // Normalize role
   req.user = {
     id: user._id,
     role: user.role || "admin"
   };
   next();
 } catch (error) {
   return res.status(401).json({
     success: false,
     message: 'Invalid or expired token'
   });
 }
};
// ===============================
// ADMIN ONLY MIDDLEWARE
// ===============================
exports.adminOnly = (req, res, next) => {
 if (!req.user || req.user.role !== "admin") {
   return res.status(403).json({
     success: false,
     message: "Admin access only"
   });
 }
 next();
};
// ===============================
// GENERATE JWT TOKEN
// ===============================
exports.generateToken = (id) => {
 return jwt.sign({ id }, process.env.JWT_SECRET, {
   expiresIn: process.env.JWT_EXPIRE || '7d'
 });
};
