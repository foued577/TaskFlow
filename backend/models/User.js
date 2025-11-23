const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ------------------------------------------------------
// 🧩 Schéma utilisateur
// ------------------------------------------------------
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Le prénom est obligatoire"],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
      minlength: 6,
      select: false, // ne jamais envoyer le password dans la réponse
    },

    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member", // IMPORTANT : seul l'admin peut créer un user admin
    },

    phone: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },

    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// ------------------------------------------------------
// 🔐 Hash du mot de passe avant sauvegarde
// ------------------------------------------------------
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ------------------------------------------------------
// 🔑 Méthode pour comparer les mots de passe
// ------------------------------------------------------
userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
