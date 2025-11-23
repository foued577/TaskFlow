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

    teamIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    color: {
      type: String,
      default: "#10B981",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Empêche les doublons de tags en transformant en minuscules
projectSchema.pre("save", function (next) {
  if (this.tags && Array.isArray(this.tags)) {
    this.tags = [...new Set(this.tags.map((t) => t.toLowerCase()))];
  }
  next();
});

module.exports = mongoose.model("Project", projectSchema);
