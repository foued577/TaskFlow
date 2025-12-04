const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
getLinks,
createLink,
updateLink,
deleteLink
} = require("../controllers/usefulLinksController");

router.get("/", protect, getLinks);
router.post("/", protect, adminOnly, createLink);
router.put("/:id", protect, adminOnly, updateLink); // ← NEW
router.delete("/:id", protect, adminOnly, deleteLink);

module.exports = router;
