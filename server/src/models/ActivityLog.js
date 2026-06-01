const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null // Null represents anonymous operations, e.g. failed login attempts
    },
    action: {
      type: String,
      required: [true, 'Action name is required'],
      trim: true,
      index: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Only need track creation time
  }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
