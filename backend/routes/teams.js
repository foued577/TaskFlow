const express = require("express");
const router = express.Router();
const {
 getTeams,
 getTeam,
 createTeam,
 updateTeam,
 deleteTeam,
 addMember,
 removeMember,
} = require("../controllers/teamController");
const { protect } = require("../middleware/auth");
// ====================================================
// Toutes les routes nécessitent d’être authentifié
// ====================================================
// Lire les équipes
router.get("/", protect, getTeams);
router.get("/:id", protect, getTeam);
// CRUD équipe
router.post("/", protect, createTeam);
router.put("/:id", protect, updateTeam);
router.delete("/:id", protect, deleteTeam);   // ✅ Ajout route suppression
// Gestion des membres
router.post("/:id/members", protect, addMember);
router.delete("/:id/members/:userId", protect, removeMember);
module.exports = router;
