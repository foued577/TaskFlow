const express = require("express");
const router = express.Router();
const { searchUsers, getUser } = require("../controllers/userController.js");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");
// =====================================================
// 🔍 Search users
// =====================================================
router.get("/search", protect, searchUsers);
// =====================================================
// 📄 Get user by ID
// =====================================================
router.get("/:id", protect, getUser);
// =====================================================
// ➕ Create user (ADMIN)
// =====================================================
router.post("/", protect, adminOnly, async (req, res) => {
 try {
   const { firstName, lastName, email, password, role } = req.body;
   if (!firstName || !lastName || !email || !password) {
     return res.status(400).json({
       success: false,
       message: "Missing required fields",
     });
   }
   const exists = await User.findOne({ email });
   if (exists) {
     return res.status(400).json({
       success: false,
       message: "User already exists",
     });
   }
   const user = await User.create({
     firstName,
     lastName,
     email,
     password,
     role: role || "member",
   });
   res.status(201).json({
     success: true,
     data: user,
   });
 } catch (error) {
   console.error("Create user error:", error);
   res.status(500).json({
     success: false,
     message: "Error creating user",
   });
 }
});
// =====================================================
// 🔄 Update user role (ADMIN)
// =====================================================
router.put("/:id/role", protect, adminOnly, async (req, res) => {
 try {
   const { role } = req.body;
   if (!["admin", "member"].includes(role)) {
     return res.status(400).json({
       success: false,
       message: "Invalid role",
     });
   }
   const user = await User.findById(req.params.id);
   if (!user) {
     return res.status(404).json({
       success: false,
       message: "User not found",
     });
   }
   user.role = role;
   await user.save();
   res.status(200).json({
     success: true,
     data: user,
   });
 } catch (error) {
   console.error("Role update error:", error);
   res.status(500).json({
     success: false,
     message: "Error updating role",
   });
 }
});
module.exports = router;
