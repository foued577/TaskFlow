const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Nouveau : rôle dans l’équipe
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },

  joinedAt: {
    type: Date,
    default: Date.now
  }
});

// IMPORTANT : anciens membres sans rôle → admin par défaut
teamMemberSchema.pre('save', function (next) {
  if (!this.role) {
    this.role = 'admin';
  }
  next();
});

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true
    },

    description: {
      type: String,
      default: '',
      maxlength: 1000
    },

    members: [teamMemberSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    color: {
      type: String,
      default: '#3B82F6'
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index pour recherche rapide
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Team', teamSchema);
