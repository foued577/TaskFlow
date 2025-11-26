const User = require("../models/User");
const Team = require("../models/Team");
/**
* =============================================
* 🔍 SEARCH USERS
* @route   GET /api/users/search
* @access  Private
* =============================================
*/
exports.searchUsers = async (req, res) => {
 try {
   const { q, teamId } = req.query;
   let filter = {};
   // 1️⃣ Si pas de recherche → retourner TOUTES les utilisateurs
   if (!q || q.trim() === "") {
     filter = {};
   } else {
     // 2️⃣ Sinon filtrer par nom/prénom/email
     filter = {
       $or: [
         { firstName: { $regex: q, $options: "i" } },
         { lastName: { $regex: q, $options: "i" } },
         { email: { $regex: q, $options: "i" } }
       ]
     };
   }
   // 3️⃣ Exclure les membres existants d’une équipe (si utilisé dans Teams.js)
   if (teamId) {
     const team = await Team.findById(teamId).select("members.user");
     if (team) {
       const existingMembers = team.members.map((m) => m.user.toString());
       filter._id = { $nin: existingMembers };
     }
   }
   // 4️⃣ Récupération finale
   const users = await User.find(filter)
     .select("firstName lastName email avatar role");
   res.status(200).json({
     success: true,
     data: users,
   });
 } catch (error) {
   console.error("Search error:", error);
   res.status(500).json({
     success: false,
     message: "Error searching users",
   });
 }
};

/**
* =============================================
* 📄 GET SINGLE USER
* @route   GET /api/users/:id
* @access  Private
* =============================================
*/
exports.getUser = async (req, res) => {
 try {
   const user = await User.findById(req.params.id)
     .populate("teams", "name color");
   if (!user) {
     return res.status(404).json({
       success: false,
       message: "User not found",
     });
   }
   res.status(200).json({
     success: true,
     data: user,
   });
 } catch (error) {
   console.error("Get user error:", error);
   res.status(500).json({
     success: false,
     message: "Error getting user",
   });
 }
};
