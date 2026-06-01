const ActivityLog = require('../models/ActivityLog');

class ActivityLogRepository {
  async create(logData) {
    const log = new ActivityLog(logData);
    return await log.save();
  }

  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const query = ActivityLog.find({ user: userId })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments({ user: userId });
    const logs = await query;

    return {
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const query = ActivityLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments(filter);
    const logs = await query;

    return {
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = new ActivityLogRepository();
