const DelegateRepository = require('../repositories/DelegateRepository');
const ActivityLogRepository = require('../repositories/ActivityLogRepository');
const UserRepository = require('../repositories/UserRepository');
const AppError = require('../utils/errors');
const { ROLES } = require('../constants');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class DelegateService {
  async getAllDelegates(filters = {}, options = {}) {
    const queryFilter = {};

    if (filters.search) {
      queryFilter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { campus: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
        { code: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.status) {
      queryFilter.status = filters.status;
    }

    if (filters.assignedTo) {
      queryFilter.assignedTo = filters.assignedTo;
    }

    return await DelegateRepository.findAll(queryFilter, options);
  }

  async createDelegate(adminUser, delegateData) {
    const { name, campus, email, phone, whatsapp, department, status, code, userId, assignedTo } = delegateData;

    // 1. Verify target user exists if linking to a CRM user account
    let linkedUserId = null;
    if (userId) {
      const targetUser = await UserRepository.findById(userId);
      if (!targetUser) {
        throw new AppError('The linked user account does not exist.', 404);
      }
      
      const existingProfile = await DelegateRepository.findByUserId(userId);
      if (existingProfile) {
        throw new AppError('This user is already linked to another delegate profile.', 400);
      }
      linkedUserId = userId;
    }

    // 2. Validate Code uniqueness if supplied
    if (code) {
      const Delegate = mongoose.model('Delegate');
      const existingCode = await Delegate.findOne({ code: code.toUpperCase() });
      if (existingCode) {
        throw new AppError('A delegate with this code already exists.', 400);
      }
    }

    // 3. Create Delegate profile
    const delegate = await DelegateRepository.create({
      name,
      campus,
      email: email || '',
      phone: phone || '',
      whatsapp: whatsapp || '',
      department: department || '',
      status: status || 'PENDING',
      code: code ? code.toUpperCase() : undefined,
      user: linkedUserId || null,
      assignedTo: assignedTo || adminUser.id || null
    });

    // Log operational audit log
    await ActivityLogRepository.create({
      user: adminUser.id,
      action: 'DELEGATE_CREATE',
      details: {
        delegateId: delegate._id,
        name: delegate.name,
        campus: delegate.campus,
        code: delegate.code
      }
    });

    logger.info(`Delegate profile created for ${delegate.name} by ${adminUser.email}`);
    return delegate;
  }

  async updateDelegate(adminUser, id, updateData) {
    const currentProfile = await DelegateRepository.findById(id);
    if (!currentProfile) {
      throw new AppError('Delegate profile not found.', 404);
    }

    const { name, campus, email, phone, whatsapp, department, status, code, userId, assignedTo, noteText } = updateData;

    // 1. Verify target user if changing user link
    let linkedUserId = currentProfile.user?._id || currentProfile.user || null;
    if (userId !== undefined) {
      if (userId) {
        const targetUser = await UserRepository.findById(userId);
        if (!targetUser) {
          throw new AppError('The linked user account does not exist.', 404);
        }
        
        const existingProfile = await DelegateRepository.findByUserId(userId);
        if (existingProfile && existingProfile._id.toString() !== id) {
          throw new AppError('This user is already linked to another delegate profile.', 400);
        }
        linkedUserId = userId;
      } else {
        linkedUserId = null;
      }
    }

    // 2. Check code uniqueness if changed
    let normalizedCode = currentProfile.code;
    if (code !== undefined) {
      if (code) {
        const Delegate = mongoose.model('Delegate');
        const existingCode = await Delegate.findOne({ code: code.toUpperCase() });
        if (existingCode && existingCode._id.toString() !== id) {
          throw new AppError('A delegate with this code already exists.', 400);
        }
        normalizedCode = code.toUpperCase();
      } else {
        normalizedCode = undefined;
      }
    }

    const updates = {
      name: name !== undefined ? name : currentProfile.name,
      campus: campus !== undefined ? campus : currentProfile.campus,
      email: email !== undefined ? email : currentProfile.email,
      phone: phone !== undefined ? phone : currentProfile.phone,
      whatsapp: whatsapp !== undefined ? whatsapp : currentProfile.whatsapp,
      department: department !== undefined ? department : currentProfile.department,
      status: status !== undefined ? status : currentProfile.status,
      code: normalizedCode,
      user: linkedUserId,
      assignedTo: assignedTo !== undefined ? (assignedTo || null) : currentProfile.assignedTo?._id || currentProfile.assignedTo || null
    };

    // If a new comment/note is appended
    if (noteText && noteText.trim()) {
      await mongoose.model('Delegate').findByIdAndUpdate(id, {
        $push: {
          notes: {
            text: noteText.trim(),
            createdBy: adminUser.id
          }
        }
      });
    }

    const updatedProfile = await DelegateRepository.update(id, updates);

    // Log operational audit log
    await ActivityLogRepository.create({
      user: adminUser.id,
      action: 'DELEGATE_UPDATE',
      details: {
        delegateId: updatedProfile._id,
        name: updatedProfile.name,
        campus: updatedProfile.campus,
        code: updatedProfile.code,
        status: updatedProfile.status
      }
    });

    logger.info(`Delegate profile updated by ${adminUser.email}: ${updatedProfile.name}`);
    return updatedProfile;
  }

  async getDelegateById(id) {
    const delegate = await DelegateRepository.findById(id);
    if (!delegate) {
      throw new AppError('Delegate profile not found.', 404);
    }
    return delegate;
  }

  async getLeaderboard() {
    return await DelegateRepository.getLeaderboard();
  }

  // Recalculates stats self-healingly based on active Lead document counts
  async syncDelegateStats(delegateId) {
    if (!delegateId) return;

    try {
      const Lead = mongoose.model('Lead');

      // Count dynamic leads
      const assigned = await Lead.countDocuments({ delegate: delegateId });
      const converted = await Lead.countDocuments({ delegate: delegateId, status: 'CONVERTED' });

      await DelegateRepository.update(delegateId, {
        assignedLeadsCount: assigned,
        convertedLeadsCount: converted
      });

      logger.debug(`Synchronized stats for delegate ${delegateId}: Assigned=${assigned}, Converted=${converted}`);
    } catch (error) {
      logger.error(`Failed to synchronize stats for delegate ${delegateId}`, error);
    }
  }

  async importGoogleSheets(user, sheetUrl) {
    const https = require('https');
    const Delegate = mongoose.model('Delegate');

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
    
    // Find name column: must include 'name' or 'student' or 'delegate' but NOT containing college, campus, school, university
    const nameIdx = headers.findIndex(h => 
      (h.includes('name') || h === 'delegate' || h === 'student') && 
      !h.includes('college') && 
      !h.includes('campus') && 
      !h.includes('university') && 
      !h.includes('school')
    );
    const campusIdx = headers.findIndex(h => h.includes('campus') || h.includes('college') || h.includes('university') || h.includes('school'));
    const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
    const phoneIdx = headers.findIndex(h => 
      (h.includes('phone') || h.includes('contact') || h.includes('mobile') || h.includes('number')) && 
      !h.includes('whatsapp') && !h.includes('alt') && !h.includes('second')
    );
    const whatsappIdx = headers.findIndex(h => h.includes('whatsapp') || h.includes('alt') || h.includes('second') || h.includes('alternate'));
    const deptIdx = headers.findIndex(h => h.includes('dept') || h.includes('department') || h.includes('branch') || h.includes('course') || h.includes('stream') || h.includes('subject') || h.includes('year') || h.includes('class'));

    logger.info(`Google Sheets Delegate Import header mapping: Name Column='${rows[0][nameIdx] || 'Not Found'}', College Column='${rows[0][campusIdx] || 'Not Found'}'`);

    if (nameIdx === -1) {
      throw new AppError('Google Sheet must contain a "Name", "Student Name", or "Delegate Name" column.', 400);
    }

    if (campusIdx === -1) {
      throw new AppError('Google Sheet must contain a "College", "Campus", or "University" column.', 400);
    }

    let importedCount = 0;
    let skippedCount = 0;

    // 5. Process Rows
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0 || !row[nameIdx]) {
        continue;
      }

      const name = row[nameIdx].trim();
      if (!name) continue;

      const campus = row[campusIdx] ? row[campusIdx].trim() : '';
      if (!campus) continue;

      const email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx].trim().toLowerCase() : '';
      const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx].trim() : '';
      const whatsapp = whatsappIdx !== -1 && row[whatsappIdx] ? row[whatsappIdx].trim() : '';
      const department = deptIdx !== -1 && row[deptIdx] ? row[deptIdx].trim() : '';

      // Check duplicate
      const query = { name, campus };
      if (email) query.email = email;
      const existing = await Delegate.findOne(query);
      if (existing) {
        skippedCount++;
        continue;
      }

      // Create Delegate Lead
      await DelegateRepository.create({
        name,
        campus,
        email,
        phone,
        whatsapp,
        department,
        status: 'PENDING',
        assignedTo: user.id
      });

      importedCount++;
    }

    // 6. Create Activity Audit Log
    await ActivityLogRepository.create({
      user: user.id,
      action: 'DELEGATE_IMPORT',
      details: {
        source: 'Google Sheets',
        importedCount,
        skippedCount,
        sheetUrlExcerpt: sheetUrl.slice(0, 100)
      }
    });

    logger.info(`Google Sheets Delegate Import completed by ${user.email}. Imported: ${importedCount}, Skipped: ${skippedCount}`);

    return {
      success: true,
      count: importedCount,
      skipped: skippedCount
    };
  }
}

module.exports = new DelegateService();
