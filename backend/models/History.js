const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted', 'assigned', 'completed', 'commented', 'attached_file']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['task', 'project', 'team', 'comment']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  entityName: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  changes: {
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
historySchema.index({ project: 1, createdAt: -1 });
historySchema.index({ user: 1, createdAt: -1 });
historySchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('History', historySchema);
