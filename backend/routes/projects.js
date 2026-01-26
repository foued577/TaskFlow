const express = require('express');
const router = express.Router();

const {
getProjects,
getProject,
createProject,
updateProject,
deleteProject
} = require('../controllers/projectController');

const { protect } = require('../middleware/auth');

// ✅ Guard: si une fonction est undefined, on crash avec un message clair
const ensureFn = (fn, name) => {
if (typeof fn !== "function") {
throw new Error(`[projects routes] Controller function "${name}" is undefined. Check exports in projectController.js`);
}
return fn;
};

// ==================================================
// Toutes les routes projets → authentification requise
// ==================================================

router.get('/', protect, ensureFn(getProjects, "getProjects"));
router.get('/:id', protect, ensureFn(getProject, "getProject"));

router.post('/', protect, ensureFn(createProject, "createProject"));
router.put('/:id', protect, ensureFn(updateProject, "updateProject"));
router.delete('/:id', protect, ensureFn(deleteProject, "deleteProject"));

module.exports = router;
