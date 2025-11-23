const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom du projet est obligatoire"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    // Plusieurs équipes possibles
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    color: {
      type: String,
      default: "#10B981", // vert par défaut
    },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
