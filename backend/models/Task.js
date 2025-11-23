const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Le titre de la tâche est obligatoire"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    subtasks: [subtaskSchema],

    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Avant sauvegarde, enlever les doublons dans assignedTo
taskSchema.pre("save", function (next) {
  if (this.assignedTo && Array.isArray(this.assignedTo)) {
    this.assignedTo = [...new Set(this.assignedTo.map((id) => id.toString()))];
  }
  next();
});

module.exports = mongoose.model("Task", taskSchema);
