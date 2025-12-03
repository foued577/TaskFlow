const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { getLinks, createLink, deleteLink } = require("../controllers/usefulLinksController");
router.get("/", protect, getLinks);
router.post("/", protect, adminOnly, createLink);
router.delete("/:id", protect, adminOnly, deleteLink);
module.exports = router;
