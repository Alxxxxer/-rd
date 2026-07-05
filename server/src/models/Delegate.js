const mongoose = require('mongoose');

const delegateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Delegate name is required'],
      trim: true
    },
    campus: {
      type: String,
      required: [true, 'Campus/College name is required'],
      trim: true
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
    whatsapp: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'AGREED', 'DECLINED'],
      default: 'PENDING',
      index: true
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true, // Allows null / non-linked delegate leads to bypass uniqueness checks
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null
    },
    assignedLeadsCount: {
      type: Number,
      default: 0
    },
    convertedLeadsCount: {
      type: Number,
      default: 0
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
    timestamps: true
  }
);

// Compounded indexes for fast lookups by assigned sales executive & status
delegateSchema.index({ assignedTo: 1, status: 1 });

const Delegate = mongoose.model('Delegate', delegateSchema);

module.exports = Delegate;
