const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { parse } = require("csv-parse/sync");

const Task = require("../models/Task");
const Project = require("../models/Project"); // si tu relies une tâche à un projet

function normalizeRow(row) {
  // map flexible: supporte title/Title/Titre etc
  const title = row.title || row.Title || row.titre || row.Titre;
  return {
    title: title?.trim(),
    description: row.description || row.Description || "",
    status: row.status || row.Status || "TODO",
    priority: row.priority || row.Priority || "MEDIUM",
    dueDate: row.dueDate || row.DueDate || row.date || null,
    projectName: row.project || row.Project || row.projet || null,
  };
}

exports.importTasks = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Fichier manquant" });

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let rows = [];

    if (ext === ".csv") {
      const content = fs.readFileSync(filePath);
      rows = parse(content, { columns: true, skip_empty_lines: true });
    } else if (ext === ".xlsx" || ext === ".xls") {
      const wb = xlsx.readFile(filePath);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = xlsx.utils.sheet_to_json(sheet);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Format non supporté (CSV/XLSX seulement)" });
    }

    const errors = [];
    const tasksToCreate = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const data = normalizeRow(raw);

      if (!data.title) {
        errors.push({ row: i + 2, field: "title", message: "Titre obligatoire" });
        continue;
      }

      // parse date si fournie
      let dueDate = null;
      if (data.dueDate) {
        const d = new Date(data.dueDate);
        if (isNaN(d.getTime())) {
          errors.push({ row: i + 2, field: "dueDate", message: "Date invalide" });
          continue;
        }
        dueDate = d;
      }

      // option: retrouver projectId via projectName
      let projectId = null;
      if (data.projectName) {
        const p = await Project.findOne({ name: data.projectName.trim() });
        if (!p) {
          errors.push({ row: i + 2, field: "project", message: `Projet introuvable: ${data.projectName}` });
          continue;
        }
        projectId = p._id;
      }

      tasksToCreate.push({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate,
        project: projectId,
        createdBy: req.user?.id, // selon ton auth
      });
    }

    if (tasksToCreate.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Aucune tâche valide", errors });
    }

    const created = await Task.insertMany(tasksToCreate);

    fs.unlinkSync(filePath);

    return res.json({
      created: created.length,
      failed: errors.length,
      errors,
    });
  } catch (e) {
    return res.status(500).json({ message: "Erreur import", error: e.message });
  }
};
