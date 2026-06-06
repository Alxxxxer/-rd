const mongoose = require('mongoose');
const { LEAD_STATUS, REVENUE_STATUS, PAYMENT_METHODS } = require('../constants');

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      index: true
    },
    source: {
      type: String,
      default: 'Manual',
      index: true
    },
    status: {
      type: String,
      enum: Object.values(LEAD_STATUS),
      default: LEAD_STATUS.NEW,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null
    },
    delegate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delegate',
      index: true,
      default: null
    },
    followUpDate: {
      type: Date,
      default: null,
      index: true
    },
    amount: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: Object.values(REVENUE_STATUS),
      default: REVENUE_STATUS.PENDING,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.PENDING,
      index: true
    },
    notes: [
      {
        text: {
          type: String,
          required: [true, 'Note text cannot be empty'],
          trim: true
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true // Tracks createdAt and updatedAt for lead histories
  }
);

// Apply composite index on assignedTo + status for optimized scoped queries
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ delegate: 1, status: 1 });

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
