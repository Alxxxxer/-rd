const Lead = require('../models/Lead');

class LeadRepository {
  async findById(id) {
    return await Lead.findById(id)
      .populate('assignedTo', 'name email role')
      .populate('delegate', 'campus code')
      .populate('notes.createdBy', 'name role email');
  }

  async create(leadData) {
    const lead = new Lead(leadData);
    return await lead.save();
  }

  async update(id, updateData) {
    return await Lead.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('assignedTo', 'name email role')
      .populate('delegate', 'campus code')
      .populate('notes.createdBy', 'name role email');
  }

  async delete(id) {
    return await Lead.findByIdAndDelete(id);
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const query = Lead.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('delegate', 'campus code')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Lead.countDocuments(filter);
    const leads = await query;

    return {
      leads,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = new LeadRepository();
