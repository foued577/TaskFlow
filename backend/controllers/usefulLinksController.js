const UsefulLink = require("../models/UsefulLink");

// GET ALL
exports.getLinks = async (req, res) => {
try {
const filter = req.user.role === "admin"
? {} // Admin → tout voir
: { assignedTo: req.user.id }; // Membre → uniquement liens assignés

const links = await UsefulLink.find(filter)
.populate("assignedTo", "firstName lastName email")
.populate("createdBy", "firstName lastName");

res.json({ success: true, data: links });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// CREATE
exports.createLink = async (req, res) => {
try {
const link = await UsefulLink.create({
...req.body,
createdBy: req.user.id
});

res.json({ success: true, data: link });
} catch (error) {
res.status(400).json({ success: false, message: error.message });
}
};

// UPDATE (NEW)
exports.updateLink = async (req, res) => {
try {
const link = await UsefulLink.findByIdAndUpdate(
req.params.id,
req.body,
{ new: true }
);

res.json({ success: true, data: link });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};

// DELETE
exports.deleteLink = async (req, res) => {
try {
await UsefulLink.findByIdAndDelete(req.params.id);
res.json({ success: true, message: "Link deleted" });
} catch (error) {
res.status(500).json({ success: false, message: error.message });
}
};
