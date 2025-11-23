const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    /**
     * ⚠️ Champ legacy : pour les anciens projets qui n'avaient qu'une seule équipe.
     * On le garde pour compatibilité, mais on n'exige plus "required: true".
     */
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: false,
    },
    /**
     * ✅ Nouveau champ : plusieurs équipes pour un même projet.
     */
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
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
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    color: {
      type: String,
      default: '#10B981',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);
// Indexes (ancien + nouveau schéma)
projectSchema.index({ team: 1, status: 1 });
projectSchema.index({ teams: 1, status: 1 });
projectSchema.index({ createdBy: 1 });
module.exports = mongoose.model('Project', projectSchema);
