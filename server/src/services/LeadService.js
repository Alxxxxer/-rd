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
    const { name, email, phone, source, status, assignedTo, delegate, followUpDate, initialNote, amount, paymentStatus, paymentMethod } = leadData;

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
      amount: amount || 0,
      paymentStatus: paymentStatus || 'PENDING',
      paymentMethod: paymentMethod || 'PENDING',
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

  async importGoogleSheets(user, sheetUrl) {
    const https = require('https');
    const Delegate = require('../models/Delegate');
    const User = require('../models/User');
    const Lead = require('../models/Lead');
    const DelegateService = require('./DelegateService');

    // 1. Convert URL to CSV export format
    let exportUrl = sheetUrl.trim();
    const match = exportUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
    } else if (exportUrl.includes('pub?') && !exportUrl.includes('output=csv') && !exportUrl.includes('format=csv')) {
      exportUrl = exportUrl.replace(/(\?|&)output=[^&]*/, '').replace(/(\?|&)format=[^&]*/, '') + '&output=csv';
    }

    // 2. Fetch CSV Content with redirect handling
    const fetchCSV = (url) => {
      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return fetchCSV(res.headers.location).then(resolve).catch(reject);
          }
          if (res.statusCode !== 200) {
            return reject(new AppError(`Failed to fetch Google Sheet: HTTP Status ${res.statusCode}`, 400));
          }
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => resolve(data));
        }).on('error', (err) => reject(new AppError(`Network error fetching Google Sheet: ${err.message}`, 400)));
      });
    };

    const csvText = await fetchCSV(exportUrl);

    // 3. Custom CSV parser
    const parseCSV = (text) => {
      const lines = [];
      let row = [""];
      let insideQuote = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (insideQuote && nextChar === '"') {
            row[row.length - 1] += '"';
            i++;
          } else {
            insideQuote = !insideQuote;
          }
        } else if (char === ',') {
          if (insideQuote) {
            row[row.length - 1] += char;
          } else {
            row.push("");
          }
        } else if (char === '\n' || char === '\r') {
          if (insideQuote) {
            row[row.length - 1] += char;
          } else {
            if (char === '\r' && nextChar === '\n') {
              i++;
            }
            lines.push(row);
            row = [""];
          }
        } else {
          row[row.length - 1] += char;
        }
      }
      if (row.length > 1 || row[0] !== "") {
        lines.push(row);
      }
      return lines;
    };

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      throw new AppError('Google Sheet contains no headers or data rows.', 400);
    }

    // 4. Resolve Columns
    const headers = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const nameIdx = headers.findIndex(h => h.includes('name') || h === 'prospect' || h === 'lead');
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
    const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('contact') || h.includes('mobile') || h.includes('number'));
    const campusIdx = headers.findIndex(h => h.includes('campus') || h.includes('college') || h.includes('university') || h.includes('code') || h.includes('delegate'));
    const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('stage'));
    const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('deal') || h.includes('price') || h.includes('value') || h.includes('revenue') || h.includes('fee'));
    const noteIdx = headers.findIndex(h => h.includes('note') || h.includes('comment') || h.includes('remark'));
    const assignedIdx = headers.findIndex(h => h.includes('assigned') || h.includes('owner') || h.includes('executive'));

    if (nameIdx === -1) {
      throw new AppError('Google Sheet must contain a "Name" or "Lead Name" column.', 400);
    }

    // 5. Pre-fetch Delegates and Users for quick lookup
    const delegates = await Delegate.find({});
    const delegateMap = new Map();
    delegates.forEach(d => {
      if (d.code) delegateMap.set(d.code.toUpperCase(), d._id);
      if (d.campus) delegateMap.set(d.campus.toLowerCase(), d._id);
    });

    const users = await User.find({});
    const userMap = new Map();
    users.forEach(u => {
      if (u.email) userMap.set(u.email.toLowerCase(), u._id);
      if (u.name) userMap.set(u.name.toLowerCase(), u._id);
    });

    const normalizeStatus = (val) => {
      if (!val) return 'NEW';
      const s = val.trim().toUpperCase().replace(/[^A-Z]/g, '');
      if (s === 'NEW') return 'NEW';
      if (s.includes('CONTACT') || s === 'CONTACTED') return 'CONTACTED';
      if (s.includes('PROGRESS') || s === 'INPROGRESS' || s.includes('TALK') || s.includes('DISCUSS')) return 'IN_PROGRESS';
      if (s.includes('CONVERT') || s === 'CONVERTED' || s.includes('WON') || s.includes('SUCCESS') || s.includes('PAID')) return 'CONVERTED';
      if (s.includes('LOST') || s.includes('FAIL') || s.includes('CLOSE') || s.includes('DROP')) return 'LOST';
      return 'NEW';
    };

    let importedCount = 0;
    let skippedCount = 0;
    const modifiedDelegates = new Set();

    // 6. Process Rows
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0 || !row[nameIdx]) {
        continue;
      }

      const name = row[nameIdx].trim();
      if (!name) continue;

      const email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx].trim().toLowerCase() : '';
      const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx].trim() : '';

      // Check if lead already exists to prevent duplicates
      const query = { name };
      if (email) query.email = email;
      const existing = await Lead.findOne(query);
      if (existing) {
        skippedCount++;
        continue;
      }

      // Resolve Campus Delegate
      let delegateId = null;
      if (campusIdx !== -1 && row[campusIdx]) {
        const campusVal = row[campusIdx].trim();
        delegateId = delegateMap.get(campusVal.toUpperCase()) || delegateMap.get(campusVal.toLowerCase()) || null;
      }

      // Resolve Executive Owner (Only Super Admin/Admin/Manager can change owner, otherwise self)
      let assignedToId = user.id;
      if (['SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER'].includes(user.role) && assignedIdx !== -1 && row[assignedIdx]) {
        const ownerVal = row[assignedIdx].trim().toLowerCase();
        assignedToId = userMap.get(ownerVal) || user.id;
      }

      // Resolve Status
      const status = statusIdx !== -1 && row[statusIdx] ? normalizeStatus(row[statusIdx]) : 'NEW';

      // Resolve Amount
      let amount = 0;
      if (amountIdx !== -1 && row[amountIdx]) {
        const cleanAmount = row[amountIdx].replace(/[^0-9.]/g, '');
        amount = parseFloat(cleanAmount) || 0;
      }

      // Resolve Notes
      const notes = [];
      if (noteIdx !== -1 && row[noteIdx]) {
        const noteText = row[noteIdx].trim();
        if (noteText) {
          notes.push({
            text: noteText,
            createdBy: user.id
          });
        }
      }

      // Create Lead
      const newLead = await LeadRepository.create({
        name,
        email,
        phone,
        source: 'Google Sheets',
        status,
        assignedTo: assignedToId,
        delegate: delegateId,
        amount,
        notes
      });

      if (delegateId) {
        modifiedDelegates.add(delegateId.toString());
      }

      importedCount++;
    }

    // 7. Recalculate stats for any modified delegates
    for (const delId of modifiedDelegates) {
      await DelegateService.syncDelegateStats(delId);
    }

    // 8. Create Activity Audit Log
    await ActivityLogRepository.create({
      user: user.id,
      action: 'LEAD_IMPORT',
      details: {
        source: 'Google Sheets',
        importedCount,
        skippedCount,
        sheetUrlExcerpt: sheetUrl.slice(0, 100)
      }
    });

    logger.info(`Google Sheets Lead Import completed by ${user.email}. Imported: ${importedCount}, Skipped: ${skippedCount}`);

    return {
      success: true,
      count: importedCount,
      skipped: skippedCount
    };
  }
}

module.exports = new LeadService();
