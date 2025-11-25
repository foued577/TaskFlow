const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },

    // 🆕 ROLE GLOBAL
    // - Tous les anciens utilisateurs sans rôle = admin par défaut
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'admin'
    },

    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    phone: { type: String, default: '' },
    lastLogin: Date,

    // Pour compatibilité avec /auth/me
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      }
    ]
  },
  {
    timestamps: true
  }
);

/**
 * 🛠️ IMPORTANT :
 * Si l'utilisateur n'a PAS de rôle (données anciennes), 
 * on considère automatiquement qu'il est ADMIN.
 */
userSchema.pre('save', function (next) {
  if (!this.role) {
    this.role = 'admin';
  }
  next();
});

/**
 * Hash du mot de passe
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Comparaison de mot de passe
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Nettoyage de l'output JSON
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
