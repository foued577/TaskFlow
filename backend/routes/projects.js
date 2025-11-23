const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const { protect } = require("../middleware/auth");

// Toutes les routes nécessitent un token
router.use(protect);

router.route("/")
  .get(getProjects)
  .post(createProject); // Admin seulement (géré dans le controller)

router.route("/:id")
  .get(getProject)
  .put(updateProject)   // Admin seulement (géré dans le controller)
  .delete(deleteProject); // Admin seulement

module.exports = router;
