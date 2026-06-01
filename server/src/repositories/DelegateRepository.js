const Delegate = require('../models/Delegate');

class DelegateRepository {
  async findById(id) {
    return await Delegate.findById(id).populate('user', 'name email role status');
  }

  async findByUserId(userId) {
    return await Delegate.findOne({ user: userId }).populate('user', 'name email role status');
  }

  async create(delegateData) {
    const delegate = new Delegate(delegateData);
    return await delegate.save();
  }

  async update(id, updateData) {
    return await Delegate.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('user', 'name email role status');
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const query = Delegate.find(filter)
      .populate('user', 'name email role status')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Delegate.countDocuments(filter);
    const delegates = await query;

    return {
      delegates,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  }

  async getLeaderboard(limitNumber = 20) {
    return await Delegate.find({})
      .populate('user', 'name email role')
      .sort({ convertedLeadsCount: -1, assignedLeadsCount: -1 })
      .limit(limitNumber);
  }
}

module.exports = new DelegateRepository();
