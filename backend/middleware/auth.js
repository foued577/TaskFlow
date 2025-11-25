const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ===============================
// GENERATE TOKEN (FIX)
// ===============================
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// ===============================
// PROTECT MIDDLEWARE
// ===============================
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized - No token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Ancien user sans rôle = admin
    const userRole = user.role || "admin";

    req.user = {
      id: user._id,
      role: userRole,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized - Invalid token",
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
      message: "Access denied - admin only",
    });
  }
  next();
};
