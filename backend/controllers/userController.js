const User = require("../models/User");
const Team = require("../models/Team");
const Project = require("../models/Project");
const Task = require("../models/Task");

/**
* =============================================
* 🔍 SEARCH USERS
* GET /api/users/search
* =============================================
*/
exports.searchUsers = async (req, res) => {
try {
const { q, teamId } = req.query;
let filter = {};

if (q && q.trim() !== "") {
filter = {
$or: [
{ firstName: { $regex: q, $options: "i" } },
{ lastName: { $regex: q, $options: "i" } },
{ email: { $regex: q, $options: "i" } },
],
};
}

if (teamId) {
const team = await Team.findById(teamId).select("members.user");
if (team) {
const existing = team.members.map((m) => m.user.toString());
filter._id = { $nin: existing };
}
}

const users = await User.find(filter).select(
"firstName lastName email avatar role"
);

res.status(200).json({ success: true, data: users });
} catch (error) {
console.error("Search users error:", error);
res.status(500).json({ success: false, message: "Error searching users" });
}
};

/**
* =============================================
* 📄 GET SINGLE USER
* GET /api/users/:id
* =============================================
*/
exports.getUser = async (req, res) => {
try {
const user = await User.findById(req.params.id).populate("teams", "name");
if (!user)
return res
.status(404)
.json({ success: false, message: "User not found" });

res.status(200).json({ success: true, data: user });
} catch (error) {
console.error("Get user error:", error);
res.status(500).json({ success: false, message: "Error getting user" });
}
};

/**
* =============================================
* ❌ DELETE USER
* DELETE /api/users/:id
* Admin only
* =============================================
*/
exports.deleteUser = async (req, res) => {
try {
const { id } = req.params;

// 🔐 Only global admin can delete users
if (req.user.role !== "admin") {
return res.status(403).json({
success: false,
message: "Only admins can delete users",
});
}

const user = await User.findById(id);
if (!user)
return res
.status(404)
.json({ success: false, message: "User not found" });

// 1️⃣ Remove user from TEAMS
await Team.updateMany(
{ "members.user": id },
{ $pull: { members: { user: id } } }
);

// 2️⃣ Remove user from PROJECTS
await Project.updateMany({ members: id }, { $pull: { members: id } });

// 3️⃣ Remove user from TASKS (assigned)
await Task.updateMany(
{ assignedTo: id },
{ $set: { assignedTo: null } }
);

// 4️⃣ Delete user
await User.findByIdAndDelete(id);

res.status(200).json({
success: true,
message: "User successfully deleted",
});
} catch (error) {
console.error("Delete user error:", error);
res.status(500).json({ success: false, message: "Error deleting user" });
}
};
