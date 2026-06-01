const User = require('../models/User');

class UserRepository {
  async findByEmail(email, selectPassword = false) {
    let query = User.findOne({ email });
    if (selectPassword) {
      query = query.select('+password');
    }
    return await query;
  }

  async findById(id) {
    return await User.findById(id);
  }

  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
  }

  async findByResetToken(token) {
    return await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const query = User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);
    const users = await query;

    return {
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = new UserRepository();
