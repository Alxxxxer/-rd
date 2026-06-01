const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, USER_STATUS } = require('../constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false // Exclude from query results by default for security
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.SALES_EXECUTIVE,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpire: {
      type: Date,
      default: null
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true // Automatically manages createdAt and updatedAt fields
  }
);

// Hash password before saving if it has been modified (or is new)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12); // Production-grade strength
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with hashed password in database
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
