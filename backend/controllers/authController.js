const User = require('../models/User');
const jwt = require('jsonwebtoken');
const generateToken = (id) => {
 return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
exports.register = async (req, res) => {
 try {
   const { firstName, lastName, email, password } = req.body;
   let userExists = await User.findOne({ email });
   if (userExists)
     return res.status(400).json({ message: "Email déjà utilisé" });
   const user = await User.create({
     firstName,
     lastName,
     email,
     password,
   });
   res.status(201).json({
     success: true,
     data: user,
     token: generateToken(user._id)
   });
 } catch (err) {
   res.status(500).json({ message: "Erreur serveur" });
 }
};
exports.login = async (req, res) => {
 try {
   const { email, password } = req.body;
   const user = await User.findOne({ email }).select("+password");
   if (!user) return res.status(400).json({ message: "Invalid credentials" });
   const isMatch = await user.matchPassword(password);
   if (!isMatch)
     return res.status(400).json({ message: "Invalid credentials" });
   user.lastLogin = new Date();
   await user.save();
   res.json({
     success: true,
     data: user,
     token: generateToken(user._id),
   });
 } catch (err) {
   res.status(500).json({ message: "Erreur serveur" });
 }
};
exports.getMe = async (req, res) => {
 const user = await User.findById(req.user.id);
 res.json({ success: true, data: user });
};
