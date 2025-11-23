const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ------------------------------------------------------
// 🔒 Middleware : Authentification par token
// ------------------------------------------------------
exports.protect = async (req, res, next) => {
  let token;

  // Vérification du header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token)
    return res.status(401).json({ message: "Accès non autorisé, token manquant" });

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Charger l'utilisateur lié au token
    req.user = await User.findById(decoded.id);

    if (!req.user)
      return res
        .status(401)
        .json({ message: "Utilisateur associé au token introuvable" });

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

// ------------------------------------------------------
// 🔐 Middleware : Vérification du rôle admin
// ------------------------------------------------------
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin")
    return res.status(403).json({
      message: "Accès refusé : Administrateurs uniquement",
    });

  next();
};
