const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'équipe est obligatoire"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      default: "#3B82F6", // Bleu
    },

    members: [teamMemberSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Tous les projets liés à cette équipe
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Empêche les doublons dans les membres
teamSchema.pre("save", function (next) {
  if (this.members && Array.isArray(this.members)) {
    const unique = [];
    const seen = new Set();

    this.members.forEach((m) => {
      const id = m.user.toString();
      if (!seen.has(id)) {
        seen.add(id);
        unique.push(m);
      }
    });

    this.members = unique;
  }
  next();
});

// Vérifier si un utilisateur est admin d'équipe
teamSchema.methods.isTeamAdmin = function (userId) {
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  if (!member) return false;
  return member.role === "admin";
};

module.exports = mongoose.model("Team", teamSchema);
