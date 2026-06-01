const mongoose = require('mongoose');

const delegateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User account reference is required'],
      unique: true // A user account can only be linked to a single delegate profile
    },
    campus: {
      type: String,
      required: [true, 'Campus name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Unique delegate code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    assignedLeadsCount: {
      type: Number,
      default: 0
    },
    convertedLeadsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Delegate = mongoose.model('Delegate', delegateSchema);

module.exports = Delegate;
