const LeadRepository = require('../repositories/LeadRepository');
const ActivityLogRepository = require('../repositories/ActivityLogRepository');
const AppError = require('../utils/errors');
const { ROLES, LEAD_STATUS } = require('../constants');
const logger = require('../utils/logger');

class LeadService {
  async getAllLeads(user, filters = {}, options = {}) {
    const queryFilter = {};

    // 1. Enforce Role-Based Query Scoping (Data Isolation)
    if (user.role === ROLES.SALES_EXECUTIVE) {
      queryFilter.assignedTo = user.id;
    } else if (filters.assignedTo) {
      queryFilter.assignedTo = filters.assignedTo;
    }

    // 2. Build search parameters
    if (filters.search) {
      queryFilter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.status) {
      queryFilter.status = filters.status;
    }

    if (filters.source) {
      queryFilter.source = filters.source;
    }

    return await LeadRepository.findAll(queryFilter, options);
  }

  async createLead(user, leadData) {
    const { name, email, phone, source, status, assignedTo, delegate, followUpDate, initialNote } = leadData;

    // Build the initial notes array if provided
    const notes = [];
    if (initialNote) {
      notes.push({
        text: initialNote,
        createdBy: user.id
      });
    }

    // Create lead record
    const lead = await LeadRepository.create({
      name,
      email,
      phone,
      source,
      status: status || LEAD_STATUS.NEW,
      assignedTo: assignedTo || null,
      delegate: delegate || null,
      followUpDate: followUpDate || null,
      notes
    });

    // Log operational audit log
    await ActivityLogRepository.create({
      user: user.id,
      action: 'LEAD_CREATE',
      details: {
        leadId: lead._id,
        leadName: lead.name,
        assignedTo: lead.assignedTo
      }
    });

    logger.info(`Lead created by ${user.email}: ${lead.name}`);

    // Trigger Delegate recounts self-healingly
    if (lead.delegate) {
      const DelegateService = require('./DelegateService');
      await DelegateService.syncDelegateStats(lead.delegate);
    }

    return lead;
  }

  async updateLead(user, leadId, updateData) {
    // 1. Fetch current lead state
    const lead = await LeadRepository.findById(leadId);
    if (!lead) {
      throw new AppError('Lead record not found.', 404);
    }

    // 2. Enforce scope limitations for Sales Executives
    if (user.role === ROLES.SALES_EXECUTIVE) {
      const isAssigned = lead.assignedTo?._id?.toString() === user.id.toString();
      if (!isAssigned) {
        throw new AppError('Forbidden: You are only permitted to modify assigned lead records.', 403);
      }
    }

    // 3. Prevent Sales Executives from changing assignment
    const updatedFields = { ...updateData };
    if (user.role === ROLES.SALES_EXECUTIVE) {
      delete updatedFields.assignedTo; // Silently strip assignment overrides
      delete updatedFields.delegate; // Silently strip delegate overrides
    }

    // 4. Update Database
    const updatedLead = await LeadRepository.update(leadId, updatedFields);

    // 5. Log change audit log
    await ActivityLogRepository.create({
      user: user.id,
      action: 'LEAD_UPDATE',
      details: {
        leadId: updatedLead._id,
        leadName: updatedLead.name,
        updatedFields
      }
    });

    logger.info(`Lead updated by ${user.email}: ${updatedLead.name}`);

    // Trigger Delegate recounts self-healingly on both old and new delegate profiles
    const DelegateService = require('./DelegateService');
    if (lead.delegate) {
      await DelegateService.syncDelegateStats(lead.delegate);
    }
    if (updatedLead.delegate && updatedLead.delegate.toString() !== lead.delegate?.toString()) {
      await DelegateService.syncDelegateStats(updatedLead.delegate);
    }

    return updatedLead;
  }

  async addLeadNote(user, leadId, noteText) {
    const lead = await LeadRepository.findById(leadId);
    if (!lead) {
      throw new AppError('Lead record not found.', 404);
    }

    // Enforce Scope limitation for Sales Executives
    if (user.role === ROLES.SALES_EXECUTIVE) {
      const isAssigned = lead.assignedTo?._id?.toString() === user.id.toString();
      if (!isAssigned) {
        throw new AppError('Forbidden: You can only append comments to assigned lead records.', 403);
      }
    }

    // Push comment log into sub-array
    lead.notes.push({
      text: noteText,
      createdBy: user.id
    });

    await lead.save();

    // Log action event
    await ActivityLogRepository.create({
      user: user.id,
      action: 'LEAD_NOTE_ADD',
      details: {
        leadId: lead._id,
        noteExcerpt: noteText.slice(0, 50)
      }
    });

    logger.info(`Comment added to lead ${lead.name} by ${user.email}`);

    // Return populated lead to keep UI in-sync
    return await LeadRepository.findById(leadId);
  }

  async deleteLead(user, leadId) {
    // 1. Enforce Administrative locking
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user.role)) {
      throw new AppError('Forbidden: Only Administrators have clearances to delete leads.', 403);
    }

    // 2. Perform hard deletion
    const lead = await LeadRepository.delete(leadId);
    if (!lead) {
      throw new AppError('Lead record not found.', 404);
    }

    // Trigger Delegate recounts self-healingly
    if (lead.delegate) {
      const DelegateService = require('./DelegateService');
      await DelegateService.syncDelegateStats(lead.delegate);
    }

    // 3. Log audit event
    await ActivityLogRepository.create({
      user: user.id,
      action: 'LEAD_DELETE',
      details: {
        leadId: lead._id,
        leadName: lead.name
      }
    });

    logger.info(`Lead deleted by ${user.email}: ${lead.name}`);
    return { success: true, message: 'Lead record has been successfully deleted.' };
  }
}

module.exports = new LeadService();
