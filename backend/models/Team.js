const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
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
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
}, {
  timestamps: true
});

// Index for efficient queries
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ createdBy: 1 });

// Méthode pour vérifier si un utilisateur est admin de l'équipe
teamSchema.methods.isTeamAdmin = function(userId) {
  if (!userId) return false;
  
  // Le créateur est toujours admin
  if (this.createdBy && this.createdBy.toString() === userId.toString()) {
    return true;
  }
  
  // Vérifier dans les membres
  const member = this.members.find(m => {
    if (!m.user) return false;
    const userIdStr = userId.toString ? userId.toString() : String(userId);
    const memberUserIdStr = m.user.toString ? m.user.toString() : String(m.user);
    return memberUserIdStr === userIdStr;
  });
  
  return member && member.role === 'admin';
};

module.exports = mongoose.model('Team', teamSchema);
